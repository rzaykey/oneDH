import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import API_BASE_URL from '../config';

const TTL = 60 * 10 * 1000; // 1 jam
const unitTypes = [3, 2, 5, 4];

export const cacheAllMasterData = async () => {
  let result = {success: true, errors: []};
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    // const now = Date.now();
    // const lastCache = await AsyncStorage.getItem('cache_master_last');
    // if (lastCache && now - Number(lastCache) < TTL) return;

    // --- AMBIL SEKALI BEARER TOKEN ---
    let token = '';
    const loginCache = await AsyncStorage.getItem('loginCache');
    if (loginCache) {
      const parsed = JSON.parse(loginCache);
      token = parsed.token || '';
    }

    // ========== ALL MASTER CACHE ==========

    // --- Cache indikator mentoring
    await Promise.all(
      unitTypes.map(async type => {
        try {
          const res = await axios.get(
            `${API_BASE_URL.mop}/mentoring/createData?type_mentoring=${type}`,
            {headers: {Authorization: `Bearer ${token}`}},
          );
          const indicators = res.data?.data?.indicators || {};
          await AsyncStorage.setItem(
            `mentoring_indicators_${type}`,
            JSON.stringify(indicators),
          );
        } catch (err) {
          console.log('Error cache indikator type', type, err?.message || err);
        }
      }),
    );

    // --- Cache KPI
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

    // --- Cache Model & Unit Dropdown
    try {
      const modelResp = await axios.get(`${API_BASE_URL.mop}/getModelUnit`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const allModel = Array.isArray(modelResp.data)
        ? modelResp.data
        : modelResp.data.data || [];
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

    // --- Cache Activity
    try {
      const activityResp = await axios.get(
        `${API_BASE_URL.mop}/getActivity/all`,
        {headers: {Authorization: `Bearer ${token}`}},
      );
      const allActivity = activityResp.data?.data || [];
      await AsyncStorage.setItem(
        'cached_all_activity',
        JSON.stringify(allActivity),
      );
    } catch (err) {
      console.log('Gagal cache ACTIVITY:', err?.message || err);
    }

    // --- Cache lainnya
    // try {
    //   const listResp = await axios.get(`${API_BASE_URL.mop}/apiDayActAll`, {
    //     headers: {Authorization: `Bearer ${token}`},
    //   });
    //   const allDaily = Array.isArray(listResp.data)
    //     ? listResp.data
    //     : listResp.data.data || [];
    //   await AsyncStorage.setItem(
    //     'cached_daily_activity_list',
    //     JSON.stringify(allDaily),
    //   );
    // } catch (err) {
    //   console.log('Gagal cache DAILY LIST:', err?.message || err);
    // }

    try {
      const optResp = await axios.get(
        `${API_BASE_URL.mop}/getEmployeeOperatorAll`,
        {headers: {Authorization: `Bearer ${token}`}},
      );
      const allOpt = Array.isArray(optResp.data)
        ? optResp.data
        : optResp.data.data || [];
      await AsyncStorage.setItem('cached_opt_list', JSON.stringify(allOpt));
    } catch (err) {
      console.log('Gagal cache OPT LIST:', err?.message || err);
    }

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

    try {
      const unitResp = await axios.get(`${API_BASE_URL.mop}/getMasterUnit`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const allUnit = Array.isArray(unitResp.data)
        ? unitResp.data
        : unitResp.data.data || [];
      await AsyncStorage.setItem('cached_unit_list', JSON.stringify(allUnit));
    } catch (err) {
      console.log('Gagal cache UNIT LIST:', err?.message || err);
    }

    // --- MASTER P2H DARI API BARU YANG DITAMBAHKAN ---
    try {
      const resp = await axios.get(`${API_BASE_URL.p2h}/MasterQuestion`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      await AsyncStorage.setItem(
        'master_questions',
        JSON.stringify(resp.data?.data || resp.data || []),
      );
    } catch (e) {
      console.log('Gagal cache MASTER QUESTION:', e?.message || e);
    }

    try {
      const resp = await axios.get(`${API_BASE_URL.p2h}/GetSite`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      await AsyncStorage.setItem(
        'master_sites',
        JSON.stringify(resp.data?.data || resp.data || []),
      );
    } catch (e) {
      console.log('Gagal cache MASTER SITE:', e?.message || e);
    }

    try {
      const resp = await axios.get(`${API_BASE_URL.p2h}/GetDept`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      await AsyncStorage.setItem(
        'master_dept',
        JSON.stringify(resp.data?.data || resp.data || []),
      );
    } catch (e) {
      console.log('Gagal cache MASTER DEPT:', e?.message || e);
    }

    try {
      const resp = await axios.get(`${API_BASE_URL.p2h}/GetModel`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      await AsyncStorage.setItem(
        'master_model',
        JSON.stringify(resp.data?.data || resp.data || []),
      );
    } catch (e) {
      console.log('Gagal cache MASTER MODEL:', e?.message || e);
    }

    // await AsyncStorage.setItem('cache_master_last', String(now));
    console.log('✅ Master data cached (all)');
  } catch (err) {
    result.success = false;
    result.errors.push(err?.message || err);
    console.log('Error caching master data:', err?.message || err);
  }
};
