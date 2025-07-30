// src/cache/cacheOnedhMasters.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

export const cacheJCMMasters = async (headers: Record<string, string>) => {
  try {
    const requests = [
      {
        key: 'cache_wo_gen',
        url: `${API_BASE_URL.onedh}/GetMasterWoGeneral/`,
        label: 'MASTER WOGEN',
      },
      {
        key: 'cache_supervisor',
        url: `${API_BASE_URL.onedh}/GetSupervisor/`,
        label: 'MASTER SUPERVISOR',
      },
      {
        key: 'cache_units',
        url: `${API_BASE_URL.onedh}/MasterUnit/`,
        label: 'MASTER UNIT',
      },
    ];

    for (const req of requests) {
      try {
        const resp = await axios.get(req.url, {headers});
        await AsyncStorage.setItem(
          req.key,
          JSON.stringify(resp.data?.data || []),
        );
        console.log(`✅ Berhasil cache ${req.label}`);
      } catch (e) {
        console.log(`❌ Gagal cache ${req.label}:`, e?.message || e);
      }
    }
  } catch (err) {
    console.log('❌ Error di cacheOnedhMasters:', err?.message || err);
  }
};
