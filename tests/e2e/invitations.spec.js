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
  await toggle.focus();
  await toggle.press("Space");
  await audio.evaluate((element) => { element.currentTime = 17; });
  await toggle.press("Space");
  expect(await page.evaluate(() => window.__audioPauseCalls)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("off");
  await toggle.press("Space");
  await expect(audio).toHaveJSProperty("currentTime", 17);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("on");
});

test("refresh preserva a preferência sem autoplay nem áudio duplicado", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.goto("/hannah/");
  await page.locator("[data-sound-toggle]").click();
  await page.reload();
  await expect(page.locator("[data-palace-audio]")).toHaveCount(1);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("on");
});

test("bloqueio de play e erro do MP3 não interrompem a experiência", async ({ page }) => {
  await mockAudio(page, { rejectPlayOnce: true });
  await mockBackend(page);
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  await expect(page.getByRole("heading", { name: "Você recebeu um convite muito especial." })).toBeVisible();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBeNull();
  await page.locator("[data-sound-toggle]").click();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("on");
  await page.locator("[data-palace-audio]").dispatchEvent("error");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("on");
  await page.getByRole("button", { name: "Descobrir o convite" }).click();
  await expect(page.getByRole("heading", { name: "Hannah Lis faz 7 anos" })).toBeVisible();
});

test("visibilidade da página pausa e retoma somente quando habilitado", async ({ page }) => {
  await mockAudio(page, { controllableVisibility: true });
  await mockBackend(page);
  await page.goto("/hannah/");
  const audio = page.locator("[data-palace-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await toggle.click();
  await audio.evaluate((element) => { element.currentTime = 23; });
  await page.evaluate(() => {
    window.__documentHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("on");
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
  await expect(page.getByText(/Confirmações abertas/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Enviar confirmação" })).toBeEnabled();
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
  await page.waitForTimeout(500);
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "leaving");
  await expect(page.getByRole("button", { name: "Descobrir o convite", includeHidden: true })).not.toBeFocused();
  await expect(page.getByRole("heading", { name: "Você recebeu um convite muito especial." })).toBeVisible();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "complete");
  await expect(page.getByRole("button", { name: "Descobrir o convite" })).toBeFocused();
  await page.getByRole("button", { name: "Descobrir o convite" }).click();
  await expect(page.locator("[data-content]")).toBeFocused();
});

test("Hannah respeita mute persistido e CTA não altera a preferência", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.addInitScript(() => localStorage.setItem("vnl_hannah_sound", "off"));
  await page.goto("/hannah/");
  const toggle = page.locator("[data-sound-toggle]");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Entrar no Palácio" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("vnl_hannah_sound"))).toBe("off");
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

test("Noah equipa os seis itens em qualquer ordem", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/noah/");
  await expect(page.getByRole("button", { name: "Começar missão" })).toBeVisible();
  await expect(page.locator("[data-mission-stage]")).toBeHidden();
  await page.getByRole("button", { name: "Começar missão" }).click();
  await expect(page.getByRole("heading", { name: "Equipe a Armadura de Deus" })).toBeFocused();
  const names = ["Escudo da Fé", "Sandálias do Evangelho", "Capacete da Salvação", "Espada do Espírito", "Cinturão da Verdade", "Couraça da Justiça"];
  for (const [index, name] of names.entries()) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    if (index < names.length - 1) await expect(page.locator("[data-mission-message]")).toContainText(name);
  }
  await expect(page.locator("[data-progress]")).toHaveText("6/6");
  await expect(page.getByRole("button", { name: "Missão completa — ver convite" })).toBeVisible();
  await page.getByRole("button", { name: "Missão completa — ver convite" }).click();
  await expect(page.locator("[data-content]")).toBeFocused();
});

test("Noah permite pular a missão", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/noah/");
  await page.getByRole("button", { name: "Pular missão" }).click();
  await expect(page.locator("[data-content]")).toBeFocused();
});

test("Noah permite equipar um item pelo teclado", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/noah/");
  await page.getByRole("button", { name: "Começar missão" }).click();
  await expect(page.locator("#loadout-title")).toBeFocused();
  const helmet = page.getByRole("button", { name: /Capacete da Salvação/ });
  await helmet.focus();
  await expect(helmet).toBeFocused();
  await helmet.press("Space");
  await expect(helmet).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-progress]")).toHaveText("1/6");
});

test("Noah evita repetir a missão já concluída e permite refazê-la", async ({ page }) => {
  await mockBackend(page);
  await page.addInitScript(() => localStorage.setItem("vnl:noah:mission", "seen"));
  await page.goto("/noah/");
  await expect(page.getByRole("button", { name: "Ver convite" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refazer missão" })).toBeVisible();
  await page.getByRole("button", { name: "Ver convite" }).click();
  await expect(page.locator("[data-content]")).toBeFocused();
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
    await expect(page.getByText("Traje despojado", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Piscina liberada para as crianças/).first()).toBeVisible();
    await expect(page.getByText("Não serão aceitas bebidas alcoólicas.", { exact: true }).first()).toBeVisible();
  }
});

test("movimento reduzido pula automaticamente as introduções", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockBackend(page);
  for (const route of ["hannah", "vagner"]) {
    await page.goto(`/${route}/`);
    await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "complete");
    await expect(page.locator("[data-content]")).not.toHaveAttribute("inert", "");
  }
});

