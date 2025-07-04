import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchWithCache = async (
  cacheKey: string,
  url: string,
  headers: any = {},
) => {
  try {
    const response = await fetch(url, {headers});
    const json = await response.json();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(json));
    return json;
  } catch (error) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw error;
  }
};

export const fetchWithCachePerKey = async (
  prefix: string,
  key: string,
  url: string,
  headers: any = {},
) => {
  const cacheKey = `${prefix}_${key}`;
  return fetchWithCache(cacheKey, url, headers);
};
