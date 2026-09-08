import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

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
