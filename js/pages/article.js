import { fetchApiResults } from "../util/api.js";

const articleId = new URLSearchParams(window.location.search).get("id");
const main = document.querySelector("#main-content");

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

export const setupArticle = () => {
  renderArticle();
};
