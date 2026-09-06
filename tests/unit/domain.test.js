import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const domainSource = readFileSync(new URL("../../backend/Domain.gs", import.meta.url), "utf8");
let domain;

beforeEach(() => {
  domain = vm.createContext({ console });
  vm.runInContext(domainSource, domain);
});

function validPayload(overrides = {}) {
  return {
    request_id: "2f9e27c8-6e79-4b60-9c17-1dc972c6e937",
    evento_id: "VNL_2026",
    origem: "HANNAH",
    nome_responsavel: "Família Teste",
    telefone: "(85) 99999-1234",
    presenca: "SIM",
    quantidade: "3",
    acompanhantes: "Pessoa A e Pessoa B",
    observacao: "",
    ...overrides,
  };
}

describe("normalização de telefone", () => {
  it.each([
    ["(85) 99999-1234", "5585999991234"],
    ["+55 85 99999-1234", "5585999991234"],
    ["85 3234-5678", "558532345678"],
  ])("normaliza %s", (input, expected) => {
    expect(domain.vnlNormalizePhone(input)).toBe(expected);
  });

  it.each(["859999123", "00 99999-1234", "85 89999-1234", "85 6234-5678"])("rejeita %s", (input) => {
    expect(domain.vnlNormalizePhone(input)).toBeNull();
  });
});

describe("validação do RSVP", () => {
  it("aceita uma confirmação completa", () => {
    const result = domain.vnlValidatePayload(validPayload());
    expect(result.ok).toBe(true);
    expect(result.value.telefone_normalizado).toBe("5585999991234");
    expect(result.value.quantidade).toBe(3);
  });

  it("força quantidade zero para NÃO", () => {
    const result = domain.vnlValidatePayload(validPayload({ presenca: "NAO", quantidade: "20" }));
    expect(result.ok).toBe(true);
    expect(result.value.quantidade).toBe(0);
  });

  it.each([0, 21, 1.5])("rejeita quantidade %s para SIM", (quantity) => {
    expect(domain.vnlValidatePayload(validPayload({ quantidade: String(quantity) })).ok).toBe(false);
  });

  it.each(["OUTRO", "", "hannah-2"])("rejeita origem %s", (origin) => {
    expect(domain.vnlValidatePayload(validPayload({ origem: origin })).ok).toBe(false);
  });

  it("rejeita textos acima dos limites", () => {
    expect(domain.vnlValidatePayload(validPayload({ nome_responsavel: "x".repeat(121) })).ok).toBe(false);
    expect(domain.vnlValidatePayload(validPayload({ acompanhantes: "x".repeat(501) })).ok).toBe(false);
    expect(domain.vnlValidatePayload(validPayload({ observacao: "x".repeat(1001) })).ok).toBe(false);
  });
});

describe("prazo", () => {
  const configuredLimit = new Date("2026-09-16T02:59:00.000Z");
  it("aceita até o último milissegundo do minuto 23:59", () => {
    expect(domain.vnlIsRsvpOpenAt(new Date("2026-09-16T02:59:59.999Z"), configuredLimit, true)).toBe(true);
  });

  it("fecha exatamente à meia-noite em Fortaleza", () => {
    expect(domain.vnlIsRsvpOpenAt(new Date("2026-09-16T03:00:00.000Z"), configuredLimit, true)).toBe(false);
  });

  it("respeita o interruptor RSVP_ATIVO", () => {
    expect(domain.vnlIsRsvpOpenAt(new Date("2026-09-10T12:00:00.000Z"), configuredLimit, false)).toBe(false);
  });
});
