import { fetchApiResults } from "../util/api.js";
import { createHTML } from "../util/createHTML.js";

// Hero
const heroSection = document.querySelector("#home-hero");

const renderHomeHero = (hero) => {
  console.log(hero);
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

// Carousel functionality
const carouselRightButton = document.querySelector("#carousel-right");
const carouselLeftButton = document.querySelector("#carousel-left");
const ul = document.querySelector("#carousel");

let carouselWidth = ul.clientWidth;
const cardWidth = ul.querySelector("li").clientWidth;
const visibleCards = Math.floor(carouselWidth / cardWidth);
const padding = (carouselWidth - cardWidth * visibleCards) / (visibleCards - 1);
const dots = Array.from(document.querySelectorAll(".dots .dot"));

let scrollX = 0;
let dotCount = 0;
let sliderIndex = 0;

dots[sliderIndex].classList.add("active");

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
      scrollX = ul.scrollLeftMax + carouselWidth + padding;
    }

    scrollX -= carouselWidth + padding;
  } else if (e.target === carouselRightButton) {
    sliderIndex++;
    if (sliderIndex > dotCount - 1) {
      sliderIndex = 0;
    }

    if (scrollX >= ul.scrollLeftMax) {
      scrollX = 0 - carouselWidth - padding;
    }

    scrollX += carouselWidth + padding;
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

const setupCarouselFunctionality = () => {
  ul.scrollLeft = scrollX;
  setDotCount();
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

// Setup
export const setupIndex = () => {
  createHero();
  setupCarouselFunctionality();
};
