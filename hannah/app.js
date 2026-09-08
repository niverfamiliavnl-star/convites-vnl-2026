import { initInvitation } from "../shared/invitation.js";

const STORAGE_KEY = "vnl:hannah:intro";
const SOUND_STORAGE_KEY = "vnl_hannah_sound";
const SOUND_VOLUME = 0.18;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.querySelector("[data-intro]");
const content = document.querySelector("[data-content]");
const revelation = document.querySelector("[data-revelation]");
const discoverButton = document.querySelector("[data-discover]");
const sheet = document.querySelector("[data-sheet]");
const sheetBackdrop = document.querySelector("[data-sheet-backdrop]");
const resultYes = document.querySelector("[data-result-yes]");
const resultNo = document.querySelector("[data-result-no]");
const resultClosed = document.querySelector("[data-result-closed]");
const palaceAudio = document.querySelector("[data-palace-audio]");
const soundToggle = document.querySelector("[data-sound-toggle]");
const soundIcon = document.querySelector("[data-sound-icon]");
let returnFocus = null;
let sheetFocusTimer = null;
let contentFocusTimer = null;
let soundEnabled = true;
let soundStarted = false;
let pausedForVisibility = false;

try { soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "off"; } catch { /* Preferência opcional. */ }
if (palaceAudio) palaceAudio.volume = SOUND_VOLUME;

function rememberSound(value) {
  try { localStorage.setItem(SOUND_STORAGE_KEY, value); } catch { /* A experiência continua sem persistência local. */ }
}

function renderSoundState(playing = false) {
  if (!soundToggle) return;
  soundToggle.setAttribute("aria-pressed", String(playing));
  soundToggle.setAttribute("aria-label", playing ? "Desativar som" : "Ativar som");
  if (soundIcon) soundIcon.textContent = playing ? "🔊" : "🔇";
}

async function startSound({ remember = true } = {}) {
  if (!palaceAudio || document.hidden) return false;
  try {
    await palaceAudio.play();
    soundEnabled = true;
    soundStarted = true;
    pausedForVisibility = false;
    if (remember) rememberSound("on");
    renderSoundState(true);
    return true;
  } catch {
    soundEnabled = false;
    pausedForVisibility = false;
    if (remember) rememberSound("off");
    renderSoundState(false);
    return false;
  }
}

function stopSound({ remember = true } = {}) {
  palaceAudio?.pause();
  soundEnabled = false;
  pausedForVisibility = false;
  if (remember) rememberSound("off");
  renderSoundState(false);
}

soundToggle?.addEventListener("click", () => {
  if (soundEnabled && soundStarted && palaceAudio && !palaceAudio.paused) stopSound();
  else startSound();
});

palaceAudio?.addEventListener("error", () => {
  soundEnabled = false;
  pausedForVisibility = false;
  renderSoundState(false);
});

document.addEventListener("visibilitychange", () => {
  if (!palaceAudio || !soundStarted) return;
  if (document.hidden && soundEnabled && !palaceAudio.paused) {
    palaceAudio.pause();
    pausedForVisibility = true;
    renderSoundState(false);
  } else if (!document.hidden && soundEnabled && pausedForVisibility) {
    startSound({ remember: false });
  }
});

function hasSeenIntro() {
  try { return localStorage.getItem(STORAGE_KEY) === "seen"; } catch { return false; }
}

function rememberIntro() {
  try { localStorage.setItem(STORAGE_KEY, "seen"); } catch { /* A experiência continua sem persistência local. */ }
}

