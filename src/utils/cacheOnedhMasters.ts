// src/cache/cacheOnedhMasters.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

export const cacheOnedhMasters = async (headers: Record<string, string>) => {
  const requests = [
    {key: 'master_questions', url: `${API_BASE_URL.onedh}/MasterQuestion`},
    {key: 'master_sites', url: `${API_BASE_URL.onedh}/GetSite`},
    {key: 'master_dept', url: `${API_BASE_URL.onedh}/GetDept`},
    {key: 'master_model', url: `${API_BASE_URL.onedh}/GetModel`},
    {key: 'master_category', url: `${API_BASE_URL.onedh}/GetCategory`},
  ];

  await Promise.allSettled(
    requests.map(async req => {
      const resp = await axios.get(req.url, {headers});
      await AsyncStorage.setItem(
        req.key,
        JSON.stringify(resp.data?.data || []),
      );
    }),
  );
};
