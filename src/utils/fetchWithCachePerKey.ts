import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchWithCachePerKey = async (
  cachePrefix: string, 
  dynamicKey: string, 
  url: string,
  headers: any = {},
): Promise<any> => {
  const fullKey = `${cachePrefix}_${dynamicKey}`;

  try {
    const response = await fetch(url, {headers});
    const json = await response.json();

    await AsyncStorage.setItem(fullKey, JSON.stringify(json));

    return json;
  } catch (error) {
    const cached = await AsyncStorage.getItem(fullKey);
    if (cached) return JSON.parse(cached);
    throw error;
  }
};
