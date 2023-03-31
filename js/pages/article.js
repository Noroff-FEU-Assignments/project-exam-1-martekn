import { fetchApi } from "../util/api.js";
import { renderAlertDialog } from "../components/error.js";
import { createHTML } from "../util/htmlUtilities.js";
import { setupModalTrapFocus } from "../util/focus-trap.js";
import { renderAlertText } from "../components/error.js";
import { emailValidation, characterValidation, setupEmailEventListener, validationError } from "../util/validation.js";

const articleId = new URLSearchParams(window.location.search).get("id");
const main = document.querySelector("#main-content");
const commentSection = document.querySelector("#comments-section");
const container = document.querySelector("#comments-container");
const commentsUl = document.querySelector("#comments-ul");
const commentsLoader = container.querySelector(".loader");
const commentForm = document.querySelector("#comment-form");
const submitButton = commentForm.querySelector(".btn");
let commentPage = 1;

const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const commentInput = document.querySelector("#comment");

const errorInfo = {
  name: {
    id: "name-error",
    errorMessage: "Name is required",
  },
  email: {
    id: "email-error",
    errorMessage: "Enter a valid email",
  },
  comment: {
    id: "comment-error",
    errorMessage: "Your comment has to contain at least 15 characters",
  },
};

const body = document.querySelector("body");
const modal = document.querySelector("#img-modal");

const months = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  ["10"]: "October", // Added brackets to prevent potential bugs
  ["11"]: "November", // due to prettier removing double quotes
  ["12"]: "December",
};

const setDate = (createdDate) => {
  const date = new Date();

  createdDate = createdDate.split("T");
  const day = createdDate[0].split("-");
  const time = createdDate[1].split(":");

  const dateObj = {
    day: day[2],
    month: day[1],
    year: day[0],
    hour: time[0],
    minute: time[1],
    second: time[2],
  };

  if (dateObj.year != date.getFullYear()) {
    return `${months[dateObj.month]} ${dateObj.day}, ${dateObj.year}`;
  } else if (dateObj.month != date.getMonth() + 1 || dateObj.day != date.getDate()) {
    return `${months[dateObj.month]} ${dateObj.day}`;
  } else {
    if (date.getHours() - Number(dateObj.hour) > 0) {
      return `${date.getHours() - Number(dateObj.hour)}h ago`;
    } else if (date.getMinutes() - Number(dateObj.minute) > 0) {
      return `${date.getMinutes() - Number(dateObj.minute)}min ago`;
    } else {
      return "Just now";
    }
  }
};

const setupImageModalFocus = (e) => {
  setupModalTrapFocus(modal, "button", closeModal, e);
};

const openModal = (e) => {
  if (e.type === "click" || e.key === "Enter") {
    e.target.setAttribute("id", "modal-open");
    const img = modal.querySelector("img");
    const src = e.target.getAttribute("src");
    const alt = e.target.getAttribute("alt");
    img.setAttribute("src", src);
    img.setAttribute("alt", alt);
    body.classList.add("no-scroll");
    modal.classList.remove("hidden");

    modal.focus();

    document.addEventListener("keydown", setupImageModalFocus);
  }
};

const closeModal = () => {
  modal.classList.add("hidden");
  body.classList.remove("no-scroll");
  document.removeEventListener("keydown", setupImageModalFocus);
  const openedElement = document.querySelector("#modal-open");
  openedElement.focus();
  openedElement.removeAttribute("id");
};

const setupModal = (article) => {
  const featuredImage = article.querySelector("header img");
  featuredImage.setAttribute("tabindex", 0);
  featuredImage.addEventListener("click", openModal);
  featuredImage.addEventListener("keydown", openModal);
  const images = Array.from(article.querySelectorAll(".article-content img"));
  for (const image of images) {
    image.setAttribute("tabindex", 0);
    image.addEventListener("click", openModal);
    image.addEventListener("keydown", openModal);
  }
  const closeButton = document.querySelector("#modal-close");
  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
};

const renderArticle = async () => {
  try {
    const response = await fetchApi(`/wp/v2/posts/${articleId}`, "?_embed");
    const articleResponse = response.data;

    console.log(articleResponse);

    document.title = `${articleResponse.title.rendered} | Travella`;
    const excerpt = articleResponse.excerpt.rendered.replace("<p>", "").replace("</p>", "").replace("/n", "");
    document.querySelector("meta[name='description']").setAttribute("content", excerpt);

    const template = document.querySelector("#template_article");
    const article = template.content.cloneNode(true);

    const featuredImage = article.querySelector("header img");
    const category = article.querySelector("#category");
    const imageInfo = articleResponse._embedded["wp:featuredmedia"][0];

    category.innerText = articleResponse._embedded["wp:term"][0][0].name;
    featuredImage.setAttribute("src", imageInfo.source_url);
    featuredImage.setAttribute("alt", imageInfo.alt_text);
    article.querySelector("header h1").innerHTML = articleResponse.title.rendered;
    article.querySelector(".article-content").innerHTML = articleResponse.content.rendered;

    article.querySelector("#date").innerText = setDate(articleResponse.date);

    setupModal(article);

    main.querySelector(".loader").remove();
    main.prepend(article);
  } catch (error) {
    console.log(error);
    main.innerHTML = "";
    main.append(renderAlertDialog("alert", "Oops, content failed to load. Please try again later"));
  }
};

