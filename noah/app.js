import { initInvitation } from "../shared/invitation.js";

initInvitation({ origin: "NOAH" });

const SOUND_KEY = "vnl_noah_sound";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const screens = [...document.querySelectorAll("[data-screen]")];
const progress = document.querySelector("[data-progress]");
const progressBar = document.querySelector("[data-progress-bar]");
const soundToggle = document.querySelector("[data-sound-toggle]");
const soundIcon = document.querySelector("[data-sound-icon]");
const toast = document.querySelector("[data-toast]");
const playerForm = document.querySelector("[data-player-form]");
const playerInput = document.querySelector("#player-name");
const gears = [...document.querySelectorAll("[data-gear]")];
const powerCounter = document.querySelector("[data-power-counter]");
const powerFeedback = document.querySelector("[data-power-feedback]");
const pathAnswers = [...document.querySelectorAll("[data-answer]")];
const pathFeedback = document.querySelector("[data-path-feedback]");
const meter = document.querySelector("[data-faith-meter]");
const needle = document.querySelector("[data-faith-needle]");
const meterFeedback = document.querySelector("[data-meter-feedback]");
const stabilizeButton = document.querySelector("[data-stabilize]");
const confettiColors = ["#15e8ff", "#67f58d", "#c8ff4f", "#a56bff", "#ff65c7", "#ffe35a", "#ffffff"];

let playerName = "Player";
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
let audioContext = null;
let toastTimer = null;
let equipped = new Set();
let meterFrame = null;
let meterStart = 0;
let meterPosition = 0;
let meterComplete = false;

function setProgress(value) {
  progress.setAttribute("aria-valuenow", String(value));
  progressBar.style.width = `${value}%`;
}

function focusSoon(target) {
  window.setTimeout(() => target?.focus({ preventScroll: true }), reducedMotion ? 0 : 180);
}

function showScreen(name, percentage, focusTarget) {
  screens.forEach((screen) => {
    const active = screen.dataset.screen === name;
    screen.hidden = !active;
    screen.classList.toggle("is-active", active);
    screen.setAttribute("aria-hidden", String(!active));
    if (active) screen.removeAttribute("inert");
    else screen.setAttribute("inert", "");
  });
  setProgress(percentage);
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  focusSoon(focusTarget);
}

function renderSound() {
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "Desativar sons" : "Ativar sons");
  soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
}

async function ensureAudioContext() {
  if (!soundEnabled) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") await audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

async function tone(frequency = 220, duration = 0.08, type = "square", gain = 0.045) {
  const context = await ensureAudioContext();
  if (!context) return;
  try {
    const oscillator = context.createOscillator();
    const amplifier = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    amplifier.gain.setValueAtTime(gain, context.currentTime);
    amplifier.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(amplifier).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  } catch {
    // O jogo continua funcional mesmo quando Web Audio não está disponível.
  }
}

function toneSequence(frequencies, options = {}) {
  frequencies.forEach((frequency, index) => {
    window.setTimeout(() => tone(frequency, options.duration || 0.14, options.type || "square", options.gain || 0.04), index * (options.gap || 90));
  });
}

function successSound() {
  toneSequence([392, 523, 659, 784], { duration: 0.18 });
}

function errorSound() {
  tone(115, 0.22, "sawtooth", 0.04);
}

function notify(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1900);
}

function updatePlayerCopy() {
  document.querySelectorAll("[data-player-name]").forEach((node) => { node.textContent = playerName; });
  document.querySelector("[data-final-greeting]").textContent = `Parabéns, ${playerName}! Você concluiu todas as fases e desbloqueou este convite especial.`;
}

function resetPowers() {
  equipped = new Set();
  gears.forEach((gear) => {
    gear.disabled = false;
    gear.setAttribute("aria-pressed", "false");
  });
  powerCounter.textContent = "0 de 6 equipamentos conquistados";
  powerFeedback.textContent = "";
  powerFeedback.dataset.tone = "neutral";
  powerFeedback.hidden = true;
  document.querySelector("[data-reward-one]").hidden = true;
  document.querySelector("[data-to-mission-two]").hidden = true;
}

function resetPath() {
  pathAnswers.forEach((answer) => {
    answer.disabled = false;
    answer.classList.remove("is-correct", "is-wrong", "shake");
  });
  pathFeedback.textContent = "Escolha uma rota.";
  pathFeedback.dataset.tone = "neutral";
  document.querySelector("[data-reward-two]").hidden = true;
  document.querySelector("[data-to-mission-three]").hidden = true;
}

function updateMeter(position) {
  meterPosition = Math.max(0, Math.min(100, position));
  const rounded = Math.round(meterPosition);
  needle.style.left = `${meterPosition}%`;
  meter.dataset.position = meterPosition.toFixed(1);
  meter.setAttribute("aria-valuenow", String(rounded));
}

function stopMeter() {
  if (meterFrame) cancelAnimationFrame(meterFrame);
  meterFrame = null;
}

function startMeter() {
  stopMeter();
  meterComplete = false;
  stabilizeButton.disabled = false;
  stabilizeButton.textContent = "ATIVAR AGORA!";
  meterFeedback.textContent = "A barra está carregando...";
  meterFeedback.dataset.tone = "neutral";
  document.querySelector("[data-reward-three]").hidden = true;
  document.querySelector("[data-unlock]").hidden = true;
  meter.classList.remove("shake");

  if (reducedMotion) {
    updateMeter(50);
    return;
  }

  meterStart = performance.now();
  const animate = (now) => {
    const elapsed = (now - meterStart) / 760;
    updateMeter((Math.sin(elapsed) + 1) * 50);
    if (!meterComplete) meterFrame = requestAnimationFrame(animate);
  };
  meterFrame = requestAnimationFrame(animate);
}

