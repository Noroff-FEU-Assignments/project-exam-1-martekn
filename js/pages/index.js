import { fetchApi } from "../util/api.js";
import { renderAlertDialog } from "../components/error.js";
import { createHTML } from "../util/htmlUtilities.js";

// Hero
const heroSection = document.querySelector("#home-hero");

const renderHomeHero = (hero) => {
  heroSection.innerHTML += hero.content.rendered;
  const content = heroSection.querySelector(".content");
  const btn = createHTML("a", ["btn", "btn--primary"], "Read more", { href: "./about.html" });
  const btnHidden = createHTML("span", "visually-hidden", "about travella");
  btn.appendChild(btnHidden);
  content.appendChild(btn);
};

const createHero = async () => {
  try {
    const response = await fetchApi("/wp/v2/pages", "?slug=home");
    renderHomeHero(response.data[0]);
    heroSection.querySelector(".loader").remove();
  } catch (error) {
    console.log(error);
    heroSection.innerHTML = "";
    heroSection.append(renderAlertDialog("alert", "Oops, content failed to load. Please try again later"));
  }
};

// Carousel
const carousel = document.querySelector("#carousel");
const carouselRightButton = document.querySelector("#carousel-right");
const carouselLeftButton = document.querySelector("#carousel-left");
const carouselSection = document.querySelector(".carousel-container");

let carouselWidth = carousel.clientWidth;
const dots = Array.from(document.querySelectorAll(".dots .dot"));

let scrollX = 0;
let dotCount = 0;
let sliderIndex = 0;

dots[sliderIndex].classList.add("active");

const renderCard = (post) => {
  const template = document.querySelector("#template_carousel-card");
  const card = template.content.cloneNode(true);
  const titleLink = card.querySelector("h3 a");
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

const renderCarousel = async () => {
  try {
    const response = await fetchApi("/wp/v2/posts", "?per_page=12&_embed");
    for (const post of response.data) {
      const li = renderCard(post);
      carousel.appendChild(li);
    }
    carouselSection.querySelector(".loader").remove();
  } catch (error) {
    console.log(error);
    carouselSection.innerHTML = "";
    carouselSection.append(renderAlertDialog("alert", "Oops, latest posts failed to load. Please try again later"));
  }
};

const setDotCount = () => {
  if (!window.matchMedia("(max-width: 70em)").matches) {
    dotCount = 3;
  } else if (!window.matchMedia("(max-width: 55em)").matches) {
    dotCount = 4;
  } else {
    dotCount = dots.length;
  }
};

const updateCarousel = (e) => {
  carouselWidth = carousel.clientWidth;
  dots[sliderIndex].classList.remove("active");

  if (e.target === carouselLeftButton) {
    sliderIndex--;
    if (sliderIndex < 0) {
      sliderIndex = dotCount - 1;
    }

    if (scrollX <= 0) {
      scrollX = carousel.scrollWidth + window.padding;
    }

    scrollX -= carouselWidth + window.padding;
  } else if (e.target === carouselRightButton) {
    sliderIndex++;
    if (sliderIndex > dotCount - 1) {
      sliderIndex = 0;
    }

    if (scrollX >= carousel.scrollWidth - carouselWidth) {
      scrollX = 0 - carouselWidth - window.padding;
    }

    scrollX += carouselWidth + window.padding;
  } else {
    dots[sliderIndex].classList.add("active");
    return;
  }

  e.target.disabled = true;
  setTimeout(() => {
    e.target.disabled = false;
  }, 150);

  carousel.scroll({
    left: scrollX,
    top: 0,
    behavior: "smooth",
  });

  dots[sliderIndex].classList.add("active");
};

const setupCarousel = async () => {
  carousel.scrollLeft = scrollX;

  await renderCarousel();
  setDotCount();

  const cardWidth = carousel.querySelector("li").clientWidth;
  const visibleCards = Math.floor(carouselWidth / cardWidth);
  window.padding = (carouselWidth - cardWidth * visibleCards) / (visibleCards - 1);

  carouselLeftButton.addEventListener("click", updateCarousel);
  carouselRightButton.addEventListener("click", updateCarousel);

  let timeout;
  const resizeObserver = new ResizeObserver((entries) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = 0;
    }

    timeout = setTimeout(() => {
      let width = entries[0].contentRect.width;

      if (width !== carouselWidth) {
        setDotCount();
        dots[sliderIndex].classList.remove("active");
        sliderIndex = 0;
        dots[sliderIndex].classList.add("active");
        scrollX = 0;

        carousel.scroll({
          left: scrollX,
          top: 0,
          behavior: "smooth",
        });
      }
    }, 500);
  });

  resizeObserver.observe(carousel);
};

