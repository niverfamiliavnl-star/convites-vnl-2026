import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const configSource = readFileSync(new URL("../../shared/event-config.js", import.meta.url), "utf8")
  .replace("__APPS_SCRIPT_WEB_APP_URL__", "https://script.google.com/macros/s/test-deployment/exec");

async function mockBackend(page, { open = true } = {}) {
  await page.route("**/shared/event-config.js", (route) => route.fulfill({ contentType: "text/javascript", body: configSource }));
  await page.route("https://script.google.com/macros/s/test-deployment/exec**", async (route) => {
    const request = route.request();
    const params = request.method() === "POST"
      ? new URLSearchParams(request.postData() || "")
      : new URL(request.url()).searchParams;
    const isStatus = request.method() === "GET";
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
  await expect(page.getByRole("heading", { name: "Você recebeu um convite muito especial." })).toBeVisible();
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "complete");
  await page.getByRole("button", { name: "Descobrir o convite" }).click();
  await expect(page.locator("[data-content]")).toBeFocused();
});

test("Hannah fecha o bottom sheet com ESC e devolve o foco", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  const openButton = page.getByRole("button", { name: "Confirmar presença" });
  await openButton.click();
  await expect(page.getByLabel("Nome do responsável ou família")).toBeFocused();
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

test("Vagner destaca Josué 24:15 sem depender de áudio", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/vagner/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await expect(page.locator("[data-verse]").getByText("Josué 24:15")).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(0);
});

test("Vagner conclui a entrada pelo caminho principal", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/vagner/");
  await page.getByRole("button", { name: "Entrar na história" }).click();
  await expect(page.locator("[data-cinematic]")).toBeFocused();
  await expect(page.locator('[data-scene="0"]')).toHaveAttribute("data-active", "true");
  await expect(page.locator("[data-story-progress]")).toHaveAttribute("aria-valuenow", "1");
  await expect(page.getByRole("button", { name: "Ver o convite" })).toBeVisible();
  await expect(page.locator('[data-scene="3"]')).toHaveAttribute("data-active", "true");
  await expect(page.locator("[data-story-progress]")).toHaveAttribute("aria-valuenow", "4");
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
  await expect(page.locator("[data-intro]")).toHaveAttribute("data-state", "idle");
  await expect(page.getByRole("button", { name: "Entrar na história" })).toBeFocused();
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
  await page.goto("/hannah/");
  await page.getByRole("button", { name: "Pular introdução" }).click();
  await expect(page.getByText("Sítio Jalisco").first()).toBeVisible();
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  await expect(page.getByText("A confirmação ainda não está conectada. Tente novamente mais tarde.")).toBeVisible();
  await expect(page.locator("[data-sheet]").getByRole("button", { name: "Confirmar presença" })).toBeDisabled();
});
