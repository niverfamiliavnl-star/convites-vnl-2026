import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = ["Domain.gs", "Code.gs"]
  .map((name) => readFileSync(new URL(`../../backend/${name}`, import.meta.url), "utf8"))
  .join("\n");

let backend;
let responses;
let current;

function createSheet(initialRows) {
  const rows = initialRows.map((row) => [...row]);
  return {
    rows,
    appendRow(row) { rows.push([...row]); },
    getLastRow() { return rows.length; },
    getRange(row, column, rowCount, columnCount) {
      return {
        getValues() {
          return rows.slice(row - 1, row - 1 + rowCount).map((item) => item.slice(column - 1, column - 1 + columnCount));
        },
        setValues(values) {
          values.forEach((valueRow, rowOffset) => {
            if (!rows[row - 1 + rowOffset]) rows[row - 1 + rowOffset] = [];
            valueRow.forEach((value, columnOffset) => { rows[row - 1 + rowOffset][column - 1 + columnOffset] = value; });
          });
          return this;
        },
      };
    },
  };
}

function payload(overrides = {}) {
  return {
    request_id: "2f9e27c8-6e79-4b60-9c17-1dc972c6e937",
    evento_id: "VNL_2026",
    origem: "HANNAH",
    nome_responsavel: "Família Teste",
    telefone: "85 99999-1234",
    presenca: "SIM",
    quantidade: "3",
    acompanhantes: "",
    observacao: "",
    website: "",
    ...overrides,
  };
}

beforeEach(() => {
  responses = createSheet([["headers"]]);
  current = createSheet([["headers"]]);
  let uuid = 0;
  const spreadsheet = {
    getSheetByName(name) {
      if (name === "RESPOSTAS") return responses;
      if (name === "CONSOLIDADO") return current;
      throw new Error(`Unexpected sheet ${name}`);
    },
  };
  backend = vm.createContext({
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, flush() {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    Utilities: {
      getUuid: () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, "0")}`,
      computeDigest: () => [1, 2, 3],
      DigestAlgorithm: { SHA_256: "SHA_256" },
    },
  });
  vm.runInContext(source, backend);
  backend.getConfig_ = () => ({ RSVP_LIMITE: new Date(Date.now() + 86400000), RSVP_ATIVO: true });
});

describe("histórico e consolidação", () => {
  it("mantém todas as respostas e deixa vigente a mais recente entre origens", () => {
    const first = backend.processSubmission_(payload(), "MANUAL", false);
    const second = backend.processSubmission_(payload({ origem: "NOAH", quantidade: "2" }), "MANUAL", false);
    expect(first.code).toBe("RECORDED");
    expect(second.code).toBe("RECORDED");
    expect(responses.rows).toHaveLength(3);
    expect(current.rows).toHaveLength(2);
    expect(current.rows[1][5]).toBe(2);
    expect(current.rows[1][8]).toBe("NOAH");
  });

  it("uma resposta NÃO posterior zera a quantidade vigente", () => {
    backend.processSubmission_(payload(), "MANUAL", false);
    backend.processSubmission_(payload({ presenca: "NAO", quantidade: "20" }), "MANUAL", false);
    expect(current.rows[1][4]).toBe("NAO");
    expect(current.rows[1][5]).toBe(0);
  });

  it("registra submissão tardia sem alterar o consolidado", () => {
    backend.processSubmission_(payload(), "MANUAL", false);
    const before = [...current.rows[1]];
    backend.getConfig_ = () => ({ RSVP_LIMITE: new Date(Date.now() - 86400000), RSVP_ATIVO: true });
    const result = backend.processSubmission_(payload({ origem: "VAGNER", quantidade: "9" }), "MANUAL", false);
    expect(result.code).toBe("CLOSED");
    expect(responses.rows.at(-1)[11]).toBe(true);
    expect(current.rows[1]).toEqual(before);
  });

  it("honeypot responde genericamente sem gravar", () => {
    const result = backend.processSubmission_(payload({ website: "https://spam.invalid" }), "WEB", true);
    expect(result.code).toBe("RECORDED");
    expect(responses.rows).toHaveLength(1);
  });

  it("limite de tentativas rejeita sem gravar", () => {
    backend.consumeRateLimit_ = () => false;
    const result = backend.processSubmission_(payload(), "WEB", true);
    expect(result.code).toBe("RATE_LIMITED");
    expect(responses.rows).toHaveLength(1);
  });

  it("retorna BUSY sem gravar quando outra escrita mantém o lock", () => {
    backend.LockService = { getScriptLock: () => ({ tryLock: () => false, releaseLock() {} }) };
    const result = backend.processSubmission_(payload(), "WEB", true);
    expect(result.code).toBe("BUSY");
    expect(responses.rows).toHaveLength(1);
  });

  it("aplica cinco tentativas por telefone em dez minutos", () => {
    const values = new Map();
    const ttl = new Map();
    backend.CacheService = { getScriptCache: () => ({
      get: (key) => values.get(key) ?? null,
      put: (key, value, seconds) => { values.set(key, value); ttl.set(key, seconds); },
    }) };
    const config = { RATE_LIMIT_PHONE: 5, RATE_LIMIT_WINDOW_SECONDS: 600, RATE_LIMIT_GLOBAL_PER_MINUTE: 60 };
    const now = new Date("2026-09-06T12:00:00.000Z");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(backend.consumeRateLimit_("5585999991234", config, now)).toBe(true);
    }
    expect(backend.consumeRateLimit_("5585999991234", config, now)).toBe(false);
    expect([...ttl.values()]).toContain(600);
  });

  it("aplica sessenta submissões globais por minuto", () => {
    const values = new Map();
    backend.CacheService = { getScriptCache: () => ({
      get: (key) => values.get(key) ?? null,
      put: (key, value) => { values.set(key, value); },
    }) };
    const config = { RATE_LIMIT_PHONE: 100, RATE_LIMIT_WINDOW_SECONDS: 600, RATE_LIMIT_GLOBAL_PER_MINUTE: 60 };
    const now = new Date("2026-09-06T12:00:00.000Z");
    for (let attempt = 0; attempt < 60; attempt += 1) {
      expect(backend.consumeRateLimit_("5585999991234", config, now)).toBe(true);
    }
    expect(backend.consumeRateLimit_("5585999991234", config, now)).toBe(false);
  });

  it("gera HTML executável que propaga a resposta pelos frames do Apps Script", () => {
    let capturedHtml = "";
    backend.HtmlService = {
      XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
      createHtmlOutput(html) {
        capturedHtml = html;
        return { setTitle() { return this; }, setXFrameOptionsMode() { return this; } };
      },
    };
    backend.transportOutput_(backend.vnlSafeMessage({
      request_id: payload().request_id,
      ok: true,
      code: "STATUS",
      message: "Confirmações abertas.",
      rsvp_open: true,
    }));
    expect(capturedHtml).toContain("for(var i=0;i<5;i++)");
    expect(capturedHtml).toContain("</script>");
    expect(capturedHtml).not.toContain("<\\/script>");
  });

  it("mantém a última atualização vazia enquanto não há respostas vigentes", () => {
    expect(source).toContain('=IF(COUNT(CONSOLIDADO!C2:C)=0,"",MAX(CONSOLIDADO!C2:C))');
  });
});
