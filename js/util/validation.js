import { renderAlertText } from "../components/error.js";
/**
 * Checks if characters is equal to or more than amountOfChar
 * @param {String} value
 * @param {Number} [amountOfChar]
 * @returns Boolean
 */
export const characterValidation = (value, amountOfChar = 1) => value.length >= amountOfChar;

/**
 * Validates the email based on regex pattern
 * @param {String} email
 * @returns Boolean
 */
export const emailValidation = (email) => {
  const regexPattern = /\S+\@\S+\.\S+/;
  const validated = regexPattern.test(email.trim());
  return validated;
};

/**
 * Sets up event listeners for the email input element.
 * @param {HTMLElement} emailInput
 * @param {String} id - unique id to get error element later
 * @param {String} errorMessage
 */
export const setupEmailEventListener = (emailInput, id, errorMessage) => {
  let timeout;
  let validated = false;

  emailInput.addEventListener("focusout", function (e) {
    validated = emailValidation(emailInput.value);
    if (!validated && !document.querySelector(`#${id}`)) {
      emailInput.parentElement.append(renderAlertText("error", errorMessage, id));
    }
  });

  emailInput.addEventListener("input", function (e) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = 0;
    }

    timeout = setTimeout(() => {
      validated = emailValidation(emailInput.value);
      if (!validated && !document.querySelector(`#${id}`)) {
        emailInput.parentElement.append(renderAlertText("error", errorMessage, id));
      }
    }, 1000);

    validated = emailValidation(emailInput.value);
    if (validated && document.querySelector(`#${id}`)) {
      document.querySelector(`#${id}`).remove();
    }
  });
};
