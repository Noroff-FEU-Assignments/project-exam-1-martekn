import { setupModalTrapFocus } from "../util/focus-trap.js";

const mobileScreenSize = window.matchMedia("(max-width: 42em)");
const nav = document.querySelector("#primary-nav");
const navFocusElements = "button, a";
const buttonOpen = document.querySelector("#nav-open");
const buttonClose = document.querySelector("#nav-close");

const setupNavTrapFocus = (e) => {
  setupModalTrapFocus(nav, navFocusElements, closeNav, e);
};

const openNav = (e) => {
  nav.setAttribute("data-visible", true);
  buttonOpen.setAttribute("aria-expanded", true);
  buttonClose.setAttribute("aria-expanded", true);
  document.body.classList.add("no-scroll");
  document.addEventListener("keydown", setupNavTrapFocus);
};

const closeNav = (e) => {
  nav.setAttribute("data-visible", false);
  buttonClose.setAttribute("aria-expanded", false);
  buttonOpen.setAttribute("aria-expanded", false);
  document.body.classList.remove("no-scroll");
  buttonOpen.focus();
  document.removeEventListener("keydown", setupNavTrapFocus);
};

export const setupMobileNav = () => {
  if (!mobileScreenSize.matches) {
    document.removeEventListener("keydown", setupNavTrapFocus);
  }

  mobileScreenSize.addEventListener("change", (e) => {
    if (!mobileScreenSize.matches) {
      document.removeEventListener("keydown", setupNavTrapFocus);
    }
  });

  if (buttonOpen) {
    buttonOpen.addEventListener("click", openNav);
  }

  if (buttonClose) {
    buttonClose.addEventListener("click", closeNav);
  }

  if (nav) {
    document.addEventListener("click", (e) => {
      if (
        nav.getAttribute("data-visible") === "true" &&
        e.target.closest("nav") !== nav &&
        e.target.closest("button") !== buttonOpen
      ) {
        closeNav(e);
      }
    });
  }
};
