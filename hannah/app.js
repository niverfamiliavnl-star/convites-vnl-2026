import { initInvitation, setupIntro } from "../shared/invitation.js";

initInvitation({ origin: "HANNAH" });
setupIntro({
  storageKey: "vnl:hannah:intro",
  enterButton: document.querySelector("[data-enter]"),
  skipButton: document.querySelector("[data-skip]"),
  intro: document.querySelector("[data-intro]"),
  content: document.querySelector("[data-content]"),
});
