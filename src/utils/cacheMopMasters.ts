// src/cache/cacheMopMasters.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

const unitTypes = [3, 2, 5, 4];

export const cacheMopMasters = async (token: string) => {
  try {
    // Mentoring Indicators per unit type
    await Promise.all(
      unitTypes.map(async type => {
        try {
          const res = await axios.get(
            `${API_BASE_URL.mop}/mentoring/createData?type_mentoring=${type}`,
            {headers: {Authorization: `Bearer ${token}`}},
          );
          await AsyncStorage.setItem(
            `mentoring_indicators_${type}`,
            JSON.stringify(res.data?.data?.indicators || {}),
          );
        } catch (err) {
          console.log('Error cache indikator type', type, err?.message || err);
        }
      }),
    );

    // KPI
    try {
      const kpiResp = await axios.get(`${API_BASE_URL.mop}/getKPI`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const kpiList = (kpiResp.data?.data || []).map(kpi => ({
        label: kpi.kpi,
        value: kpi.id,
      }));
      await AsyncStorage.setItem('dropdown_kpi', JSON.stringify(kpiList));
    } catch (err) {
      console.log('Gagal cache KPI:', err?.message || err);
    }

    // Model & Unit
    try {
      const modelResp = await axios.get(`${API_BASE_URL.mop}/getModelUnit`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const allModel = modelResp.data?.data || [];
      await AsyncStorage.setItem('cached_model_list', JSON.stringify(allModel));
      const unitList = allModel.map(u => ({
        label: u.model,
        value: String(u.id),
        modelOnly: u.id,
      }));
      await AsyncStorage.setItem('dropdown_unit', JSON.stringify(unitList));
    } catch (err) {
      console.log('Gagal cache MODEL/UNIT:', err?.message || err);
    }

    // Activity
    try {
      const activityResp = await axios.get(
        `${API_BASE_URL.mop}/getActivity/all`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      await AsyncStorage.setItem(
        'cached_all_activity',
        JSON.stringify(activityResp.data?.data || []),
      );
    } catch (err) {
      console.log('Gagal cache ACTIVITY:', err?.message || err);
    }

    // Site
    try {
      const siteResp = await axios.get(`${API_BASE_URL.mop}/getSite`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      await AsyncStorage.setItem(
        'mentoring_master_site',
        JSON.stringify(siteResp.data?.data || []),
      );
    } catch (e) {
      console.log('Error caching master mentoring site:', e?.message || e);
    }

    // Unit List
    try {
      const unitResp = await axios.get(`${API_BASE_URL.mop}/getMasterUnit`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const allUnit = unitResp.data?.data || [];
      await AsyncStorage.setItem('cached_unit_list', JSON.stringify(allUnit));
    } catch (err) {
      console.log('Gagal cache UNIT LIST:', err?.message || err);
    }
  } catch (err) {
    console.log('Error cacheMopMasters:', err?.message || err);
  }
};
