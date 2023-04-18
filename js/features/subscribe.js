import { emailValidation, setupEmailEventListener } from "../util/validation.js";
import { renderAlertDialog, renderAlertText } from "../components/error.js";

const form = document.querySelector("#sub-form");
const submitEmail = form.querySelector("#sub-email");
const inputParent = submitEmail.parentElement;

const emailInfo = {
  errorId: "sub-email-error",
  errorMessage: "Please enter a valid email",
};

// Its set as an object in order to pass updated value through setupEmailEventListener
const subFormStatus = { isActive: false };

const submitForm = (e) => {
  e.preventDefault();

  const validated = emailValidation(submitEmail.value);
  let alert = "";
  if (validated) {
    inputParent.innerHTML = "";
    alert = renderAlertDialog("success", "You have subscribed");
    inputParent.append(alert);
  } else if (!document.querySelector(`#${emailInfo.errorId}`)) {
    console.log("not valid");
    alert = renderAlertText("error", emailInfo.errorMessage, emailInfo.errorId);
    inputParent.append(alert);
  }
};

export const setupSubscribe = () => {
  setupEmailEventListener(submitEmail, emailInfo.errorId, emailInfo.errorMessage, subFormStatus);
  form.addEventListener("submit", submitForm);
};
