import { createHTML } from "../util/htmlUtilities.js";

/**
 * Creates a text alert element
 * @param {"error" | "alert" | "warning" | "success" | null | undefined} alertType
 * @param {String} message
 * @param {String} alertId - unique id to identify the element later on
 * @returns HTMLElement for text alerts
 */
export const renderAlertText = (alertType, message, alertId) => {
  const alert = createHTML("div", ["alert", alertType, "alert-type--text", "flex"], null, { id: alertId });

  if (alertType == "error") {
    const icon = createHTML("i", "ri-error-warning-line");
    alert.append(icon);
  }

  const messageElem = createHTML("span", "message", message);
  alert.append(messageElem);
  return alert;
};

/**
 * Creates a dialog alert element
 * @param {"error" | "alert" | "warning" | "success" | null | undefined} alertType
 * @param {String} message
 * @param {String | null } id
 * @returns HTMLElement for dialog alerts
 */
export const renderAlertDialog = (alertType = "alert", message, id) => {
  const alert = createHTML("div", ["alert", alertType, "alert-type--dialog", "flex"]);
  if (alertType == "error") {
    const icon = createHTML("i", "ri-error-warning-line");
    alert.append(icon);
  }

  const messageElem = createHTML("span", "message", message);
  if (id) {
    alert.setAttribute("id", id);
  }

  alert.append(messageElem);
  return alert;
};
