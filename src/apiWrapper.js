import API_BASE_URLS from './config';

const SELECTED_BASE_URL = {};

export async function initBaseUrls() {
  for (const key of Object.keys(API_BASE_URLS)) {
    const urls = API_BASE_URLS[key];
    for (const url of urls) {
      try {
        const res = await fetch(`${url}/ping`, {method: 'GET'});
        if (res.ok) {
          SELECTED_BASE_URL[key] = url;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    if (!SELECTED_BASE_URL[key]) {
      SELECTED_BASE_URL[key] = urls[0]; // fallback to first anyway
    }
  }
}

export const API_BASE_URL = SELECTED_BASE_URL;
