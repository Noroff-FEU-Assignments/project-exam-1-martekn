import { renderAlertDialog } from "../components/error.js";
import { fetchApi } from "../util/api.js";
import { parseHTML, appendArray } from "../util/htmlUtilities.js";

const heroSection = document.querySelector("#about-hero");

const createHero = async () => {
  try {
    const response = await fetchApi("/wp/v2/pages", "?slug=about");
    const content = parseHTML(response.data[0].content.rendered);

    appendArray(content.childNodes, heroSection);
    heroSection.querySelector(".loader").remove();
  } catch (error) {
    console.log(error);
    heroSection.innerHTML = "";
    heroSection.append(renderAlertDialog("alert", "Oops, content failed to load. Please try again later"));
  }
};

export const setupAbout = () => {
  createHero();
};
