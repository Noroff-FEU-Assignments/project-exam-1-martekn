import { fetchApiResults } from "../util/api.js";

const heroSection = document.querySelector("#about-hero");

const createHero = async () => {
  try {
    const heroRes = await fetchApiResults("/wp/v2/pages", "?slug=about");
    heroSection.innerHTML += heroRes[0].content.rendered;
    heroSection.querySelector(".loader").remove();
    console.log(heroRes[0]);
  } catch (error) {
    console.log(error);
  }
};

export const setupAbout = () => {
  createHero();
};
