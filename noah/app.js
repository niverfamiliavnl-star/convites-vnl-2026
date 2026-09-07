import { initInvitation } from "../shared/invitation.js";

initInvitation({ origin: "NOAH" });

const STORAGE_KEY = "vnl:noah:mission";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.querySelector("[data-mission-root]");
const intro = document.querySelector("[data-mission-intro]");
const stage = document.querySelector("[data-mission-stage]");
const stageTitle = document.querySelector("#loadout-title");
const start = document.querySelector("[data-start-mission]");
const skipIntro = document.querySelector("[data-skip-mission]");
const replay = document.querySelector("[data-replay-mission]");
const returningNote = document.querySelector("[data-returning-note]");
const gears = [...document.querySelectorAll("[data-gear]")];
const progress = document.querySelector("[data-progress]");
const progressBar = document.querySelector("[data-progress-bar]");
const feedback = document.querySelector(".mission-feedback");
const message = document.querySelector("[data-mission-message]");
const complete = document.querySelector("[data-complete]");
const skipStage = document.querySelector("[data-skip-stage]");
const banner = document.querySelector("[data-mission-banner]");
const content = document.querySelector("[data-content]");
const information = document.querySelector("#informacoes");
const equipped = new Set();

function focusSoon(target) {
  window.setTimeout(() => target?.focus({ preventScroll: true }), reducedMotion ? 0 : 180);
}

function showInvitation() {
  localStorage.setItem(STORAGE_KEY, "seen");
  root.dataset.state = "complete";
  banner.hidden = false;
  content.focus({ preventScroll: true });
  information.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function revealMission() {
  intro.hidden = true;
  stage.hidden = false;
  root.dataset.state = "mission";
  focusSoon(stageTitle);
}

function resetMission() {
  equipped.clear();
  gears.forEach((gear) => gear.setAttribute("aria-pressed", "false"));
  progress.textContent = `0/${gears.length}`;
  progressBar.style.width = "0%";
  message.textContent = "Escolha qualquer peça para começar a equipar.";
  feedback.dataset.feedbackState = "idle";
  complete.hidden = true;
  banner.hidden = true;
  revealMission();
}

function equip(gear) {
  if (equipped.has(gear.dataset.gear)) return;

  equipped.add(gear.dataset.gear);
  gear.setAttribute("aria-pressed", "true");
  const count = equipped.size;
  progress.textContent = `${count}/${gears.length}`;
  progressBar.style.width = `${(count / gears.length) * 100}%`;
  message.textContent = `${gear.dataset.gear}: ${gear.dataset.message}`;
  feedback.dataset.feedbackState = "active";

  if (count === gears.length) {
    root.dataset.state = "ready";
    message.textContent = "Missão completa! A Armadura de Deus está equipada.";
    feedback.dataset.feedbackState = "complete";
    complete.hidden = false;
    localStorage.setItem(STORAGE_KEY, "seen");
    focusSoon(complete);
  }
}

gears.forEach((gear) => gear.addEventListener("click", () => equip(gear)));
start?.addEventListener("click", revealMission);
skipIntro?.addEventListener("click", showInvitation);
replay?.addEventListener("click", resetMission);
skipStage?.addEventListener("click", showInvitation);
complete?.addEventListener("click", showInvitation);

if (localStorage.getItem(STORAGE_KEY) === "seen") {
  root.dataset.state = "returning";
  start.textContent = "Ver convite";
  start.removeEventListener("click", revealMission);
  start.addEventListener("click", showInvitation);
  skipIntro.hidden = true;
  replay.hidden = false;
  returningNote.hidden = false;
}
