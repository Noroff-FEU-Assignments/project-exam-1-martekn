import { fetchApi } from "../util/api.js";
import { renderAlertDialog } from "../components/error.js";
import { appendArray, createHTML, decodeHTML, parseHTML } from "../util/htmlUtilities.js";

const heroSection = document.querySelector("#home-hero");

const carouselSection = document.querySelector(".carousel-container");
const carousel = carouselSection.querySelector("#carousel");
const carouselRightButton = carouselSection.querySelector("#carousel-right");
const carouselLeftButton = carouselSection.querySelector("#carousel-left");
const carouselDots = Array.from(carouselSection.querySelectorAll(".dots .dot"));

let carouselWidth = carousel.clientWidth;
let scrollX = 0;
let dotCount = 0;
let sliderIndex = 0;

// Hero
const renderHomeHero = (hero) => {
  const heroContent = parseHTML(hero.content.rendered);
  const content = heroContent.querySelector(".content");
  const btn = createHTML("a", ["btn", "btn--primary"], "Read more", { href: "./about.html" });
  const btnHidden = createHTML("span", "visually-hidden", "about travella");

  appendArray(heroContent.childNodes, heroSection);
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
carouselDots[sliderIndex].classList.add("active");

const renderCard = (post) => {
  const template = document.querySelector("#template_carousel-card");
  const card = template.content.cloneNode(true);
  const titleLink = card.querySelector("h3 a");
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
    dotCount = carouselDots.length;
  }
};

const updateCarousel = (e) => {
  carouselWidth = carousel.clientWidth;
  carouselDots[sliderIndex].classList.remove("active");

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
    carouselDots[sliderIndex].classList.add("active");
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

  carouselDots[sliderIndex].classList.add("active");
};

const setupCarousel = async () => {
  carousel.scrollLeft = scrollX;

  await renderCarousel();
  setDotCount();

  const cardWidth = carousel.querySelector("li").clientWidth;
  const cardsInView = Math.floor(carouselWidth / cardWidth);
  window.padding = (carouselWidth - cardWidth * cardsInView) / (cardsInView - 1);

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
        carouselDots[sliderIndex].classList.remove("active");
        sliderIndex = 0;
        carouselDots[sliderIndex].classList.add("active");
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
  const excerpt = decodeHTML(post.excerpt.rendered.replace("<p>", "").replace("</p>", ""));
  const featuredImage = post._embedded["wp:featuredmedia"][0];
  const image = featured.querySelector("img");

  title.innerText = decodeHTML(post.title.rendered);
  featured.querySelector(".btn").setAttribute("href", `./article.html?id=${post.id}`);
  featured.querySelector("p").innerText = excerpt;
  image.setAttribute("src", featuredImage.source_url);
  image.setAttribute("alt", featuredImage.alt_text);

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
  const excerpt = decodeHTML(post.excerpt.rendered.replace("<p>", "").replace("</p>", ""));

  titleLink.innerText = decodeHTML(post.title.rendered);
  titleLink.setAttribute("href", `./article.html?id=${post.id}`);
  card.querySelector("p").innerText = excerpt;

  if (index === 0) {
    const featuredImage = post._embedded["wp:featuredmedia"][0];

    const li = card.querySelector("li");
    li.classList.remove("flow-content");
    li.classList.add("flex", "flex--col");

    const imageContainer = createHTML("div", "image");
    const image = createHTML("img", null, null, { src: featuredImage.source_url, alt: featuredImage.alt_text });

    imageContainer.append(image);
    li.appendChild(imageContainer);
  }

  return card;
};

const renderPopularSection = async () => {
  const popularContainer = document.querySelector("#popular-container");

  try {
    const response = await fetchApi(
      "/wp_query/args/",
      "?meta_key=views&orderby=meta_value_num&post_type=post&posts_per_page=4&_embed"
    );

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
