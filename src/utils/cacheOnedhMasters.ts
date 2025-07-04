// src/cache/cacheOnedhMasters.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

export const cacheOnedhMasters = async (token: string) => {
  try {
    const requests = [
      {
        key: 'master_questions',
        url: `${API_BASE_URL.onedh}/MasterQuestion`,
        label: 'MASTER QUESTION',
      },
      {
        key: 'master_sites',
        url: `${API_BASE_URL.onedh}/GetSite`,
        label: 'MASTER SITE',
      },
      {
        key: 'master_dept',
        url: `${API_BASE_URL.onedh}/GetDept`,
        label: 'MASTER DEPT',
      },
      {
        key: 'master_model',
        url: `${API_BASE_URL.onedh}/GetModel`,
        label: 'MASTER MODEL',
      },
    ];

    for (const req of requests) {
      try {
        const resp = await axios.get(req.url, {
          headers: {Authorization: `Bearer ${token}`},
        });
        await AsyncStorage.setItem(
          req.key,
          JSON.stringify(resp.data?.data || []),
        );
      } catch (e) {
        console.log(`Gagal cache ${req.label}:`, e?.message || e);
      }
    }
  } catch (err) {
    console.log('Error cacheOnedhMasters:', err?.message || err);
  }
};
