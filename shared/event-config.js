export const EVENT = Object.freeze({
  id: "VNL_2026",
  dateLabel: "26 de setembro de 2026",
  venue: "Sítio Geladão",
  mapsUrl: "https://maps.app.goo.gl/ZvDD1xucfFxfN2iw8",
  note: "Traga sua roupa de banho",
  dressCode: "Traje despojado",
  poolNotice: "Piscina liberada para as crianças — leve roupa de banho.",
  alcoholNotice: "Não serão aceitas bebidas alcoólicas.",
  timezone: "America/Fortaleza",
  cutoffIso: "2026-09-21T03:00:00.000Z",
  cutoffLabel: "20 de setembro de 2026, às 23h59",
  contactEmail: "niver.familia.vnl@gmail.com",
  privacyNotice:
    "Seus dados serão utilizados exclusivamente para organizar as confirmações deste evento.",
});

export const EVENT_TIMES = Object.freeze({
  HANNAH: Object.freeze({ timeLabel: "09h às 12h", startTime: "09:00", endTime: "12:00" }),
  VAGNER: Object.freeze({ timeLabel: "09h às 12h", startTime: "09:00", endTime: "12:00" }),
  NOAH: Object.freeze({ timeLabel: "15h às 18h", startTime: "15:00", endTime: "18:00" }),
});

export function getEventTime(origin) {
  const eventTime = EVENT_TIMES[origin];
  if (!eventTime) throw new TypeError(`Origem sem horário configurado: ${origin}`);
  return eventTime;
}

export const RSVP = Object.freeze({
  // Endpoint público do Web App de produção. IDs de planilha permanecem somente no projeto vinculado.
  endpoint: "https://script.google.com/macros/s/AKfycbxn8236bdwZyyfn5xs9MnCzCtgrJTm01epTT-HzgKYesYhXdpJZtxJTloftQfyj_s5fiA/exec",
  minPartySize: 1,
  maxPartySize: 20,
  statusTimeoutMs: 30000,
  submitTimeoutMs: 45000,
});

export const ORIGINS = Object.freeze(["HANNAH", "NOAH", "VAGNER"]);

export function hasConfiguredEndpoint(endpoint = RSVP.endpoint) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
}

export function isLocallyBeforeCutoff(now = new Date()) {
  return now.getTime() < new Date(EVENT.cutoffIso).getTime();
}
