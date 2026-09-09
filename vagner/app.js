import { initInvitation } from "../shared/invitation.js";

const SOUND_VOLUME = 0.16;
const TRANSITION_MS = 1100;
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
let soundNeedsRetry = false;
let pausedForVisibility = false;
let retryListenersArmed = false;

if (vagnerAudio) vagnerAudio.volume = SOUND_VOLUME;

function isRetryExcluded(target) {
  return target instanceof Element && Boolean(target.closest("[data-sound-toggle], [data-skip], [data-skip-story]"));
}

function disarmSoundRetry() {
  if (!retryListenersArmed) return;
  retryListenersArmed = false;
  document.removeEventListener("pointerdown", retrySoundFromGesture, true);
  document.removeEventListener("keydown", retrySoundFromGesture, true);
}

function retrySoundFromGesture(event) {
  if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
  if (isRetryExcluded(event.target)) return;
  disarmSoundRetry();
  if (soundEnabled && soundNeedsRetry) startSound();
}

function armSoundRetry() {
  if (retryListenersArmed) return;
  retryListenersArmed = true;
  document.addEventListener("pointerdown", retrySoundFromGesture, true);
  document.addEventListener("keydown", retrySoundFromGesture, true);
}

function renderSoundState() {
  if (!soundToggle) return;
  const playing = soundStarted && vagnerAudio && !vagnerAudio.paused;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute(
    "aria-label",
    !soundEnabled ? "Ativar som" : soundNeedsRetry ? "Tentar iniciar som" : playing ? "Desativar som" : "Reproduzir som",
  );
  if (soundIcon) soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
}

async function startSound() {
  if (!vagnerAudio || document.hidden) return false;
  if (soundStarted && !vagnerAudio.paused) {
    soundNeedsRetry = false;
    renderSoundState();
    return true;
  }
  try {
    await vagnerAudio.play();
    soundEnabled = true;
    soundStarted = true;
    soundNeedsRetry = false;
    pausedForVisibility = false;
    disarmSoundRetry();
    renderSoundState();
    return true;
  } catch {
    soundNeedsRetry = true;
    pausedForVisibility = false;
    armSoundRetry();
    renderSoundState();
    return false;
  }
}

function stopSound() {
  vagnerAudio?.pause();
  soundEnabled = false;
  soundNeedsRetry = false;
  pausedForVisibility = false;
  disarmSoundRetry();
  renderSoundState();
}

soundToggle?.addEventListener("click", () => {
  if (soundEnabled) stopSound();
  else {
    soundEnabled = true;
    renderSoundState();
    startSound();
  }
});

vagnerAudio?.addEventListener("error", () => {
  soundStarted = false;
  soundNeedsRetry = true;
  pausedForVisibility = false;
  armSoundRetry();
  renderSoundState();
});

document.addEventListener("visibilitychange", () => {
  if (!vagnerAudio || !soundStarted) return;
  if (document.hidden && soundEnabled && !vagnerAudio.paused) {
    vagnerAudio.pause();
    pausedForVisibility = true;
    renderSoundState();
  } else if (!document.hidden && soundEnabled && pausedForVisibility) {
    startSound();
  }
});

renderSoundState();

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

  const activateIdentity = () => {
    arrival.dataset.active = "false";
    arrival.setAttribute("aria-hidden", "true");
    identity.dataset.active = "true";
  };

  if (reducedMotion) activateIdentity();
  else window.requestAnimationFrame(activateIdentity);

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
  if (soundEnabled) startSound();
  showIdentity();
});
finishButton?.addEventListener("click", () => finishIntro());
document.querySelector("[data-skip]")?.addEventListener("click", () => finishIntro());
document.querySelector("[data-skip-story]")?.addEventListener("click", () => finishIntro());
document.querySelector("[data-replay]")?.addEventListener("click", replayIntro);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && intro?.dataset.state !== "complete") finishIntro();
});

intro?.setAttribute("aria-hidden", "false");
content?.setAttribute("inert", "");
content?.setAttribute("aria-hidden", "true");

initInvitation({ origin: "VAGNER" });
