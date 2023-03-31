const baseUrl = "https://martekn.com/noroff/travella/wp-json";

/**
 * Fetches from the api based on arguments
 * @param {String | null} endpoint - Endpoint starting with /
 * @param {String | null} query - Query starting with ?
 * @param {Object | null} init - fetch RequestInit
 * @returns Object with data property for response body and parsedHeader property for headers
 */
export const fetchApi = async (endpoint, query, init) => {
  let url = baseUrl;
  let response;
  if (endpoint) {
    url += endpoint;
  }
  if (query) {
    url += query;
  }

  if (init) {
    response = await fetch(url, init);
  } else {
    response = await fetch(url);
  }

  const headers = Object.fromEntries(response.headers.entries());

  response.parsedHeader = headers;
  response.data = await response.json();

  return response;
};
