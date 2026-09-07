import { initInvitation } from "../shared/invitation.js";

const STORAGE_KEY = "vnl:vagner:intro";
const SCENE_LABELS = ["Fundamento", "Raízes", "Casa", "Fé"];
const SCENE_INTERVAL = 1150;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.querySelector("[data-intro]");
const entryPanel = document.querySelector("[data-entry-panel]");
const cinematic = document.querySelector("[data-cinematic]");
const content = document.querySelector("[data-content]");
const enterButton = document.querySelector("[data-enter]");
const finishButton = document.querySelector("[data-finish]");
const progress = document.querySelector("[data-story-progress]");
const status = document.querySelector("[data-story-status]");
const scenes = [...document.querySelectorAll("[data-scene]")];
const progressSteps = [...document.querySelectorAll("[data-progress-step]")];
let sceneTimers = [];

function hasSeenIntro() {
  try { return localStorage.getItem(STORAGE_KEY) === "seen"; } catch { return false; }
}

function rememberIntro() {
  try { localStorage.setItem(STORAGE_KEY, "seen"); } catch { /* A experiência continua sem persistência local. */ }
}

function clearSceneTimers() {
  sceneTimers.forEach((timer) => window.clearTimeout(timer));
  sceneTimers = [];
}

function activateScene(index) {
  scenes.forEach((scene, sceneIndex) => {
    const active = sceneIndex === index;
    scene.dataset.active = String(active);
    scene.setAttribute("aria-hidden", String(!active));
  });
  progressSteps.forEach((step, stepIndex) => { step.dataset.active = String(stepIndex === index); });
  progress?.setAttribute("aria-valuenow", String(index + 1));
  if (status) status.textContent = SCENE_LABELS[index];
  if (finishButton) finishButton.hidden = index !== scenes.length - 1;
}

function focusContent() {
  window.setTimeout(() => content?.focus({ preventScroll: true }), reducedMotion ? 0 : 700);
}

function finishIntro({ focus = true } = {}) {
  clearSceneTimers();
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

function startStory() {
  if (!intro || !entryPanel || !cinematic) {
    finishIntro();
    return;
  }
  clearSceneTimers();
  intro.dataset.state = "playing";
  entryPanel.hidden = true;
  cinematic.hidden = false;
  activateScene(0);
  cinematic.focus({ preventScroll: true });
  scenes.slice(1).forEach((_, index) => {
    sceneTimers.push(window.setTimeout(() => activateScene(index + 1), SCENE_INTERVAL * (index + 1)));
  });
}

function replayIntro() {
  clearSceneTimers();
  if (!intro || !entryPanel || !cinematic) return;
  intro.dataset.state = "idle";
  intro.setAttribute("aria-hidden", "false");
  entryPanel.hidden = false;
  cinematic.hidden = true;
  activateScene(0);
  content?.setAttribute("inert", "");
  content?.setAttribute("aria-hidden", "true");
  document.body.classList.add("modal-open");
  enterButton?.focus({ preventScroll: true });
}

enterButton?.addEventListener("click", startStory);
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
