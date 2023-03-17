import { fetchApiResults } from "../util/api.js";
import { createHTML } from "../util/createHTML.js";

const articleId = new URLSearchParams(window.location.search).get("id");
const main = document.querySelector("#main-content");
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
    category.innerText = articleRes._embedded["wp:term"][0][0].name;
    const categoryId = articleRes._embedded["wp:term"][0][0].id;
    category.setAttribute("href", `./articles.html?category=${categoryId}`);
    featuredImage.setAttribute("src", articleRes._embedded["wp:featuredmedia"][0].source_url);
    featuredImage.setAttribute("alt", articleRes._embedded["wp:featuredmedia"][0].alt_text);
    article.querySelector("header h1").innerText = articleRes.title.rendered;
    article.querySelector(".article-content").innerHTML = articleRes.content.rendered;

    article.querySelector("#date").innerText = setDate(articleRes.date);

    main.prepend(article);
  } catch (error) {
    console.log(error);
  }
};

const loadComments = async (e) => {
  commentPage++;
  const comments = await fetchApiResults("/wp/v2/comments", `?post=${articleId}&page=${commentPage}&_embed`);
  renderComments(comments);
  if (commentPage == comments.resHeader["x-wp-totalpages"]) {
    e.target.remove();
  }
};

const renderComment = (comment) => {
  const template = document.querySelector("#template_comment");
  const commentElem = template.content.cloneNode(true);
  console.log(comment);
  commentElem.querySelector("h3").innerText = comment.author_name;
  commentElem.querySelector("#content").innerHTML = comment.content.rendered;
  commentElem.querySelector("#time").innerText = setDate(comment.date);
  return commentElem;
};

const createErrorDialog = (errorType, message) => {
  const error = createHTML("div", ["error-dialog", errorType], message);
  return error;
};

const renderComments = async (comments) => {
  if (comments.length === 0) {
    container.innerHTML = "";
    container.append(createErrorDialog("error", "There are no comments on this post yet"));
  } else {
    for (const comment of comments) {
      document.querySelector("#comments-ul").append(renderComment(comment));
    }
  }
};

const setupComments = async () => {
  try {
    const comments = await fetchApiResults("/wp/v2/comments", `?post=${articleId}&page=${commentPage}&_embed`);
    const container = document.querySelector("#comments-container");
    const commentCount = comments.resHeader["x-wp-total"];

    renderComments(comments);

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