test("Noah envia RSVP usando a origem correta", async ({ page }) => {
  let submitted;
  await mockBackend(page);
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("test-deployment")) submitted = new URLSearchParams(request.postData() || "");
  });
  await page.goto("/noah/");
  await page.getByLabel("Nome do responsável ou família").fill("Família Teste");
  await page.getByLabel("Telefone ou WhatsApp").fill("85 99999-1234");
  await expect(page.locator("[data-quantity-field]")).toBeHidden();
  await page.getByLabel("Sim, estaremos").check();
  await expect(page.locator("[data-quantity-field]")).toBeVisible();
  await page.getByLabel("Quantidade total de pessoas").fill("3");
  await page.getByRole("button", { name: "Enviar confirmação" }).click();
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
  await toggle.focus();
  await toggle.press("Space");
  await audio.evaluate((element) => { element.currentTime = 19; });
  await toggle.press("Space");
  expect(await page.evaluate(() => window.__audioPauseCalls)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("off");
  await toggle.press("Space");
  await expect(audio).toHaveJSProperty("currentTime", 19);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await page.getByRole("button", { name: "Ver o convite" }).click();
  await expect(audio).toHaveJSProperty("currentTime", 19);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(2);
});

test("Vagner respeita preferência desligada e refresh não provoca autoplay", async ({ page }) => {
  await mockAudio(page);
  await mockBackend(page);
  await page.addInitScript(() => {
    if (sessionStorage.getItem("vnl-test-sound-preference") !== "set") {
      localStorage.setItem("vnl_vagner_sound", "off");
      sessionStorage.setItem("vnl-test-sound-preference", "set");
    }
  });
  await page.goto("/vagner/");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  await page.locator("[data-sound-toggle]").click();
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("on");
  await page.reload();
  await expect(page.locator("[data-vagner-audio]")).toHaveCount(1);
  expect(await page.evaluate(() => window.__audioPlayCalls)).toBe(0);
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("on");
});

test("falhas do áudio do Vagner não interrompem convite, Maps ou RSVP", async ({ page }) => {
  await mockAudio(page, { rejectPlayOnce: true });
  await mockBackend(page);
  await page.goto("/vagner/");
  await page.getByRole("button", { name: "Entrar na celebração" }).click();
  await expect(page.getByRole("heading", { name: "Vagner Cunha", exact: true })).toBeVisible();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBeNull();
  await page.locator("[data-sound-toggle]").click();
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("on");
  await page.locator("[data-vagner-audio]").dispatchEvent("error");
  await expect(page.locator("[data-sound-toggle]")).toHaveAttribute("aria-label", "Tentar reproduzir som");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("on");
  await page.getByRole("button", { name: "Ver o convite" }).click();
  await expect(page.getByRole("link", { name: "Abrir no Google Maps" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar confirmação" })).toBeEnabled();
});

test("visibilidade pausa e retoma o áudio do Vagner somente quando habilitado", async ({ page }) => {
  await mockAudio(page, { controllableVisibility: true });
  await mockBackend(page);
  await page.goto("/vagner/");
  const audio = page.locator("[data-vagner-audio]");
  const toggle = page.locator("[data-sound-toggle]");
  await toggle.click();
  await audio.evaluate((element) => { element.currentTime = 31; });
  await page.evaluate(() => {
    window.__documentHidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("vnl_vagner_sound"))).toBe("on");
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
  await page.waitForTimeout(500);
  await expect(page.getByRole("button", { name: "Ver o convite" })).not.toBeFocused();
  await expect(page.getByRole("button", { name: "Ver o convite" })).toBeFocused();
  await page.getByRole("button", { name: "Ver o convite" }).click();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "complete");
  await expect(page.locator("[data-content]")).toBeFocused();
});

test("Vagner evita repetir a abertura e permite revê-la", async ({ page }) => {
  await mockBackend(page);
  await page.addInitScript(() => localStorage.setItem("vnl:vagner:intro", "seen"));
  await page.goto("/vagner/");
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "complete");
  await page.getByRole("button", { name: "Rever abertura" }).click();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "arrival");
  await expect(page.getByRole("button", { name: "Entrar na celebração" })).toBeFocused();
});

test("prazo fechado substitui o formulário pelo contato", async ({ page }) => {
  await mockBackend(page, { open: false });
  await page.goto("/noah/");
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
    await expect(page.getByText("26 de setembro de 2026")).toBeVisible();
    await expect(page.getByText("14h", { exact: true })).toBeVisible();
    await expect(page.getByText("Sítio Jalisco").first()).toBeVisible();
    await expect(page.getByText(/roupa de banho/i).first()).toBeVisible();
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
