const baseUrl = "https://martekn.com/noroff/travella/wp-json";
const consumerKey = "";
const consumerSecret = "";

/**
 * Fetches the result from api
 * @param {String | null} [endpoint] - Endpoint starting with /
 * @param {String | null} [query] - Query starting with ?
 * @returns Result of the api call
 */
export const fetchApiResults = async (endpoint, query) => {
  let url = baseUrl;
  if (endpoint) {
    url += endpoint;
  }
  if (query) {
    url += `${query}&${consumerKey}&${consumerSecret}`;
  } else {
    url += `?${consumerKey}&${consumerSecret}`;
  }
  const req = await fetch(url);
  const headers = Object.fromEntries(req.headers.entries());
  const res = await req.json();

  res.resHeader = headers;

  return res;
};
