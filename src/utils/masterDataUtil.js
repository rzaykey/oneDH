import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const getMasterData = async (key, apiEndpoint) => {
  const cache = await AsyncStorage.getItem(key);
  if (cache) return JSON.parse(cache);
  const {data} = await axios.get(apiEndpoint);
  await AsyncStorage.setItem(key, JSON.stringify(data));
  return data;
};

export const refreshMasterData = async (key, apiEndpoint) => {
  const {data} = await axios.get(apiEndpoint);
  await AsyncStorage.setItem(key, JSON.stringify(data));
  return data;
};
