import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Ambil dari cache, kalau kosong fetch ke server
export const getMasterData = async (key, apiEndpoint) => {
  const cache = await AsyncStorage.getItem(key);
  if (cache) return JSON.parse(cache);
  const {data} = await axios.get(apiEndpoint);
  await AsyncStorage.setItem(key, JSON.stringify(data));
  return data;
};

// Paksa refresh master data dari server
export const refreshMasterData = async (key, apiEndpoint) => {
  const {data} = await axios.get(apiEndpoint);
  await AsyncStorage.setItem(key, JSON.stringify(data));
  return data;
};
