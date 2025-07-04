import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchWithCachePerKey = async (
  cachePrefix: string, // e.g. "cache_wo"
  dynamicKey: string, // e.g. unit code "A01"
  url: string,
  headers: any = {},
): Promise<any> => {
  const fullKey = `${cachePrefix}_${dynamicKey}`;

  try {
    const response = await fetch(url, {headers});
    const json = await response.json();

    // Simpan cache dengan key unik per parameter
    await AsyncStorage.setItem(fullKey, JSON.stringify(json));

    return json;
  } catch (error) {
    console.warn(`[Cache fallback] Using ${fullKey}`);
    const cached = await AsyncStorage.getItem(fullKey);
    if (cached) return JSON.parse(cached);
    throw error;
  }
};
