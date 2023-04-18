import { renderAlertText } from "../components/error.js";
/**
 * Checks if characters is equal to or more than amountOfChar
 * @param {String} value
 * @param {Number} [amountOfChar]
 * @returns Boolean
 */
export const characterValidation = (value, amountOfChar = 1) => value.length >= amountOfChar;

/**
 * Sets up error message for validation
 * @param {HTMLElement} input
 * @param {Boolean} validated
 * @param {String} errorId - unique id to get error element later
 * @param {String} errorMessage
 */
export const validationError = (input, validated, errorId, errorMessage) => {
  if (!validated && !document.querySelector(`#${errorId}`)) {
    input.parentElement.append(renderAlertText("error", errorMessage, errorId));
  } else if (validated && document.querySelector(`#${errorId}`)) {
    document.querySelector(`#${errorId}`).remove();
  }
};

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
export const setupEmailEventListener = (emailInput, id, errorMessage, formObj) => {
  let timeout;
  let validated = false;

  emailInput.addEventListener("focusout", function (e) {
    if (formObj.isActive) {
      validated = emailValidation(emailInput.value);
      if (!validated && !document.querySelector(`#${id}`)) {
        emailInput.parentElement.append(renderAlertText("error", errorMessage, id));
      }
    }
  });

  emailInput.addEventListener("input", function (e) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = 0;
    }

    if (!formObj.isActive) {
      formObj.isActive = true;
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
