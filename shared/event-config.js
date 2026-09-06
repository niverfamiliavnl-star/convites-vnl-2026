export const EVENT = Object.freeze({
  id: "VNL_2026",
  dateLabel: "26 de setembro de 2026",
  timeLabel: "14h",
  venue: "Sítio Jalisco",
  mapsUrl: "https://maps.app.goo.gl/N6HcsDhRMRoWT4E1A",
  note: "Traga sua roupa de banho",
  timezone: "America/Fortaleza",
  cutoffIso: "2026-09-16T03:00:00.000Z",
  cutoffLabel: "15 de setembro de 2026, às 23h59",
  contactEmail: "niver.familia.vnl@gmail.com",
  privacyNotice:
    "Seus dados serão utilizados exclusivamente para organizar as confirmações deste evento.",
});

export const RSVP = Object.freeze({
  // Substituído pela URL /exec somente após o deploy autorizado do Apps Script.
  endpoint: "__APPS_SCRIPT_WEB_APP_URL__",
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
