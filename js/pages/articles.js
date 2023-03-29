import { fetchApi } from "../util/api.js";
import { createHTML } from "../util/htmlUtilities.js";
import { renderAlertDialog } from "../components/error.js";

const seeMoreButton = document.querySelector("#see-more");
const postsUl = document.querySelector("#posts");
const articlesLoader = document.querySelector("#posts-container .loader");
let postsPage = 1;
let categoryId;

const loadPosts = async () => {
  try {
    articlesLoader.classList.remove("hidden");
    let response = [];
    postsPage++;

    seeMoreButton.classList.add("hidden");

    if (categoryId) {
      response = await fetchApi("/wp/v2/posts", `?categories=${Number(categoryId)}&page=${postsPage}&_embed`);
    } else {
      response = await fetchApi("/wp/v2/posts", `?page=${postsPage}&_embed`);
    }

    renderPosts(response.data);

    articlesLoader.classList.add("hidden");

    const totalPostsPages = response.parsedHeader["x-wp-totalpages"];
    console.log(totalPostsPages);

    if (seeMoreButton.classList.contains("hidden") && postsPage < totalPostsPages) {
      seeMoreButton.classList.remove("hidden");
    }
  } catch (error) {
    console.log(error);
  }
};

const renderPost = (post) => {
  const template = document.querySelector("#template_large-card");
  const card = template.content.cloneNode(true);
  const titleLink = card.querySelector("h2 a");
  titleLink.innerHTML = post.title.rendered;
  titleLink.setAttribute("href", `./article.html?id=${post.id}`);
  const excerpt = post.excerpt.rendered.replace("/n", "").replace("<p>", "").replace("</p>", "");
  card.querySelector("p").innerHTML = excerpt;
  const image = card.querySelector("img");
  image.setAttribute("src", post._embedded["wp:featuredmedia"][0].source_url);
  image.setAttribute("alt", post._embedded["wp:featuredmedia"][0].alt_text);
  card.querySelector(".category-item").innerText = post._embedded["wp:term"][0][0].name;

  return card;
};

const renderPosts = async (posts) => {
  if (posts.length === 0) {
    let errorMessage = "There are no posts";
    postsUl.innerHTML = "";
    if (categoryId) {
      errorMessage = "There are no posts for this category";
    }
    postsUl.append(renderAlertDialog("alert", errorMessage));
    if (!seeMoreButton.classList.contains("hidden")) {
      seeMoreButton.classList.add("hidden");
    }
  } else {
    for (const post of posts) {
      postsUl.append(renderPost(post));
    }
  }
};

const setupPosts = async () => {
  try {
    const response = await fetchApi("/wp/v2/posts", `?page=${postsPage}&_embed`);

    const postCount = response?.parsedHeader?.["x-wp-totalpages"] ?? 0;

    renderPosts(response.data);
    articlesLoader.classList.add("hidden");
    if (postCount > 1) {
      seeMoreButton.classList.remove("hidden");
      seeMoreButton.addEventListener("click", loadPosts);
    }
  } catch (error) {
    console.log(error);
  }
};

const categoryListener = (e) => {
  articlesLoader.classList.remove("hidden");
  postsUl.innerHTML = ``;
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
      document.querySelector("#category").append(renderCategory(category));
    }
  }
};

const setupCategories = async () => {
  try {
    const response = await fetchApi("/wp/v2/categories");
    const container = document.querySelector("#category-container");
    if (response.data.length === 0) {
      container.remove();
    } else {
      container.querySelector(".loader").remove();
      renderCategories(response.data);
    }
  } catch (error) {
    console.log(error);
  }
};

export const setupArticles = () => {
  setupCategories();
  setupPosts();
};
