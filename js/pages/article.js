import { fetchApi } from "../util/api.js";
import { renderAlertDialog } from "../components/error.js";
import { createHTML } from "../util/htmlUtilities.js";
import { setupModalTrapFocus } from "../util/focus-trap.js";
import { renderAlertText } from "../components/error.js";
import { emailValidation, characterValidation, setupEmailEventListener, validationError } from "../util/validation.js";

const body = document.body;
const main = document.querySelector("#main-content");
const modal = document.querySelector("#img-modal");

const commentSection = document.querySelector("#comments-section");
const commentCount = commentSection.querySelector("#comment-count");
const commentListWrapper = commentSection.querySelector("#comments-container");
const commentList = commentListWrapper.querySelector("#comments-ul");
const commentsLoader = commentListWrapper.querySelector(".loader");

const commentForm = commentSection.querySelector("#comment-form");
const firstFormElem = commentForm.querySelector(":first-child");
const submitButton = commentForm.querySelector(".btn");
const nameInput = commentForm.querySelector("#name");
const emailInput = commentForm.querySelector("#email");
const commentInput = commentForm.querySelector("#comment");

const articleId = new URLSearchParams(window.location.search).get("id");
const commentsPerPage = 10;

let commentOffset = commentsPerPage;
let commentPage = 1;
let commentAmount = 0;

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

// Backets are added to prevent possible issues of
// the property names being numbers
const months = {
  ["0"]: "January",
  ["1"]: "February",
  ["2"]: "March",
  ["3"]: "April",
  ["4"]: "May",
  ["5"]: "June",
  ["6"]: "July",
  ["7"]: "August",
  ["8"]: "September",
  ["9"]: "October",
  ["10"]: "November",
  ["11"]: "December",
};

const setDate = (createdDate) => {
  const date = new Date();
  createdDate = new Date(`${createdDate}+0000`);

  const dateObj = {
    day: createdDate.getDate(),
    month: createdDate.getMonth(),
    year: createdDate.getFullYear(),
    hour: createdDate.getHours(),
    minute: createdDate.getMinutes(),
    second: createdDate.getSeconds(),
  };

  if (dateObj.year != date.getFullYear()) {
    return `${months[dateObj.month]} ${dateObj.day}, ${dateObj.year}`;
  } else if (dateObj.month != date.getMonth() || dateObj.day != date.getDate()) {
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

    const response = await fetchApi(
      "/wp/v2/comments",
      `?post=${articleId}&per_page=${commentsPerPage}&offset=${commentOffset}&_embed`
    );

    commentsLoader.classList.add("hidden");

    renderComments(response.data);

    if (commentPage == response.parsedHeader["x-wp-totalpages"]) {
      e.target.remove();
    } else {
      commentOffset += commentsPerPage;
    }
  } catch (error) {
    console.log(error);
    e.target.remove();
    commentList.append(renderAlertDialog("alert", "Oops, content failed to load. Please try again later"));
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
      commentList.append(renderComment(comment));
    }
  }
};

const fetchComments = async () => {
  try {
    const response = await fetchApi("/wp/v2/comments", `?post=${articleId}&page=${commentPage}&_embed`);

    commentAmount = response.parsedHeader["x-wp-total"];
    commentsLoader.classList.add("hidden");

    renderComments(response.data, commentListWrapper);

    if (commentAmount > 10) {
      const button = createHTML("button", ["btn", "btn--primary"], "See more");
      button.addEventListener("click", loadComments);
      commentListWrapper.append(button);
    }
    document.querySelector("#comment-count").innerText = `( ${commentAmount} )`;
  } catch (error) {
    console.log(error);
    commentSection.innerHTML = "";
    commentSection.append(renderAlertDialog("alert", "Oops, comments failed to load. Please try again later"));
  }
};

const submitComment = async () => {
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

    if (response.ok) {
      commentForm.reset();
      commentOffset++;
      commentAmount++;

      firstFormElem.after(renderAlertDialog("success", "Comment sent", "comment-alert"));
      commentList.prepend(renderComment(response.data));
      commentCount.innerText = `( ${commentAmount} )`;
    } else {
      console.log("error", response.data.message);

      if (!response.data.message) {
        response.message = "Comment did not send, something happened on our end. Please try again";
      }

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
    const nameAlert = document.querySelector(`#${errorInfo.name.id}`);
    const emailAlert = document.querySelector(`#${errorInfo.email.id}`);
    const messageAlert = document.querySelector(`#${errorInfo.comment.id}`);

    if (!validation.name && !nameAlert) {
      nameInput.parentElement.append(renderAlertText("error", errorInfo.name.errorMessage, errorInfo.name.id));
    }

    if (!validation.email && !emailAlert) {
      emailInput.parentElement.append(renderAlertText("error", errorInfo.email.errorMessage, errorInfo.email.id));
    }

    if (!validation.comment && !messageAlert) {
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
    const alert = document.querySelector(`#${errorInfo.name.id}`);

    if (validated && alert) {
      alert.remove();
    }
  });

  setupEmailEventListener(emailInput, errorInfo.email.id, errorInfo.email.errorMessage);

  commentInput.addEventListener("focusout", function (e) {
    const validated = characterValidation(commentInput.value.trim(), 15);
    validationError(this, validated, errorInfo.comment.id, errorInfo.comment.errorMessage);
  });

  commentInput.addEventListener("input", function (e) {
    const validated = characterValidation(commentInput.value.trim(), 15);
    const alert = document.querySelector(`#${errorInfo.comment.id}`);

    if (validated && alert) {
      alert.remove();
    }
  });

  submitButton.addEventListener("click", validateComment);
};

export const setupArticle = () => {
  renderArticle();
  fetchComments();
  setupCommentForm();
};