function focusContent() {
  window.clearTimeout(contentFocusTimer);
  contentFocusTimer = window.setTimeout(() => {
    contentFocusTimer = null;
    if (!sheet || sheet.hidden) content?.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 420);
}

function finishIntro({ focus = true } = {}) {
  rememberIntro();
  if (intro) {
    intro.dataset.state = "complete";
    intro.setAttribute("aria-hidden", "true");
  }
  if (revelation) {
    revelation.hidden = true;
    revelation.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");
  content?.removeAttribute("inert");
  content?.setAttribute("aria-hidden", "false");
  if (focus) focusContent();
}

function showRevelation() {
  if (!revelation) {
    finishIntro();
    return;
  }
  if (intro) {
    intro.dataset.state = "complete";
    intro.setAttribute("aria-hidden", "true");
  }
  revelation.hidden = false;
  revelation.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  discoverButton?.focus();
}

function focusFirstSheetField(attemptsLeft = 40) {
  sheetFocusTimer = null;
  if (!sheet || sheet.hidden) return;
  const firstField = document.querySelector("#hannah-nome");
  if (firstField instanceof HTMLInputElement && !firstField.disabled) {
    firstField.focus();
    return;
  }
  if (attemptsLeft > 0) {
    sheetFocusTimer = window.setTimeout(() => focusFirstSheetField(attemptsLeft - 1), 100);
  }
}

function openSheet(event) {
  if (!sheet || !sheetBackdrop) return;
  window.clearTimeout(contentFocusTimer);
  contentFocusTimer = null;
  returnFocus = event?.currentTarget instanceof HTMLElement ? event.currentTarget : document.activeElement;
  sheetBackdrop.hidden = false;
  sheet.hidden = false;
  sheet.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  window.clearTimeout(sheetFocusTimer);
  sheetFocusTimer = window.setTimeout(() => focusFirstSheetField(), reducedMotion ? 0 : 180);
}

function closeSheet({ restoreFocus = true } = {}) {
  if (!sheet || !sheetBackdrop) return;
  window.clearTimeout(sheetFocusTimer);
  sheetFocusTimer = null;
  sheetBackdrop.hidden = true;
  sheet.hidden = true;
  sheet.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (restoreFocus && returnFocus instanceof HTMLElement) returnFocus.focus();
}

function trapFocus(event, modal) {
  const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function scrollToResult(target) {
  target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
}

document.querySelector("[data-enter]")?.addEventListener("click", () => {
  showRevelation();
  if (soundEnabled) startSound();
});
document.querySelector("[data-skip]")?.addEventListener("click", () => finishIntro());
discoverButton?.addEventListener("click", () => finishIntro());
document.querySelector("[data-skip-revelation]")?.addEventListener("click", () => finishIntro());

document.querySelectorAll("[data-open-rsvp]").forEach((button) => button.addEventListener("click", openSheet));
document.querySelectorAll("[data-close-rsvp]").forEach((button) => button.addEventListener("click", () => closeSheet()));
sheetBackdrop?.addEventListener("click", () => closeSheet());
document.querySelectorAll("[data-edit-rsvp]").forEach((button) => button.addEventListener("click", (event) => {
  if (resultYes) resultYes.hidden = true;
  if (resultNo) resultNo.hidden = true;
  openSheet(event);
}));

document.querySelectorAll("[data-quantity-step]").forEach((button) => button.addEventListener("click", () => {
  const input = document.querySelector("#hannah-quantidade");
  if (!input) return;
  const step = Number(button.dataset.quantityStep);
  const current = Number(input.value || 1);
  input.value = String(Math.min(20, Math.max(1, current + step)));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}));

document.querySelector("#hannah-telefone")?.addEventListener("input", (event) => {
  const input = event.currentTarget;
  let digits = input.value.replace(/\D/g, "").slice(0, 13);
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  if (digits.length <= 2) input.value = digits;
  else if (digits.length <= 6) input.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  else if (digits.length <= 10) input.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  else input.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (sheet && !sheet.hidden) closeSheet();
    else if (revelation && !revelation.hidden) finishIntro();
    return;
  }
  if (event.key !== "Tab") return;
  if (sheet && !sheet.hidden) trapFocus(event, sheet);
  else if (revelation && !revelation.hidden) trapFocus(event, revelation);
});

window.addEventListener("vnl:rsvp:recorded", (event) => {
  closeSheet({ restoreFocus: false });
  if (resultClosed) resultClosed.hidden = true;
  const attending = event.detail?.presenca === "SIM";
  if (resultYes) resultYes.hidden = !attending;
  if (resultNo) resultNo.hidden = attending;
  scrollToResult(attending ? resultYes : resultNo);
});

window.addEventListener("vnl:rsvp:closed", () => {
  closeSheet({ restoreFocus: false });
  if (resultClosed) resultClosed.hidden = false;
  document.querySelectorAll("[data-open-rsvp]").forEach((button) => {
    button.disabled = true;
    button.textContent = "Prazo encerrado";
  });
  scrollToResult(resultClosed);
});

if (hasSeenIntro() || reducedMotion) {
  finishIntro({ focus: false });
} else {
  content?.setAttribute("inert", "");
  content?.setAttribute("aria-hidden", "true");
  intro?.setAttribute("aria-hidden", "false");
}

initInvitation({ origin: "HANNAH" });
