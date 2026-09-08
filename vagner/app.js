import { initInvitation } from "../shared/invitation.js";

const STORAGE_KEY = "vnl:vagner:intro";
const SOUND_STORAGE_KEY = "vnl_vagner_sound";
const SOUND_VOLUME = 0.16;
const TRANSITION_MS = 700;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.querySelector("[data-intro]");
const arrival = document.querySelector('[data-scene="0"]');
const identity = document.querySelector('[data-scene="1"]');
const content = document.querySelector("[data-content]");
const enterButton = document.querySelector("[data-enter]");
const finishButton = document.querySelector("[data-finish]");
const vagnerAudio = document.querySelector("[data-vagner-audio]");
const soundToggle = document.querySelector("[data-sound-toggle]");
const soundIcon = document.querySelector("[data-sound-icon]");
let transitionTimer;
let soundEnabled = true;
let soundStarted = false;
let pausedForVisibility = false;

try { soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "off"; } catch { /* Preferência opcional. */ }
if (vagnerAudio) vagnerAudio.volume = SOUND_VOLUME;

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
  if (!vagnerAudio || document.hidden) return false;
  if (soundStarted && !vagnerAudio.paused) {
    renderSoundState(true);
    return true;
  }
  try {
    await vagnerAudio.play();
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
  vagnerAudio?.pause();
  soundEnabled = false;
  pausedForVisibility = false;
  if (remember) rememberSound("off");
  renderSoundState(false);
}

soundToggle?.addEventListener("click", () => {
  if (soundEnabled && soundStarted && vagnerAudio && !vagnerAudio.paused) stopSound();
  else startSound();
});

vagnerAudio?.addEventListener("error", () => {
  soundEnabled = false;
  pausedForVisibility = false;
  rememberSound("off");
  renderSoundState(false);
});

document.addEventListener("visibilitychange", () => {
  if (!vagnerAudio || !soundStarted) return;
  if (document.hidden && soundEnabled && !vagnerAudio.paused) {
    vagnerAudio.pause();
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

function clearTransition() {
  window.clearTimeout(transitionTimer);
}

function focusContent() {
  transitionTimer = window.setTimeout(
    () => content?.focus({ preventScroll: true }),
    reducedMotion ? 0 : TRANSITION_MS,
  );
}

function finishIntro({ focus = true } = {}) {
  clearTransition();
  rememberIntro();
  if (intro) {
    intro.dataset.state = "complete";
    intro.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("modal-open");
  content?.removeAttribute("inert");
  content?.setAttribute("aria-hidden", "false");
  if (focus) focusContent();
}

function showIdentity() {
  if (!intro || !arrival || !identity) {
    finishIntro();
    return;
  }

  clearTransition();
  identity.hidden = false;
  identity.setAttribute("aria-hidden", "false");
  intro.setAttribute("aria-labelledby", "identity-title");
  intro.dataset.state = "identity";

  window.requestAnimationFrame(() => {
    arrival.dataset.active = "false";
    arrival.setAttribute("aria-hidden", "true");
    identity.dataset.active = "true";
  });

  transitionTimer = window.setTimeout(
    () => finishButton?.focus({ preventScroll: true }),
    reducedMotion ? 0 : TRANSITION_MS,
  );
}

function replayIntro() {
  clearTransition();
  if (!intro || !arrival || !identity) return;

  intro.dataset.state = "arrival";
  intro.setAttribute("aria-hidden", "false");
  intro.setAttribute("aria-labelledby", "arrival-title");
  arrival.hidden = false;
  arrival.dataset.active = "true";
  arrival.setAttribute("aria-hidden", "false");
  identity.dataset.active = "false";
  identity.setAttribute("aria-hidden", "true");
  identity.hidden = true;
  content?.setAttribute("inert", "");
  content?.setAttribute("aria-hidden", "true");
  document.body.classList.add("modal-open");
  enterButton?.focus({ preventScroll: true });
}

enterButton?.addEventListener("click", () => {
  showIdentity();
  if (soundEnabled) startSound();
});
finishButton?.addEventListener("click", () => finishIntro());
document.querySelector("[data-skip]")?.addEventListener("click", () => finishIntro());
document.querySelector("[data-skip-story]")?.addEventListener("click", () => finishIntro());
document.querySelector("[data-replay]")?.addEventListener("click", replayIntro);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && intro?.dataset.state !== "complete") finishIntro();
});

if (hasSeenIntro() || reducedMotion) {
  finishIntro({ focus: false });
} else {
  intro?.setAttribute("aria-hidden", "false");
  content?.setAttribute("inert", "");
  content?.setAttribute("aria-hidden", "true");
}

initInvitation({ origin: "VAGNER" });
