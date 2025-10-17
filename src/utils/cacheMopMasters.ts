// src/cache/cacheMopMasters.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';
const unitTypes = [3, 2, 5, 4];

export const cacheMopMasters = async (headers: Record<string, string>) => {
  try {
    await Promise.all(
      unitTypes.map(async type => {
        try {
          const res = await axios.get(
            `${API_BASE_URL.onedh}/mentoring/createData?type_mentoring=${type}`,
            {headers},
          );
          await AsyncStorage.setItem(
            `mentoring_indicators_${type}`,
            JSON.stringify(res.data?.data?.indicators || {}),
          );
        } catch {}
      }),
    );

    try {
      const kpiResp = await axios.get(`${API_BASE_URL.onedh}/getKPI`, {headers});
      const kpiList = (kpiResp.data?.data || []).map(kpi => ({
        label: kpi.kpi,
        value: kpi.id,
      }));
      await AsyncStorage.setItem('dropdown_kpi', JSON.stringify(kpiList));
    } catch {}

    try {
      const modelResp = await axios.get(`${API_BASE_URL.onedh}/getModelUnit`, {
        headers,
      });
      const allModel = modelResp.data?.data || [];
      await AsyncStorage.setItem('cached_model_list', JSON.stringify(allModel));

      const unitList = allModel.map(u => ({
        label: u.model,
        value: String(u.id),
        modelOnly: u.id,
      }));
      await AsyncStorage.setItem('dropdown_unit', JSON.stringify(unitList));
    } catch {}

    try {
      const activityResp = await axios.get(
        `${API_BASE_URL.onedh}/getActivity/all`,
        {headers},
      );
      await AsyncStorage.setItem(
        'cached_all_activity',
        JSON.stringify(activityResp.data?.data || []),
      );
    } catch {}

    try {
      const siteResp = await axios.get(`${API_BASE_URL.onedh}/getSite`, {
        headers,
      });
      await AsyncStorage.setItem(
        'mentoring_master_site',
        JSON.stringify(siteResp.data?.data || []),
      );
    } catch {}

    try {
      const unitResp = await axios.get(`${API_BASE_URL.onedh}/getMasterUnit`, {
        headers,
      });
      const allUnit = unitResp.data?.data || [];
      await AsyncStorage.setItem('cached_unit_list', JSON.stringify(allUnit));
    } catch {}
  } catch {}
};
