import { fetchApi } from "../util/api.js";
import { createHTML, decodeHTML } from "../util/htmlUtilities.js";
import { renderAlertDialog } from "../components/error.js";

const categoryContainer = document.querySelector("#category-container");
const categoryList = categoryContainer.querySelector("#category");

const articleContainer = document.querySelector("#posts-container");
const postsList = articleContainer.querySelector("#posts");
const loadButton = articleContainer.querySelector("#see-more");
const articleLoader = articleContainer.querySelector(".loader");

let postsPage = 1;
let categoryId;

const loadPosts = async () => {
  articleLoader.classList.remove("hidden");

  try {
    let response = [];
    postsPage++;

    if (categoryId) {
      response = await fetchApi("/wp/v2/posts", `?categories=${Number(categoryId)}&page=${postsPage}&_embed`);
    } else {
      response = await fetchApi("/wp/v2/posts", `?page=${postsPage}&_embed`);
    }

    const totalPostsPages = response.parsedHeader["x-wp-totalpages"];

    loadButton.classList.add("hidden");
    articleLoader.classList.add("hidden");

    renderPosts(response.data);

    if (loadButton.classList.contains("hidden") && postsPage < totalPostsPages) {
      loadButton.classList.remove("hidden");
    }
  } catch (error) {
    console.log(error);
    articleContainer.innerHTML = "";
    articleContainer.append(renderAlertDialog("alert", "Oops, content failed to load. Please try again later"));
  }
};

const renderPost = (post) => {
  const template = document.querySelector("#template_large-card");
  const card = template.content.cloneNode(true);
  const titleLink = card.querySelector("h2 a");
  const excerpt = decodeHTML(post.excerpt.rendered.replace("<p>", "").replace("</p>", ""));
  const image = card.querySelector("img");
  const featuredImage = post._embedded["wp:featuredmedia"][0];
  const categoryName = post._embedded["wp:term"][0][0].name;

  titleLink.innerText = decodeHTML(post.title.rendered);
  titleLink.setAttribute("href", `./article.html?id=${post.id}`);
  card.querySelector("p").innerText = excerpt;
  image.setAttribute("src", featuredImage.source_url);
  image.setAttribute("alt", featuredImage.alt_text);
  card.querySelector(".category-item").innerText = categoryName;

  return card;
};

const renderPosts = async (posts) => {
  if (posts.length === 0) {
    let errorMessage = "There are no posts";
    postsList.innerHTML = "";

    if (categoryId) {
      errorMessage = "There are no posts for this category";
    }

    postsList.append(renderAlertDialog("alert", errorMessage));

    if (!loadButton.classList.contains("hidden")) {
      loadButton.classList.add("hidden");
    }
  } else {
    for (const post of posts) {
      postsList.append(renderPost(post));
    }
  }
};

const setupPosts = async () => {
  try {
    const response = await fetchApi("/wp/v2/posts", `?page=${postsPage}&_embed`);
    const postCount = response?.parsedHeader?.["x-wp-totalpages"] ?? 0;

    renderPosts(response.data);
    articleLoader.classList.add("hidden");

    if (postCount > 1) {
      loadButton.classList.remove("hidden");
      loadButton.addEventListener("click", loadPosts);
    }
  } catch (error) {
    console.log(error);
    articleContainer.innerHTML = "";
    articleContainer.append(renderAlertDialog("alert", "Oops, content failed to load. Please try again later"));
  }
};

const categoryListener = (e) => {
  articleLoader.classList.remove("hidden");
  postsList.innerHTML = "";

  if (e.target.classList.contains("selected")) {
    e.target.classList.remove("selected");
    categoryId = null;
  } else {
    const selectedCategories = document.querySelectorAll(".category-item.selected");

    if (selectedCategories) {
      for (const selectedCategory of selectedCategories) {
        selectedCategory.classList.remove("selected");
      }
    }

    e.target.classList.add("selected");
    categoryId = e.target.getAttribute("data-category");
  }

  postsPage = 0;
  loadPosts();
};

const renderCategory = (category) => {
  const li = createHTML("li");
  const button = createHTML("button", ["category-item", "category-clickable"], category.name, {
    "data-category": category.id,
  });

  if (categoryId == category.id) {
    button.classList.add("selected");
  }

  button.addEventListener("click", categoryListener);
  li.append(button);
  return li;
};

const renderCategories = (categories) => {
  for (const category of categories) {
    if (category.name === "Uncategorized") {
      continue;
    } else {
      categoryList.append(renderCategory(category));
    }
  }
};

const setupCategories = async () => {
  try {
    const response = await fetchApi("/wp/v2/categories");

    if (response.data.length === 0) {
      categoryContainer.remove();
    } else {
      categoryContainer.querySelector(".loader").remove();
      renderCategories(response.data);
    }
  } catch (error) {
    console.log(error);
    categoryContainer.innerHTML = "";
  }
};

export const setupArticles = () => {
  setupCategories();
  setupPosts();
};
