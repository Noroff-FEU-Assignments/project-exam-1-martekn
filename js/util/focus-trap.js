/**
 * Traps the tab and shift + tab to inside the modals focusable elements
 * @param {HTMLElement} modal
 * @param {String} focusableElements - String of elements to focus (css selectors)
 * @param {CallableFunction} closeFunction - The function to close that specific modal
 * @param {KeyboardEvent} e
 */
export const setupModalTrapFocus = (modal, focusableElements, closeFunction, e) => {
  if (modal) {
    let firstFocusElement;
    let lastFocusElement;
    if ((modal, focusableElements)) {
      const focusElements = modal.querySelectorAll(focusableElements);
      firstFocusElement = focusElements[0];
      lastFocusElement = focusElements[focusElements.length - 1];
    }
    const tabPressed = e.key === "Tab";

    if (e.key === "Shift" || e.key === "Enter") {
      return;
    }

    if (e.shiftKey && tabPressed) {
      if (document.activeElement === firstFocusElement) {
        lastFocusElement.focus();
        e.preventDefault();
      }
    } else if (tabPressed) {
      if (document.activeElement === lastFocusElement) {
        firstFocusElement.focus();
        e.preventDefault();
      }
    } else {
      closeFunction(e);
    }
  }
};