const loadComments = async (e) => {
  try {
    commentsLoader.classList.remove("hidden");
    commentPage++;
    const response = await fetchApi("/wp/v2/comments", `?post=${articleId}&page=${commentPage}&_embed`);
    commentsLoader.classList.add("hidden");
    renderComments(response.data);
    if (commentPage == response.parsedHeader["x-wp-totalpages"]) {
      e.target.remove();
    }
  } catch (error) {
    console.log(error);
    e.target.remove();
    commentsUl.append(renderAlertDialog("alert", "Oops, content failed to load. Please try again later"));
  }
};

const renderComment = (comment) => {
  const template = document.querySelector("#template_comment");
  const commentElem = template.content.cloneNode(true);
  commentElem.querySelector("h3").innerText = comment.author_name;
  commentElem.querySelector("#content").innerHTML = comment.content.rendered;
  commentElem.querySelector("#time").innerText = setDate(comment.date);
  return commentElem;
};

const renderComments = async (comments, parent) => {
  if (comments.length === 0) {
    parent.innerHTML = "";
    parent.append(renderAlertDialog("alert", "There are no comments on this post yet"));
  } else {
    for (const comment of comments) {
      commentsUl.append(renderComment(comment));
    }
  }
};

const fetchComments = async () => {
  try {
    const response = await fetchApi("/wp/v2/comments", `?post=${articleId}&page=${commentPage}&_embed`);

    const commentCount = response.parsedHeader["x-wp-total"];
    commentsLoader.classList.add("hidden");
    renderComments(response.data, container);
    if (commentCount > 10) {
      const button = createHTML("button", ["btn", "btn--primary"], "See more");
      button.addEventListener("click", loadComments);
      container.append(button);
    }
    document.querySelector("#comment-count").innerText = `( ${commentCount} )`;
  } catch (error) {
    console.log(error);
    commentSection.innerHTML = "";
    commentSection.append(renderAlertDialog("alert", "Oops, comments failed to load. Please try again later"));
  }
};

const submitComment = async (e) => {
  const firstFormElem = commentForm.querySelector(":first-child");

  const reqBody = JSON.stringify({
    post: articleId,
    author_name: nameInput.value.trim(),
    author_email: emailInput.value.trim(),
    content: commentInput.value.trim(),
  });

  const fetchInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: reqBody,
  };

  try {
    const response = await fetchApi("/wp/v2/comments", null, fetchInit);

    console.log(response);

    if (response.ok) {
      commentForm.reset();
      firstFormElem.after(renderAlertDialog("success", "Comment sent", "comment-alert"));

      commentsUl.prepend(renderComment(response.data));
    } else {
      if (!response.data.message) {
        response.message = "Comment did not send, something happened on our end. Please try again";
      }
      console.log("error", response.data.message);
      firstFormElem.after(renderAlertDialog("error", response.data.message, "comment-alert"));
    }
  } catch (error) {
    console.log(error);
    firstFormElem.after(renderAlertDialog("error", error.message, "comment-alert"));
  }
};

const validateComment = (e) => {
  e.preventDefault();

  if (document.querySelector("#comment-alert")) {
    document.querySelector("#comment-alert").remove();
  }

  const validation = {
    name: characterValidation(nameInput.value),
    email: emailValidation(emailInput.value),
    comment: characterValidation(commentInput.value, 15),
  };

  if (validation.name && validation.email && validation.comment) {
    submitComment();
  } else {
    if (!validation.name && !document.querySelector(`#${errorInfo.name.id}`)) {
      nameInput.parentElement.append(renderAlertText("error", errorInfo.name.errorMessage, errorInfo.name.id));
    }
    if (!validation.email && !document.querySelector(`#${errorInfo.email.id}`)) {
      emailInput.parentElement.append(renderAlertText("error", errorInfo.email.errorMessage, errorInfo.email.id));
    }
    if (!validation.comment && !document.querySelector(`#${errorInfo.comment.id}`)) {
      commentInput.parentElement.append(renderAlertText("error", errorInfo.comment.errorMessage, errorInfo.comment.id));
    }
  }
};

const setupCommentForm = () => {
  commentForm.reset();

  nameInput.addEventListener("focusout", function (e) {
    const validated = characterValidation(nameInput.value.trim());
    validationError(this, validated, errorInfo.name.id, errorInfo.name.errorMessage);
  });

  nameInput.addEventListener("input", function (e) {
    const validated = characterValidation(nameInput.value.trim());
    if (validated && document.querySelector(`#${errorInfo.name.id}`)) {
      document.querySelector(`#${errorInfo.name.id}`).remove();
    }
  });

  setupEmailEventListener(emailInput, errorInfo.email.id, errorInfo.email.errorMessage);

  commentInput.addEventListener("focusout", function (e) {
    const validated = characterValidation(commentInput.value.trim(), 15);
    validationError(this, validated, errorInfo.comment.id, errorInfo.comment.errorMessage);
  });

  commentInput.addEventListener("input", function (e) {
    const validated = characterValidation(commentInput.value.trim(), 15);
    if (validated && document.querySelector(`#${errorInfo.comment.id}`)) {
      console.log(2);
      document.querySelector(`#${errorInfo.comment.id}`).remove();
    }
  });

  submitButton.addEventListener("click", validateComment);
};

export const setupArticle = () => {
  renderArticle();
  fetchComments();
  setupCommentForm();
};
