import { EVENT, RSVP, hasConfiguredEndpoint } from "./event-config.js";

const RESULT_TYPE = "VNL_RSVP_RESULT";
const VALID_CODES = new Set(["STATUS", "RECORDED", "CLOSED", "INVALID", "RATE_LIMITED", "BUSY", "ERROR"]);

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
}

function populateEventDetails() {
  setText("[data-event-date]", EVENT.dateLabel);
  setText("[data-event-time]", EVENT.timeLabel);
  setText("[data-event-venue]", EVENT.venue);
  setText("[data-event-note]", EVENT.note);
  setText("[data-event-cutoff]", EVENT.cutoffLabel);
  setText("[data-event-email]", EVENT.contactEmail);
  setText("[data-privacy]", EVENT.privacyNotice);
  document.querySelectorAll("[data-maps-link]").forEach((link) => {
    link.href = EVENT.mapsUrl;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
  });
  document.querySelectorAll("[data-email-link]").forEach((link) => {
    link.href = `mailto:${EVENT.contactEmail}`;
  });
}

function setStatus(node, message, tone = "neutral") {
  node.textContent = message;
  node.dataset.tone = tone;
}

function renderClosed(container) {
  container.innerHTML = `
    <div class="deadline-card" role="status">
      <p><strong>O prazo de confirmação foi encerrado.</strong></p>
      <p>Para falar com a família, escreva para
        <a data-email-link href="mailto:${EVENT.contactEmail}">${EVENT.contactEmail}</a>.
      </p>
    </div>`;
}

function setFormEnabled(form, enabled) {
  form.querySelectorAll('input:not([type="hidden"]), textarea, button').forEach((control) => {
    control.disabled = !enabled;
  });
  form.setAttribute("aria-busy", String(!enabled));
}

function buildStatusUrl(requestId) {
  const url = new URL(RSVP.endpoint);
  url.searchParams.set("action", "status");
  url.searchParams.set("request_id", requestId);
  return url.toString();
}

function isTrustedBackendOrigin(origin) {
  // HtmlService may give its innermost sandbox an opaque (`null`) origin.
  // The unguessable request_id below still binds the reply to this request.
  if (origin === "null") return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && (
      url.hostname === "script.google.com" ||
      url.hostname.endsWith(".googleusercontent.com")
    );
  } catch {
    return false;
  }
}

function normalizeClientPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (digits.length === 11 && digits[2] !== "9") return null;
  if (digits.length === 10 && !/[2-5]/.test(digits[2])) return null;
  return `55${digits}`;
}

export function initInvitation({ origin }) {
  populateEventDetails();

  const region = document.querySelector("[data-rsvp-region]");
  const form = document.querySelector("[data-rsvp-form]");
  const status = document.querySelector("[data-rsvp-status]");
  const frame = document.querySelector("[data-rsvp-frame]");
  if (!region || !form || !status || !frame) return;

  const originInput = form.elements.namedItem("origem");
  const eventInput = form.elements.namedItem("evento_id");
  const requestInput = form.elements.namedItem("request_id");
  const quantityWrap = form.querySelector("[data-quantity-field]");
  const quantity = form.elements.namedItem("quantidade");

  originInput.value = origin;
  eventInput.value = EVENT.id;
  form.action = hasConfiguredEndpoint() ? RSVP.endpoint : "about:blank";
  setFormEnabled(form, false);

  function updatePresence() {
    const selected = form.elements.namedItem("presenca").value;
    const attending = selected === "SIM";
    quantityWrap.hidden = !attending;
    quantity.required = attending;
    if (!attending) quantity.value = "";
  }

  form.querySelectorAll('input[name="presenca"]').forEach((radio) => {
    radio.addEventListener("change", updatePresence);
  });
  updatePresence();

  if (!hasConfiguredEndpoint()) {
    setStatus(status, "A confirmação ainda não está conectada. Tente novamente mais tarde.", "error");
    return;
  }

  let pendingRequestId = crypto.randomUUID();
  requestInput.value = pendingRequestId;
  setStatus(status, "Verificando a disponibilidade da confirmação…");
  frame.src = buildStatusUrl(pendingRequestId);

  const initialTimeout = window.setTimeout(() => {
    setFormEnabled(form, false);
    setStatus(status, "Não foi possível confirmar a disponibilidade agora. Tente novamente.", "error");
  }, RSVP.responseTimeoutMs);

  window.addEventListener("message", (event) => {
    // Apps Script renders HtmlService inside nested Google iframes, so the
    // message source is the inner frame rather than the form target itself.
    if (!isTrustedBackendOrigin(event.origin)) return;
    const data = event.data;
    if (!data || data.type !== RESULT_TYPE || data.request_id !== pendingRequestId || !VALID_CODES.has(data.code)) return;

    window.clearTimeout(initialTimeout);
    if (data.code === "STATUS") {
      if (data.rsvp_open) {
        setFormEnabled(form, true);
        setStatus(status, `Confirmações abertas até ${EVENT.cutoffLabel}.`);
      } else {
        renderClosed(region);
      }
      return;
    }

    form.setAttribute("aria-busy", "false");
    if (data.code === "RECORDED" && data.ok) {
      form.reset();
      updatePresence();
      setStatus(status, "Resposta registrada. Obrigado por confirmar!", "success");
      setFormEnabled(form, true);
      pendingRequestId = crypto.randomUUID();
      requestInput.value = pendingRequestId;
      return;
    }

    if (data.code === "CLOSED") {
      renderClosed(region);
      return;
    }

    const messages = {
      INVALID: data.message || "Revise os campos informados e tente novamente.",
      RATE_LIMITED: "Muitas tentativas em pouco tempo. Aguarde alguns minutos.",
      BUSY: "O serviço está ocupado. Aguarde um instante e tente novamente.",
      ERROR: "Não foi possível registrar agora. Tente novamente.",
    };
    setFormEnabled(form, true);
    setStatus(status, messages[data.code] || messages.ERROR, "error");
  });

  form.addEventListener("submit", (event) => {
    const canonicalPhone = normalizeClientPhone(form.elements.namedItem("telefone").value);
    if (!canonicalPhone) {
      event.preventDefault();
      setStatus(status, "Informe um telefone brasileiro válido com DDD.", "error");
      form.elements.namedItem("telefone").focus();
      return;
    }
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }
    form.querySelector('button[type="submit"]').disabled = true;
    form.setAttribute("aria-busy", "true");
    setStatus(status, "Enviando sua resposta…");
    window.setTimeout(() => {
      if (form.getAttribute("aria-busy") === "true") {
        setFormEnabled(form, true);
        setStatus(status, "A resposta demorou mais que o esperado. Confira a conexão antes de reenviar.", "error");
      }
    }, RSVP.responseTimeoutMs);
  });
}

export function setupIntro({ storageKey, enterButton, skipButton, intro, content }) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seen = localStorage.getItem(storageKey) === "seen";

  function reveal() {
    localStorage.setItem(storageKey, "seen");
    intro.dataset.state = "complete";
    content.removeAttribute("inert");
    content.setAttribute("aria-hidden", "false");
    window.setTimeout(() => content.focus({ preventScroll: true }), reducedMotion ? 0 : 500);
  }

  enterButton?.addEventListener("click", reveal);
  skipButton?.addEventListener("click", reveal);
  if (seen || reducedMotion) {
    reveal();
  } else {
    content.setAttribute("inert", "");
    content.setAttribute("aria-hidden", "true");
  }
}
