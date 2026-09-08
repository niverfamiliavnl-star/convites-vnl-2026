export const EVENT = Object.freeze({
  id: "VNL_2026",
  dateLabel: "26 de setembro de 2026",
  timeLabel: "14h",
  venue: "Sítio Jalisco",
  mapsUrl: "https://maps.app.goo.gl/N6HcsDhRMRoWT4E1A",
  note: "Traga sua roupa de banho",
  dressCode: "Traje despojado",
  poolNotice: "Piscina liberada para as crianças — leve roupa de banho.",
  alcoholNotice: "Não serão aceitas bebidas alcoólicas.",
  timezone: "America/Fortaleza",
  cutoffIso: "2026-09-16T03:00:00.000Z",
  cutoffLabel: "15 de setembro de 2026, às 23h59",
  contactEmail: "niver.familia.vnl@gmail.com",
  privacyNotice:
    "Seus dados serão utilizados exclusivamente para organizar as confirmações deste evento.",
});

export const RSVP = Object.freeze({
  // Endpoint público do Web App de produção. IDs de planilha permanecem somente no projeto vinculado.
  endpoint: "https://script.google.com/macros/s/AKfycbxn8236bdwZyyfn5xs9MnCzCtgrJTm01epTT-HzgKYesYhXdpJZtxJTloftQfyj_s5fiA/exec",
  minPartySize: 1,
  maxPartySize: 20,
  responseTimeoutMs: 12000,
});

export const ORIGINS = Object.freeze(["HANNAH", "NOAH", "VAGNER"]);

export function hasConfiguredEndpoint(endpoint = RSVP.endpoint) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
}

export function isLocallyBeforeCutoff(now = new Date()) {
  return now.getTime() < new Date(EVENT.cutoffIso).getTime();
}
