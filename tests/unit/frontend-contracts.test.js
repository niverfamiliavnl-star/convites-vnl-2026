import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("contratos do merge da Hannah", () => {
  it("mantém o núcleo compartilhado neutro e sem sucesso simulado", () => {
    const shared = read("shared/invitation.js");
    expect(shared).not.toContain("Hannah Lis");
    expect(shared).not.toContain("Modo de demonstração");
    expect(shared).not.toContain("setTimeout(() => {\n        form.setAttribute");
    expect(shared).toContain("A confirmação ainda não está conectada");
  });

  it("usa somente assets aprovados e não inclui fallback genérico", () => {
    const html = read("hannah/index.html");
    expect(html).toContain("./assets/hannah-character.png");
    expect(html).toContain("./assets/hannah-palace-bg.png");
    expect(html).toContain("./assets/hannah-closeup.png");
    expect(html).not.toContain("hannah-ester-card.svg");
    expect(html).not.toContain("onerror=");
  });

  it("mantém apenas um endpoint de produção válido no front-end", () => {
    const config = read("shared/event-config.js");
    expect(config).toMatch(/endpoint: "https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec"/);
    expect(config).not.toContain('endpoint: "__');
    expect(config).not.toContain("test-deployment");
  });
});

describe("contratos do jogo canônico do Noah", () => {
  it("preserva as três fases, as rotas e os desbloqueios", () => {
    const html = read("noah/index.html");
    expect(html).toContain("Fase 1 de 3 • Armadura de Deus");
    expect(html).toContain("Fase 2 de 3 • Escolha o caminho");
    expect(html).toContain("Fase 3 de 3 • Barra da fé");
    expect(html).toContain("ROTA A:");
    expect(html).toContain("ROTA B:");
    expect(html).toContain("ROTA C:");
    expect(html).toContain("Data desbloqueada");
    expect(html).toContain("Horário desbloqueado");
    expect(html).toContain("Local desbloqueado");
    expect(html).toContain('./assets/noah-armadura.webp');
    expect(html.match(/noah-armadura\.webp/g)).toHaveLength(2);
    expect(html).toContain('width="1024" height="1536"');
    expect(html).toContain('alt="Heitor Noah sorrindo, vestido com a Armadura de Deus e segurando escudo e espada."');
    expect(html).not.toContain("PLAYER DA LUZ // ONLINE");
    expect(html).not.toContain("A missão é rápida, funciona no celular e não exige cadastro.");
    expect(html).not.toContain("O nome fica apenas neste aparelho e não é enviado para nenhum servidor.");
    expect(html).not.toContain("final-emblem");
    const asset = new URL("../../noah/assets/noah-armadura.webp", import.meta.url);
    expect(existsSync(asset)).toBe(true);
    expect(statSync(asset).size).toBeGreaterThan(0);
  });

  it("usa o RSVP VNL e Web Audio sem formulário externo", () => {
    const html = read("noah/index.html");
    const app = read("noah/app.js");
    expect(html).toContain("data-rsvp-form");
    expect(html).not.toContain("docs.google.com/forms");
    expect(app).toContain('initInvitation({ origin: "NOAH" })');
    expect(app).toContain("let soundEnabled = true");
    expect(app).not.toContain("vnl_noah_sound");
    expect(app).not.toContain("localStorage");
    expect(app).toContain("createOscillator");
    expect(app).not.toContain("vnl:noah:mission");
  });
});
