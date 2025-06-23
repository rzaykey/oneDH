import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

export const getAndCacheMaster = async (key, url, token, dataPath = 'data') => {
  let master = null;
  const net = await NetInfo.fetch();

  if (net.isConnected) {
    try {
      const response = await axios.get(url, {
        headers: {Authorization: `Bearer ${token}`},
      });
      master = dataPath ? response.data?.[dataPath] : response.data;
      await AsyncStorage.setItem(key, JSON.stringify(master));
      return master;
    } catch (err) {
      // fallback ke cache
      const cache = await AsyncStorage.getItem(key);
      if (cache) master = JSON.parse(cache);
    }
  } else {
    const cache = await AsyncStorage.getItem(key);
    if (cache) master = JSON.parse(cache);
  }

  return master;
};
