import { fetchApiResults } from "../util/api.js";
import { createHTML } from "../util/createHTML.js";

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
    const heroRes = await fetchApiResults("/wp/v2/pages", "?slug=home");
    renderHomeHero(heroRes[0]);
    heroSection.querySelector(".loader").remove();
  } catch (error) {
    console.log(error);
  }
};

// Carousel
const ul = document.querySelector("#carousel");
const carouselRightButton = document.querySelector("#carousel-right");
const carouselLeftButton = document.querySelector("#carousel-left");

let carouselWidth = ul.clientWidth;
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
    const carouselPosts = await fetchApiResults("/wp/v2/posts", "?per_page=12&_embed");
    for (const post of carouselPosts) {
      const li = renderCard(post);
      ul.appendChild(li);
    }
  } catch (error) {
    console.log(error);
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
  carouselWidth = ul.clientWidth;
  dots[sliderIndex].classList.remove("active");

  if (e.target === carouselLeftButton) {
    sliderIndex--;
    if (sliderIndex < 0) {
      sliderIndex = dotCount - 1;
    }

    if (scrollX <= 0) {
      scrollX = ul.scrollWidth + window.padding;
    }

    scrollX -= carouselWidth + window.padding;
  } else if (e.target === carouselRightButton) {
    sliderIndex++;
    if (sliderIndex > dotCount - 1) {
      sliderIndex = 0;
    }

    if (scrollX >= ul.scrollWidth - carouselWidth) {
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

  ul.scroll({
    left: scrollX,
    top: 0,
    behavior: "smooth",
  });

  dots[sliderIndex].classList.add("active");
};

const setupCarousel = async () => {
  ul.scrollLeft = scrollX;

  await renderCarousel();
  setDotCount();

  const cardWidth = ul.querySelector("li").clientWidth;
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

        ul.scroll({
          left: scrollX,
          top: 0,
          behavior: "smooth",
        });
      }
    }, 500);
  });

  resizeObserver.observe(ul);
};

// Featured

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
  try {
    const popularContainer = document.querySelector("#popular-container");
    popularContainer.querySelector(".loader").remove();
    const popularPosts = await fetchApiResults("/wordpress-popular-posts/v1/popular-posts", "?limit=4&_embed");
    for (const [index, post] of popularPosts.entries()) {
      popularContainer.appendChild(renderPopularCard(index, post));
    }
  } catch (error) {
    console.log(error);
  }
};

// Setup
export const setupIndex = () => {
  createHero();
  setupCarousel();
  renderPopularSection();
};
