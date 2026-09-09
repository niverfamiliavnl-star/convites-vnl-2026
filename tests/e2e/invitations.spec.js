import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const configSource = readFileSync(new URL("../../shared/event-config.js", import.meta.url), "utf8")
  .replace(
    /endpoint:\s*"https:\/\/script\.google\.com\/macros\/s\/[^\"]+\/exec"/,
    'endpoint: "https://script.google.com/macros/s/test-deployment/exec"',
  );

async function mockBackend(page, { open = true, statusDelay = 0, submitDelay = 0, noStatusReply = false } = {}) {
  let effectiveConfig = configSource;
  if (noStatusReply) effectiveConfig = effectiveConfig.replace(/statusTimeoutMs:\s*30000/, "statusTimeoutMs: 100");
  await page.route("**/shared/event-config.js", (route) => route.fulfill({ contentType: "text/javascript", body: effectiveConfig }));
  await page.route("https://script.google.com/macros/s/test-deployment/exec**", async (route) => {
    const request = route.request();
    const params = request.method() === "POST"
      ? new URLSearchParams(request.postData() || "")
      : new URL(request.url()).searchParams;
    const isStatus = request.method() === "GET";
    if (isStatus && noStatusReply) { await route.abort(); return; }
    await new Promise((resolve) => setTimeout(resolve, isStatus ? statusDelay : submitDelay));
    const result = {
      type: "VNL_RSVP_RESULT",
      request_id: params.get("request_id"),
      ok: isStatus ? true : open,
      code: isStatus ? "STATUS" : (open ? "RECORDED" : "CLOSED"),
      message: "",
      rsvp_open: open,
    };
    await route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><script>(function(m){var w=window;for(var i=0;i<5;i++){w.postMessage(m,"*");if(w===w.parent)break;w=w.parent;}})(${JSON.stringify(result)})</script>`,
    });
  });
}

async function mockAudio(page, { rejectPlay = false, rejectPlayOnce = false, controllableVisibility = false } = {}) {
  await page.addInitScript(({ rejectPlay, rejectPlayOnce, controllableVisibility }) => {
    window.__audioPlayCalls = 0;
    window.__audioPauseCalls = 0;
    if (controllableVisibility) {
      window.__documentHidden = false;
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => window.__documentHidden,
      });
    }
    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get() { return this.dataset.testPlaying !== "true"; },
    });
    HTMLMediaElement.prototype.play = function play() {
      window.__audioPlayCalls += 1;
      if (rejectPlay || (rejectPlayOnce && window.__audioPlayCalls === 1)) {
        return Promise.reject(new DOMException("blocked", "NotAllowedError"));
      }
      this.dataset.testPlaying = "true";
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {
      window.__audioPauseCalls += 1;
      this.dataset.testPlaying = "false";
    };
  }, { rejectPlay, rejectPlayOnce, controllableVisibility });
}

async function mockWebAudio(page, { unavailable = false } = {}) {
  await page.addInitScript(({ unavailable }) => {
    window.__noahAudioContexts = 0;
    window.__noahAudioStarts = 0;
    window.__noahAudioResumes = 0;
    window.__noahAudioSuspends = 0;
    if (unavailable) {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
      Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
      return;
    }
    class MockAudioParam {
      setValueAtTime() {}
      exponentialRampToValueAtTime() {}
    }
    class MockOscillator {
      constructor() { this.frequency = new MockAudioParam(); this.type = "square"; }
      connect(target) { return target; }
      start() { window.__noahAudioStarts += 1; }
      stop() {}
    }
    class MockGain {
      constructor() { this.gain = new MockAudioParam(); }
      connect(target) { return target; }
    }
    class MockAudioContext {
      constructor() {
        window.__noahAudioContexts += 1;
        this.currentTime = 0;
        this.destination = {};
        this.state = "suspended";
      }
      async resume() { window.__noahAudioResumes += 1; this.state = "running"; }
      async suspend() { window.__noahAudioSuspends += 1; this.state = "suspended"; }
      createOscillator() { return new MockOscillator(); }
      createGain() { return new MockGain(); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: MockAudioContext });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
  }, { unavailable });
}

async function enterNoahGame(page, name = "Lucas") {
  await page.getByRole("button", { name: "ACEITAR MISSÃO" }).click();
  await page.getByLabel("Nome do player").fill(name);
  await page.getByRole("button", { name: "ENTRAR NO JOGO" }).click();
}

async function finishNoahArmor(page) {
  for (const name of [
    "Capacete da Salvação",
    "Couraça da Justiça",
    "Sandálias do Evangelho",
    "Escudo da Fé",
    "Espada do Espírito",
    "Cinturão da Verdade",
  ]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }
}

async function finishNoahGame(page) {
  await enterNoahGame(page);
  await finishNoahArmor(page);
  await page.getByRole("button", { name: "SEGUIR PARA A FASE 2" }).click();
  await page.getByRole("button", { name: /ROTA B:/ }).click();
  await page.getByRole("button", { name: "SEGUIR PARA A FASE FINAL" }).click();
  await page.waitForFunction(() => {
    const meter = document.querySelector("[data-faith-meter]");
    const value = Number(meter?.dataset.position);
    if (value < 44 || value > 56) return false;
    document.querySelector("[data-stabilize]").click();
    return true;
  });
  await page.getByRole("button", { name: "DESBLOQUEAR CONVITE" }).click();
}

test("Hannah inicia silenciosa e ativa uma única trilha pelo gesto de entrada", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.goto("/hannah/");
  const audio = page.locator("[data-palace-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await expect(audio).toHaveCount(1);
  await expect(audio).toHaveJSProperty("loop", true);
  await expect(audio).toHaveJSProperty("volume", 0.18);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("aria-label", "Reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBeNull();

  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(1);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("aria-label", "Desativar som");
});

test("controle de som pausa, retoma no mesmo ponto e funciona pelo teclado", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.goto("/hannah/");
  const audio = page.locator("[data-palace-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  await audio.evaluate((element) => { element.currentTime = 17; });
  await toggle.focus();
  await toggle.press("Space");
  expect(await page.evaluate(() => window.__audioPauseCalls)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBeNull();
  await toggle.press("Space");
  await expect(audio).toHaveJSProperty("currentTime", 17);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBeNull();
});

test("refresh restaura som ligado e primeira cena sem autoplay nem áudio duplicado", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.addInitScript(() => {
    localStorage.setItem("vnl_hannah_sound", "off");
    localStorage.setItem("vnl:hannah:intro", "seen");
  });
  await page.goto("/hannah/");
  await expect(page.getByRole("button", { name: "Entrar no Palácio" })).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-palace-audio]")).toHaveCount(1);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Reproduzir som");
  await expect(page.getByRole("button", { name: "Entrar no Palácio" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("off");
  expect(await page.evaluate(() => localStorage.getItem("vnl:hannah:intro"))).toBe("seen");
});

test("bloqueio de play e erro do MP3 não interrompem a experiência", async ({ page }) => {
  await mockAudio(page, { rejectPlayOnce: true });
  await mockBackend(page);
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  await expect(page.getByRole("heading", { name: "Você recebeu um convite muito especial." })).toBeVisible();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar iniciar som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBeNull();
  await page.getByRole("button", { name: "Descobrir o convite" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
  await page.locator("[data-palace-audio]").dispatchEvent("error");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar iniciar som");
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(3);
  await expect(page.getByRole("heading", { name: "Hannah Lis faz 7 anos" })).toBeVisible();
});

test("visibilidade da página pausa e retoma somente quando habilitado", async ({ page }) => {
  await mockAudio(page, { controllableVisibility: true });
  await mockBackend(page);
  await page.goto("/hannah/");
  const audio = page.locator("[data-palace-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  await audio.evaluate((element) => { element.currentTime = 23; });
  await page.evaluate(() => {
    window.__documentHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBeNull();
  expect(await page.evaluate(() => window.__audioPauseCalls)).toBe(1);
  await page.evaluate(() => {
    window.__documentHidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(audio).toHaveJSProperty("currentTime", 23);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
});

test("status atrasado além de 12 segundos ainda libera o RSVP", async ({ page }) => {
  await mockBackend(page, { statusDelay: 13_000 });
  await page.goto("/noah/");
  await finishNoahGame(page);
  await expect(page.getByText(/Confirmações abertas/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "ENVIAR CONFIRMAÇÃO" })).toBeEnabled();
});

test("ausência total de retorno permite tentar novamente sem falso sucesso", async ({ page }) => {
  await mockBackend(page, { noStatusReply: true });
  await page.goto("/vagner/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await page.waitForTimeout(1_000);
  await expect(page.getByText(/Resposta registrada/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Enviar confirmação" })).toBeDisabled();
});

test("Hannah permite pular a introdução e exibe as informações", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await expect(page.getByRole("heading", { name: "Hannah Lis faz 7 anos" })).toBeVisible();
  await expect(page.getByText("Sítio Jalisco").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Como chegar/ }).first()).toHaveAttribute("href", "https://maps.app.goo.gl/N6HcsDhRMRoWT4E1A");
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  await expect(page.locator("[data-sheet]")).toBeVisible();
  await expect(page.locator("[data-sheet]").getByRole("button", { name: "Confirmar presença" })).toBeEnabled();
});

test("Hannah conclui a entrada pelo caminho principal", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "leaving");
  await expect(page.locator("[data-revelation]")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("heading", { name: "Você recebeu um convite muito especial." })).toBeVisible();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "complete");
  await expect(page.getByRole("button", { name: "Descobrir o convite" })).toBeFocused();
  await page.getByRole("button", { name: "Descobrir o convite" }).click();
  await expect(page.locator("[data-content]")).toBeFocused();
});

test("Hannah ignora preferências antigas e pular não inicia áudio", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.addInitScript(() => {
    localStorage.setItem("vnl_hannah_sound", "off");
    localStorage.setItem("vnl:hannah:intro", "seen");
  });
  await page.goto("/hannah/");
  const toggle = page.locator("[data-sound-toggle]");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Entrar no Palácio" })).toBeVisible();
  await page.getByRole("button", { name: "Pular introdução" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("off");
  expect(await page.evaluate(() => localStorage.getItem("vnl:hannah:intro"))).toBe("seen");
});

test("Hannah fecha o bottom sheet com ESC e devolve o foco", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  const openButton = page.getByRole("button", { name: "Confirmar presença" });
  await openButton.click();
  await expect(page.getByLabel("Nome do responsável ou família")).toBeFocused({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-sheet]")).toBeHidden();
  await expect(openButton).toBeFocused();
});

test("Hannah envia RSVP real pelo contrato compartilhado e exibe o resultado", async ({ page }) => {
  let submitted;
  await mockBackend(page);
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("test-deployment")) submitted = new URLSearchParams(request.postData() || "");
  });
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  const sheet = page.locator("[data-sheet]");
  await sheet.getByLabel("Nome do responsável ou família").fill("Família Teste");
  await sheet.getByLabel("Telefone ou WhatsApp").fill("85 99999-1234");
  await sheet.getByLabel("Sim, estaremos").check();
  await sheet.getByLabel("Aumentar quantidade").click();
  await expect(sheet.getByLabel("Quantidade total de pessoas")).toHaveValue("2");
  await sheet.getByRole("button", { name: "Confirmar presença" }).click();
  await expect(page.getByRole("heading", { name: "Presença confirmada!" })).toBeVisible();
  expect(submitted.get("origem")).toBe("HANNAH");
  expect(submitted.get("presenca")).toBe("SIM");
  expect(submitted.get("quantidade")).toBe("2");
});

test("Noah reproduz a abertura, identificação e primeira fase canônicas", async ({ page }) => {
  await mockWebAudio(page);
  await mockBackend(page);
  await page.goto("/noah/");
  await expect(page.getByRole("heading", { name: "Level Up da Fé" })).toBeVisible();
  await expect(page.getByText("Player da Luz // Online")).toHaveCount(0);
  await expect(page.getByText("A missão é rápida, funciona no celular e não exige cadastro.")).toHaveCount(0);
  await expect(page.locator('img[src="./assets/noah-armadura.webp"]')).toBeHidden();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "ACEITAR MISSÃO" }).click();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "8");
  await expect(page.getByLabel("Nome do player")).toBeFocused();
  await expect(page.getByText("O nome fica apenas neste aparelho e não é enviado para nenhum servidor.")).toHaveCount(0);
  await page.getByLabel("Nome do player").fill("Ana");
  await page.getByRole("button", { name: "ENTRAR NO JOGO" }).click();
  await expect(page.getByRole("heading", { name: "Equipe a Armadura de Deus" })).toBeFocused();
  await expect(page.getByText(/Ana, toque em cada equipamento/)).toBeVisible();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "18");

  const helmet = page.getByRole("button", { name: /Capacete da Salvação/ });
  await helmet.focus();
  await helmet.press("Space");
  await expect(helmet).toHaveAttribute("aria-pressed", "true");
  await expect(helmet).toBeDisabled();
  await expect(page.locator("[data-power-counter]")).toHaveText("1 de 6 equipamentos conquistados");
  await expect(page.locator("[data-power-feedback]")).toContainText("Proteja seus pensamentos");

  for (const name of ["Couraça da Justiça", "Sandálias do Evangelho", "Escudo da Fé", "Espada do Espírito", "Cinturão da Verdade"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }
  await expect(page.locator("[data-power-counter]")).toHaveText("6 de 6 equipamentos conquistados");
  await expect(page.getByText(/Data desbloqueada: 26 de setembro de 2026/)).toBeVisible();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "38");
});

test("Noah mantém as três rotas e permite corrigir respostas erradas", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/noah/");
  await enterNoahGame(page);
  await finishNoahArmor(page);
  await page.getByRole("button", { name: "SEGUIR PARA A FASE 2" }).click();
  await expect(page.getByText(/João 14:6/)).toBeVisible();
  const routeA = page.getByRole("button", { name: /ROTA A:/ });
  const routeB = page.getByRole("button", { name: /ROTA B:/ });
  const routeC = page.getByRole("button", { name: /ROTA C:/ });
  await routeA.click();
  await expect(page.locator("[data-path-feedback]")).toHaveText("Essa rota não leva ao objetivo. Tente novamente!");
  await expect(routeB).toBeEnabled();
  await routeC.click();
  await expect(routeB).toBeEnabled();
  await routeB.click();
  await expect(page.locator("[data-path-feedback]")).toHaveText("Rota correta! O caminho foi iluminado.");
  await expect(page.getByText(/Horário desbloqueado: 14h/)).toBeVisible();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "63");
});

test("Noah permite erro, nova tentativa e acerto na Barra da Fé", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/noah/");
  await enterNoahGame(page);
  await finishNoahArmor(page);
  await page.getByRole("button", { name: "SEGUIR PARA A FASE 2" }).click();
  await page.getByRole("button", { name: /ROTA B:/ }).click();
  await page.getByRole("button", { name: "SEGUIR PARA A FASE FINAL" }).click();
  const meter = page.locator("[data-faith-meter]");
  await page.waitForFunction(() => {
    const meterElement = document.querySelector("[data-faith-meter]");
    const value = Number(meterElement?.dataset.position);
    if (value >= 30) return false;
    document.querySelector("[data-stabilize]").click();
    return true;
  });
  await expect(page.locator("[data-meter-feedback]")).toContainText("Quase! Tente novamente");
  await expect(page.locator("[data-stabilize]")).toBeEnabled();
  await page.waitForFunction(() => {
    const meterElement = document.querySelector("[data-faith-meter]");
    const value = Number(meterElement?.dataset.position);
    if (value < 44 || value > 56) return false;
    document.querySelector("[data-stabilize]").click();
    return true;
  });
  await expect(page.locator("[data-meter-feedback]")).toHaveText("Acerto perfeito! Nível máximo alcançado.");
  await expect(page.getByText(/Local desbloqueado: Sítio Jalisco/)).toBeVisible();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "91");
});

test("Noah conclui o jogo, preserva o RSVP e reinicia apenas o estado local", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/noah/");
  await finishNoahGame(page);
  await expect(page.getByRole("heading", { name: "Heitor Noah" })).toBeFocused();
  await expect(page.getByText(/Parabéns, Lucas!/)).toBeVisible();
  await expect(page.getByText("Level 10 desbloqueado!")).toBeVisible();
  const portrait = page.locator('img[src="./assets/noah-armadura.webp"]');
  await expect(portrait).toHaveCount(1);
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute("alt", "Heitor Noah sorrindo, vestido com a Armadura de Deus e segurando escudo e espada.");
  expect(await portrait.evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }))).toEqual({ width: 1024, height: 1536 });
  expect(await portrait.evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return rect.left >= -1 && rect.right <= window.innerWidth + 1 && rect.width / rect.height > .65 && rect.width / rect.height < .68;
  })).toBe(true);
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "100");
  await expect(page.locator(".confetti-piece")).not.toHaveCount(0);
  await page.getByLabel("Nome do responsável ou família").fill("Família Preservada");
  await page.getByRole("button", { name: "JOGAR NOVAMENTE" }).click();
  await expect(page.getByRole("button", { name: "ACEITAR MISSÃO" })).toBeFocused();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByLabel("Nome do responsável ou família")).toHaveValue("Família Preservada");
  await expect(page.locator(".confetti-piece")).toHaveCount(0);
});

test("Noah ignora mute antigo e mantém mute somente na sessão", async ({ page }) => {
  await mockWebAudio(page);
  await mockBackend(page);
  await page.addInitScript(() => localStorage.setItem("vnl_noah_sound", "off"));
  await page.goto("/noah/");
  const toggle = page.locator("[data-sound-toggle]");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.__noahAudioContexts)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("vnl_noah_sound"))).toBe("off");
  await page.getByRole("button", { name: "ACEITAR MISSÃO" }).click();
  await expect.poll(() => page.evaluate(() => window.__noahAudioStarts)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__noahAudioContexts)).toBe(1);
  await toggle.focus();
  await toggle.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("vnl_noah_sound"))).toBe("off");
  await page.reload();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => window.__noahAudioContexts)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("vnl_noah_sound"))).toBe("off");
});

test("Noah permanece funcional sem suporte a Web Audio", async ({ page }) => {
  await mockWebAudio(page, { unavailable: true });
  await mockBackend(page);
  await page.goto("/noah/");
  await enterNoahGame(page);
  await expect(page.getByRole("heading", { name: "Equipe a Armadura de Deus" })).toBeVisible();
  await page.getByRole("button", { name: /Escudo da Fé/ }).click();
  await expect(page.locator("[data-power-counter]")).toHaveText("1 de 6 equipamentos conquistados");
});

test("Noah ignora a chave legada e sempre começa pela abertura", async ({ page }) => {
  await mockBackend(page);
  await page.addInitScript(() => localStorage.setItem("vnl:noah:mission", "seen"));
  await page.goto("/noah/");
  await expect(page.getByRole("button", { name: "ACEITAR MISSÃO" })).toBeVisible();
  await expect(page.locator("[data-progress]")).toHaveAttribute("aria-valuenow", "0");
});

test("Noah mantém a jornada funcional com movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockBackend(page);
  await page.goto("/noah/");
  await enterNoahGame(page);
  await finishNoahArmor(page);
  await page.getByRole("button", { name: "SEGUIR PARA A FASE 2" }).click();
  await page.getByRole("button", { name: /ROTA B:/ }).click();
  await page.getByRole("button", { name: "SEGUIR PARA A FASE FINAL" }).click();
  await expect(page.locator("[data-faith-meter]")).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("button", { name: "ATIVAR AGORA!" }).click();
  await page.getByRole("button", { name: "DESBLOQUEAR CONVITE" }).click();
  await expect(page.getByRole("heading", { name: "Heitor Noah" })).toBeVisible();
  await expect(page.locator(".confetti-piece")).toHaveCount(0);
});

test("cada convite fixa sua própria origem", async ({ page }) => {
  await mockBackend(page);
  for (const [route, origin] of [["hannah", "HANNAH"], ["noah", "NOAH"], ["vagner", "VAGNER"]]) {
    await page.goto(`/${route}/`);
    await expect(page.locator('input[name="origem"]')).toHaveValue(origin);
  }
});

test("as três rotas exibem os avisos comuns do evento", async ({ page }) => {
  await mockBackend(page);
  for (const route of ["hannah", "noah", "vagner"]) {
    await page.goto(`/${route}/`);
    if (route === "hannah") await page.getByRole("button", { name: "Pular introdução" }).click();
    if (route === "noah") await finishNoahGame(page);
    await expect(page.getByText("Traje despojado", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Piscina liberada para as crianças/).first()).toBeVisible();
    await expect(page.getByText("Não serão aceitas bebidas alcoólicas.", { exact: true }).first()).toBeVisible();
  }
});

test("movimento reduzido preserva a primeira cena e conclui sem espera", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockBackend(page);
  await page.goto("/hannah/");
  await expect(page.getByRole("button", { name: "Entrar no Palácio" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  await expect(page.getByRole("button", { name: "Descobrir o convite" })).toBeFocused();
  await page.goto("/vagner/");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "arrival");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await expect(page.getByRole("button", { name: "Ver o convite" })).toBeFocused();
});

test("Noah envia RSVP usando a origem correta", async ({ page }) => {
  let submitted;
  await mockBackend(page);
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("test-deployment")) submitted = new URLSearchParams(request.postData() || "");
  });
  await page.goto("/noah/");
  await finishNoahGame(page);
  await page.getByLabel("Nome do responsável ou família").fill("Família Teste");
  await page.getByLabel("Telefone ou WhatsApp").fill("85 99999-1234");
  await expect(page.locator("[data-quantity-field]")).toBeHidden();
  await page.getByLabel("Sim, estaremos").check();
  await expect(page.locator("[data-quantity-field]")).toBeVisible();
  await page.getByLabel("Quantidade total de pessoas").fill("3");
  await page.getByRole("button", { name: "ENVIAR CONFIRMAÇÃO" }).click();
  await expect(page.getByText("Resposta registrada. Obrigado por confirmar!")).toBeVisible();
  expect(submitted.get("origem")).toBe("NOAH");
  expect(submitted.get("evento_id")).toBe("VNL_2026");
  expect(submitted.get("nome_responsavel")).toBe("Família Teste");
  expect(submitted.get("telefone")).toBe("85 99999-1234");
  expect(submitted.get("presenca")).toBe("SIM");
  expect(submitted.get("quantidade")).toBe("3");
});

test("Vagner inicia silencioso e ativa uma única trilha pelo gesto de entrada", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.goto("/vagner/");
  const audio = page.locator("[data-vagner-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await expect(audio).toHaveCount(1);
  await expect(audio).toHaveJSProperty("loop", true);
  await expect(audio).toHaveJSProperty("volume", 0.16);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("aria-label", "Reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBeNull();
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(1);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toHaveAttribute("aria-label", "Desativar som");
});

test("Vagner pausa, retoma e mantém a trilha entre as cenas", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.goto("/vagner/");
  const audio = page.locator("[data-vagner-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await audio.evaluate((element) => { element.currentTime = 19; });
  await toggle.focus();
  await toggle.press("Space");
  expect(await page.evaluate(() => window.__audioPauseCalls)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBeNull();
  await toggle.press("Space");
  await expect(audio).toHaveJSProperty("currentTime", 19);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
  await page.getByRole("button", { name: "Ver o convite" }).click();
  await expect(audio).toHaveJSProperty("currentTime", 19);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
});

test("Vagner ignora preferências antigas e refresh restaura a chegada sem autoplay", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.addInitScript(() => {
    localStorage.setItem("vnl_vagner_sound", "off");
    localStorage.setItem("vnl:vagner:intro", "seen");
  });
  await page.goto("/vagner/");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "arrival");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(1);
  await page.locator("[data-sound-toggle]").click();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("off");
  await page.reload();
  await expect(page.locator("[data-vagner-audio]")).toHaveCount(1);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Reproduzir som");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "arrival");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("off");
  expect(await page.evaluate(() => localStorage.getItem("vnl:vagner:intro"))).toBe("seen");
});

test("falhas do áudio do Vagner não interrompem convite, Maps ou RSVP", async ({ page }) => {
  await mockAudio(page, { rejectPlayOnce: true });
  await mockBackend(page);
  await page.goto("/vagner/");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await expect(page.getByRole("heading", { name: "Vagner Cunha", exact: true })).toBeVisible();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar iniciar som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBeNull();
  await page.getByRole("button", { name: "Ver o convite" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
  await page.locator("[data-vagner-audio]").dispatchEvent("error");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar iniciar som");
  await page.getByRole("button", { name: "Rever abertura" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(3);
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await expect(page.getByRole("link", { name: "Abrir no Google Maps" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar confirmação" })).toBeEnabled();
});

test("visibilidade pausa e retoma o áudio do Vagner somente quando habilitado", async ({ page }) => {
  await mockAudio(page, { controllableVisibility: true });
  await mockBackend(page);
  await page.goto("/vagner/");
  const audio = page.locator("[data-vagner-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await audio.evaluate((element) => { element.currentTime = 31; });
  await page.evaluate(() => {
    window.__documentHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBeNull();
  expect(await page.evaluate(() => window.__audioPauseCalls)).toBe(1);
  await page.evaluate(() => {
    window.__documentHidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(audio).toHaveJSProperty("currentTime", 31);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
});

test("Vagner destaca Josué 24:15 com a trilha opcional", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.goto("/vagner/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await expect(page.locator("[data-verse]").getByText("Josué 24:15")).toBeVisible();
  await expect(page.locator("[data-vagner-audio]")).toHaveCount(1);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
});

test("Vagner usa os dois assets aprovados e remove a direção visual anterior", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/vagner/");
  const stadium = page.locator('img[src="./assets/vagner-stadium.webp"]');
  const tunnel = page.locator('img[src="./assets/vagner-tunnel.webp"]');
  await expect(stadium).toHaveCount(2);
  await expect(tunnel).toHaveCount(1);
  await expect(page.locator('img[src="./assets/vagner-hero.webp"]')).toHaveCount(0);
  await expect.poll(() => stadium.first().evaluate((image) => [image.naturalWidth, image.naturalHeight])).toEqual([941, 1672]);
  await expect.poll(() => tunnel.evaluate((image) => [image.naturalWidth, image.naturalHeight])).toEqual([768, 1376]);
  await expect(page.getByRole("heading", { name: /O grande dia/ })).toBeVisible();
  await expect(page.getByText("uma assinatura pessoal", { exact: true })).toHaveCount(0);
  await expect(page.locator(".keyboard-signature")).toHaveCount(0);
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await expect(page.getByRole("heading", { name: "Vagner Cunha", exact: true })).toBeVisible();
  await expect(page.getByText("Venha confortável para aproveitar a festa.")).toBeVisible();
  await expect(page.getByText("Traje despojado", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir no Google Maps" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test("Vagner percorre chegada, identidade e convite pelo caminho principal", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/vagner/");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "arrival");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "identity");
  await expect(page.locator('[data-scene="0"]')).toHaveAttribute("data-active", "false");
  await expect(page.locator('[data-scene="1"]')).toHaveAttribute("data-active", "true");
  await expect(page.getByRole("heading", { name: "Vagner Cunha", exact: true })).toBeVisible();
  await expect(page.getByText("Uma vida para agradecer.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver o convite" })).toBeFocused();
  await page.getByRole("button", { name: "Ver o convite" }).click();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "complete");
  await expect(page.locator("[data-content]")).toBeFocused();
});

test("Vagner ignora histórico antigo e replay preserva o mute da sessão", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.addInitScript(() => localStorage.setItem("vnl:vagner:intro", "seen"));
  await page.goto("/vagner/");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "arrival");
  await page.locator("[data-sound-toggle]").click();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await page.getByRole("button", { name: "Ver o convite" }).click();
  await page.getByRole("button", { name: "Rever abertura" }).click();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "arrival");
  await expect(page.getByRole("button", { name: "Entrar na celebração" })).toBeFocused();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("vnl:vagner:intro"))).toBe("seen");
});

test("prazo fechado substitui o formulário pelo contato", async ({ page }) => {
  await mockBackend(page, { open: false });
  await page.goto("/noah/");
  await finishNoahGame(page);
  await expect(page.getByText("O prazo de confirmação foi encerrado.")).toBeVisible();
  await expect(page.getByRole("link", { name: "niver.familia.vnl@gmail.com" })).toBeVisible();
  await expect(page.locator("[data-rsvp-form]")).toHaveCount(0);
});

test("relógio incorreto do aparelho não substitui a decisão do backend", async ({ page }) => {
  await page.addInitScript(() => {
    const RealDate = Date;
    class FutureDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : ["2030-01-01T12:00:00.000Z"]));
      }
      static now() { return new RealDate("2030-01-01T12:00:00.000Z").getTime(); }
    }
    globalThis.Date = FutureDate;
  });
  await mockBackend(page, { open: true });
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  await expect(page.locator("[data-sheet]").getByRole("button", { name: "Confirmar presença" })).toBeEnabled();
  await expect(page.getByText(/Confirmações abertas/)).toBeVisible();
});

test("informações críticas permanecem no HTML sem JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const route of ["hannah", "noah", "vagner"]) {
    await page.goto(`http://127.0.0.1:4173/${route}/`);
    for (const [label, locator] of [
      ["data", page.getByText(/26 de setembro de 2026/i)],
      ["horário", page.getByText(/14h/i)],
      ["local", page.getByText(/Sítio Jalisco/i)],
      ["roupa de banho", page.getByText(/roupa de banho/i)],
    ]) {
      expect(await locator.evaluateAll((nodes) => nodes.some((node) => node.checkVisibility())), `${route}: ${label}`).toBe(true);
    }
    await expect(page.locator("[data-maps-link]").first()).toHaveAttribute("href", "https://maps.app.goo.gl/N6HcsDhRMRoWT4E1A");
  }
  await context.close();
});

test("sem endpoint mantém informações e bloqueia o envio", async ({ page }) => {
  const disconnectedConfig = configSource.replace(
    'endpoint: "https://script.google.com/macros/s/test-deployment/exec"',
    'endpoint: ""',
  );
  await page.route("**/shared/event-config.js", (route) => route.fulfill({
    contentType: "text/javascript",
    body: disconnectedConfig,
  }));
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await expect(page.getByText("Sítio Jalisco").first()).toBeVisible();
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  await expect(page.getByText("A confirmação ainda não está conectada. Tente novamente mais tarde.")).toBeVisible();
  await expect(page.locator("[data-sheet]").getByRole("button", { name: "Confirmar presença" })).toBeDisabled();
});
