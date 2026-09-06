import { initInvitation } from "../shared/invitation.js";

initInvitation({ origin: "NOAH" });

const gears = [...document.querySelectorAll("[data-gear]")];
const progress = document.querySelector("[data-progress]");
const progressBar = document.querySelector("[data-progress-bar]");
const message = document.querySelector("[data-mission-message]");
const complete = document.querySelector("[data-complete]");
const skip = document.querySelector("[data-skip-mission]");
const content = document.querySelector("[data-content]");
let equipped = 0;

function showInvitation() {
  localStorage.setItem("vnl:noah:mission", "seen");
  document.querySelector("#informacoes").scrollIntoView({ behavior: "smooth", block: "start" });
  content.focus({ preventScroll: true });
}

gears.forEach((gear) => {
  gear.addEventListener("click", () => {
    if (gear.getAttribute("aria-pressed") === "true") return;
    gear.setAttribute("aria-pressed", "true");
    equipped += 1;
    progress.textContent = `${equipped} / 6`;
    progressBar.style.width = `${(equipped / 6) * 100}%`;
    message.textContent = `${gear.dataset.gear}: ${gear.dataset.message}`;
    if (equipped === gears.length) {
      message.textContent = "Missão completa! A Armadura de Deus está equipada.";
      complete.hidden = false;
      complete.focus();
      localStorage.setItem("vnl:noah:mission", "seen");
    }
  });
});

complete.addEventListener("click", showInvitation);
skip.addEventListener("click", showInvitation);

if (localStorage.getItem("vnl:noah:mission") === "seen") {
  message.textContent = "Missão já concluída. Você pode jogar novamente ou ir direto ao convite.";
  skip.textContent = "Ver informações do convite";
}