// Featured
const renderFeaturedHtml = (post) => {
  const template = document.querySelector("#template_featured");
  const featured = template.content.cloneNode(true);
  const title = featured.querySelector("h2");
  title.innerHTML = post.title.rendered;
  featured.querySelector(".btn").setAttribute("href", `./article.html?id=${post.id}`);
  const excerpt = post.excerpt.rendered.replace("/n", "").replace("<p>", "").replace("</p>", "");
  featured.querySelector("p").innerHTML = excerpt;

  const imageUrl = post._embedded["wp:featuredmedia"][0].source_url;
  const imageAlt = post._embedded["wp:featuredmedia"][0].alt_text;
  const image = featured.querySelector("img");
  image.setAttribute("src", imageUrl);
  image.setAttribute("alt", imageAlt);

  return featured;
};

const renderFeatured = async () => {
  const featuredContainer = document.querySelector("#featured-section");

  try {
    const response = await fetchApi("/wp/v2/posts", "?tags=5&_embed");
    featuredContainer.querySelector(".loader").remove();
    featuredContainer.appendChild(renderFeaturedHtml(response.data[0]));
  } catch (error) {
    console.log(error);
    featuredContainer.innerHTML = "";
    featuredContainer.append(
      renderAlertDialog("alert", "Oops, featured content failed to load. Please try again later")
    );
  }
};

// Popular
const renderPopularCard = (index, post) => {
  const template = document.querySelector("#template_popular-card");
  const card = template.content.cloneNode(true);
  const titleLink = card.querySelector("h3 a");
  titleLink.innerHTML = post.title.rendered;
  titleLink.setAttribute("href", `./article.html?id=${post.id}`);
  const excerpt = post.excerpt.rendered.replace("/n", "").replace("<p>", "").replace("</p>", "");
  card.querySelector("p").innerHTML = excerpt;

  if (index === 0) {
    const li = card.querySelector("li");
    li.classList.remove("flow-content");
    li.classList.add("flex", "flex--col");
    const imageUrl = post._embedded["wp:featuredmedia"][0].source_url;
    const imageAlt = post._embedded["wp:featuredmedia"][0].alt_text;
    const imageContainer = createHTML("div", "image");
    const image = createHTML("img", null, null, { src: imageUrl, alt: imageAlt });
    imageContainer.append(image);
    li.appendChild(imageContainer);
  }

  return card;
};

const renderPopularSection = async () => {
  const popularContainer = document.querySelector("#popular-container");

  try {
    const response = await fetchApi("/wordpress-popular-posts/v1/popular-posts", "?limit=4&range=all&_embed");
    document.querySelector(".popular-posts .loader").remove();
    for (const [index, post] of response.data.entries()) {
      popularContainer.appendChild(renderPopularCard(index, post));
    }
  } catch (error) {
    console.log(error);
    const popularSection = document.querySelector("#popular-posts");
    popularSection.innerHTML = "";
    popularSection.append(renderAlertDialog("alert", "Oops, popular posts failed to load. Please try again later"));
  }
};

// Setup
export const setupIndex = () => {
  createHero();
  setupCarousel();
  renderFeatured();
  renderPopularSection();
};
