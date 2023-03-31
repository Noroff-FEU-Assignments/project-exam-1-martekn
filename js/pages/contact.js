import { fetchApi } from "../util/api.js";
import { emailValidation, characterValidation, setupEmailEventListener, validationError } from "../util/validation.js";
import { renderAlertDialog } from "../components/error.js";
const form = document.querySelector("form");
const firstFormElem = form.querySelector(":first-child");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const subjectInput = document.querySelector("#subject");
const messageInput = document.querySelector("#message");

const errorInfo = {
  name: {
    id: "name-error",
    errorMessage: "Your name has to contain at least 5 characters",
  },
  email: {
    id: "email-error",
    errorMessage: "Enter a valid email",
  },
  subject: {
    id: "subject-error",
    errorMessage: "Your subject has to contain at least 15 characters",
  },
  message: {
    id: "message-error",
    errorMessage: "Your message has to contain at least 25 characters",
  },
};

const renderSuccessMessage = () => {
  const template = document.querySelector("#template_success");
  const success = template.content.cloneNode(true);

  return success;
};

const submitForm = async (e) => {
  const requestBody = new FormData(e.target);
  const errorMessage = "Comment did not send, something happened on our end. Please try again";
  const fetchInit = {
    method: "POST",
    body: requestBody,
  };

  if (document.querySelector("#message-alert")) {
    document.querySelector("#message-alert").remove();
  }

  try {
    const response = await fetchApi("/contact-form-7/v1/contact-forms/166/feedback", null, fetchInit);
    if (response.ok) {
      form.reset();
      form.remove();

      document.querySelector("#main-content").append(renderSuccessMessage());
    } else {
      console.log("error", response);
      firstFormElem.after(renderAlertDialog("error", errorMessage, "message-alert"));
    }
  } catch (error) {
    console.log(error);
    firstFormElem.after(renderAlertDialog("error", errorMessage, "message-alert"));
  }
};

const validateForm = (e) => {
  e.preventDefault();
  const validation = {
    name: characterValidation(nameInput.value, 5),
    email: emailValidation(emailInput.value),
    subject: characterValidation(subjectInput.value, 15),
    message: characterValidation(messageInput.value, 25),
  };

  if (validation.name && validation.email && validation.subject && validation.message) {
    submitForm(e);
  } else {
    validationError(nameInput, validation.name, errorInfo.name.id, errorInfo.name.errorMessage);

    validationError(emailInput, validation.email, errorInfo.email.id, errorInfo.email.errorMessage);

    validationError(subjectInput, validation.subject, errorInfo.subject.id, errorInfo.subject.errorMessage);

    validationError(messageInput, validation.message, errorInfo.message.id, errorInfo.message.errorMessage);
  }
};

export const setupContact = () => {
  form.reset();
  setupEmailEventListener(emailInput, errorInfo.email.id, errorInfo.email.errorMessage);
  form.addEventListener("submit", validateForm);

  nameInput.addEventListener("focusout", function (e) {
    const validated = characterValidation(nameInput.value.trim(), 5);
    validationError(this, validated, errorInfo.name.id, errorInfo.name.errorMessage);
  });

  nameInput.addEventListener("input", function (e) {
    const validated = characterValidation(nameInput.value.trim(), 5);
    if (validated && document.querySelector(`#${errorInfo.name.id}`)) {
      document.querySelector(`#${errorInfo.name.id}`).remove();
    }
  });
  subjectInput.addEventListener("focusout", function (e) {
    const validated = characterValidation(subjectInput.value.trim(), 15);
    validationError(this, validated, errorInfo.subject.id, errorInfo.subject.errorMessage);
  });

  subjectInput.addEventListener("input", function (e) {
    const validated = characterValidation(subjectInput.value.trim(), 15);
    if (validated && document.querySelector(`#${errorInfo.subject.id}`)) {
      document.querySelector(`#${errorInfo.subject.id}`).remove();
    }
  });

  messageInput.addEventListener("focusout", function (e) {
    const validated = characterValidation(messageInput.value.trim(), 25);
    validationError(this, validated, errorInfo.message.id, errorInfo.message.errorMessage);
  });

  messageInput.addEventListener("input", function (e) {
    const validated = characterValidation(messageInput.value.trim(), 25);
    if (validated && document.querySelector(`#${errorInfo.message.id}`)) {
      document.querySelector(`#${errorInfo.message.id}`).remove();
    }
  });
};