function resetMeter() {
  stopMeter();
  meterComplete = false;
  updateMeter(0);
  stabilizeButton.disabled = false;
  stabilizeButton.textContent = "ATIVAR AGORA!";
  meterFeedback.textContent = "A barra está carregando...";
  meterFeedback.dataset.tone = "neutral";
  meter.classList.remove("shake");
  document.querySelector("[data-reward-three]").hidden = true;
  document.querySelector("[data-unlock]").hidden = true;
}

function confettiBurst() {
  if (reducedMotion) return;
  const count = window.innerWidth <= 430 ? 44 : 64;
  for (let index = 0; index < count; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.setProperty("--fall-duration", `${2.5 + Math.random() * 2.2}s`);
    piece.style.setProperty("--turn", `${Math.random() * 720}deg`);
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 5000);
  }
}

soundToggle.addEventListener("click", async () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
  renderSound();
  if (soundEnabled) {
    await ensureAudioContext();
    tone(440, 0.08);
    notify("Sons ativados");
  } else {
    notify("Sons desativados");
    try { await audioContext?.suspend(); } catch { /* sem impacto no jogo */ }
  }
});

document.querySelector("[data-accept]").addEventListener("click", () => {
  toneSequence([180, 280], { duration: 0.1, gap: 80 });
  showScreen("name", 8, playerInput);
});

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = playerInput.value.trim();
  if (!value) return;
  playerName = value.replace(/[<>]/g, "").slice(0, 24);
  updatePlayerCopy();
  resetPowers();
  successSound();
  showScreen("mission1", 18, document.querySelector("#mission-one-title"));
});

gears.forEach((gear) => {
  gear.addEventListener("click", () => {
    if (equipped.has(gear.dataset.gear)) return;
    equipped.add(gear.dataset.gear);
    gear.setAttribute("aria-pressed", "true");
    gear.disabled = true;
    const count = equipped.size;
    powerCounter.textContent = `${count} de ${gears.length} equipamentos conquistados`;
    powerFeedback.textContent = `${gear.dataset.gear}: ${gear.dataset.message}`;
    powerFeedback.dataset.tone = "success";
    powerFeedback.hidden = false;
    tone(260 + count * 90, 0.13, "square", 0.04);
    navigator.vibrate?.(25);

    if (count === gears.length) {
      powerFeedback.textContent = "Missão completa! A Armadura de Deus está equipada.";
      document.querySelector("[data-reward-one]").hidden = false;
      document.querySelector("[data-to-mission-two]").hidden = false;
      setProgress(38);
      successSound();
      focusSoon(document.querySelector("[data-to-mission-two]"));
    }
  });
});

document.querySelector("[data-to-mission-two]").addEventListener("click", () => {
  resetPath();
  showScreen("mission2", 43, document.querySelector("#mission-two-title"));
});

pathAnswers.forEach((answer) => {
  answer.addEventListener("click", () => {
    if (answer.dataset.answer === "correct") {
      pathAnswers.forEach((button) => {
        button.disabled = true;
        button.classList.toggle("is-correct", button === answer);
        button.classList.remove("is-wrong");
      });
      pathFeedback.textContent = "Rota correta! O caminho foi iluminado.";
      pathFeedback.dataset.tone = "success";
      document.querySelector("[data-reward-two]").hidden = false;
      document.querySelector("[data-to-mission-three]").hidden = false;
      setProgress(63);
      successSound();
      focusSoon(document.querySelector("[data-to-mission-three]"));
      return;
    }

    answer.classList.add("is-wrong", "shake");
    pathFeedback.textContent = "Essa rota não leva ao objetivo. Tente novamente!";
    pathFeedback.dataset.tone = "error";
    window.setTimeout(() => answer.classList.remove("shake"), 360);
    errorSound();
  });
});

document.querySelector("[data-to-mission-three]").addEventListener("click", () => {
  showScreen("mission3", 68, document.querySelector("#mission-three-title"));
  startMeter();
});

stabilizeButton.addEventListener("click", () => {
  if (meterPosition >= 41 && meterPosition <= 59) {
    meterComplete = true;
    stopMeter();
    stabilizeButton.disabled = true;
    stabilizeButton.textContent = "FÉ DESBLOQUEADA!";
    meterFeedback.textContent = "Acerto perfeito! Nível máximo alcançado.";
    meterFeedback.dataset.tone = "success";
    document.querySelector("[data-reward-three]").hidden = false;
    document.querySelector("[data-unlock]").hidden = false;
    setProgress(91);
    successSound();
    navigator.vibrate?.([35, 35, 70]);
    focusSoon(document.querySelector("[data-unlock]"));
    return;
  }

  meterFeedback.textContent = "Quase! Tente novamente quando o marcador estiver no centro verde.";
  meterFeedback.dataset.tone = "error";
  meter.classList.add("shake");
  window.setTimeout(() => meter.classList.remove("shake"), 360);
  errorSound();
});

document.querySelector("[data-unlock]").addEventListener("click", () => {
  showScreen("final", 100, document.querySelector("#final-title"));
  successSound();
  confettiBurst();
});

document.querySelector("[data-restart]").addEventListener("click", () => {
  stopMeter();
  document.querySelectorAll(".confetti-piece").forEach((piece) => piece.remove());
  playerName = "Player";
  playerInput.value = "";
  document.querySelectorAll("[data-player-name]").forEach((node) => { node.textContent = "Player"; });
  document.querySelector("[data-final-greeting]").textContent = "";
  resetPowers();
  resetPath();
  resetMeter();
  tone(220, 0.08);
  showScreen("start", 0, document.querySelector("[data-accept]"));
});

renderSound();
resetPowers();
resetPath();
resetMeter();
showScreen("start", 0);
