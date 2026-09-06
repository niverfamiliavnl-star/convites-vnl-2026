import { initInvitation, setupIntro } from "../shared/invitation.js";

initInvitation({ origin: "VAGNER" });
setupIntro({
  storageKey: "vnl:vagner:intro",
  enterButton: document.querySelector("[data-enter]"),
  skipButton: document.querySelector("[data-skip]"),
  intro: document.querySelector("[data-intro]"),
  content: document.querySelector("[data-content]"),
});
