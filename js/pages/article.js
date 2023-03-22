import { fetchApiResults } from "../util/api.js";
import { renderAlertDialog } from "../components/error.js";
import { createHTML } from "../util/createHTML.js";
import { setupModalTrapFocus } from "../util/focus-trap.js";

const articleId = new URLSearchParams(window.location.search).get("id");
const main = document.querySelector("#main-content");
const container = document.querySelector("#comments-container");
const commentsLoader = container.querySelector(".loader");
let commentPage = 1;

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

const body = document.querySelector("body");
const modal = document.querySelector("#img-modal");

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
    const articleRes = await fetchApiResults(`/wp/v2/posts/${articleId}`, "?_embed");

    document.title = `${articleRes.title.rendered} | Travella`;
    const excerpt = articleRes.excerpt.rendered.replace("<p>", "").replace("</p>", "").replace("/n", "");
    document.querySelector("meta[name='description']").setAttribute("content", excerpt);

    const template = document.querySelector("#template_article");
    const article = template.content.cloneNode(true);

    const featuredImage = article.querySelector("header img");
    const category = article.querySelector("#category");
    const imageInfo = articleRes._embedded["wp:featuredmedia"][0];

    category.innerText = articleRes._embedded["wp:term"][0][0].name;
    featuredImage.setAttribute("src", imageInfo.source_url);
    featuredImage.setAttribute("alt", imageInfo.alt_text);
    article.querySelector("header h1").innerHTML = articleRes.title.rendered;
    article.querySelector(".article-content").innerHTML = articleRes.content.rendered;

    article.querySelector("#date").innerText = setDate(articleRes.date);

    setupModal(article);

    main.querySelector(".loader").remove();
    main.prepend(article);
  } catch (error) {
    console.log(error);
  }
};

const loadComments = async (e) => {
  try {
    commentsLoader.classList.remove("hidden");
    commentPage++;
    const comments = await fetchApiResults("/wp/v2/comments", `?post=${articleId}&page=${commentPage}&_embed`);
    commentsLoader.classList.add("hidden");
    renderComments(comments);
    if (commentPage == comments.resHeader["x-wp-totalpages"]) {
      e.target.remove();
    }
  } catch (error) {
    console.log(error);
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
      document.querySelector("#comments-ul").append(renderComment(comment));
    }
  }
};

const setupComments = async () => {
  try {
    const comments = await fetchApiResults("/wp/v2/comments", `?post=${articleId}&page=${commentPage}&_embed`);

    const commentCount = comments.resHeader["x-wp-total"];
    commentsLoader.classList.add("hidden");
    renderComments(comments, container);

    if (commentCount > 10) {
      const button = createHTML("button", ["btn", "btn--primary"], "See more");
      button.addEventListener("click", loadComments);
      container.append(button);
    }
    document.querySelector("#comment-count").innerText = `( ${commentCount} )`;
  } catch (error) {
    console.log(error);
  }
};

export const setupArticle = () => {
  renderArticle();
  setupComments();
};
