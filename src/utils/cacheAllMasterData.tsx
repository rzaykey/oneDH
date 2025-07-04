import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {cacheOnedhMasters} from './cacheOnedhMasters';
import {cacheMopMasters} from './cacheMopMasters';

const TTL = 60 * 10 * 1000; // 10 menit

export const cacheAllMasterData = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const now = Date.now();
  const lastCache = await AsyncStorage.getItem('cache_master_last');
  if (lastCache && now - Number(lastCache) < TTL) return;

  try {
    const loginCache = await AsyncStorage.getItem('loginCache');
    const token = loginCache ? JSON.parse(loginCache).token || '' : '';

    await cacheOnedhMasters(token);
    // await cacheMopMasters(token);

    await AsyncStorage.setItem('cache_master_last', String(now));
    console.log('✅ Master data cached (all)');
  } catch (err) {
    console.log('❌ Gagal cache master:', err?.message || err);
  }
};
