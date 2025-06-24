import AsyncStorage from '@react-native-async-storage/async-storage';

export const cacheKeys = [
  // Mentoring
  'mentoring_indicators_3',
  'mentoring_indicators_2',
  'mentoring_indicators_5',
  'mentoring_indicators_4',
  // Dropdown, Master
  'dropdown_kpi',
  'cached_model_list',
  'dropdown_unit',
  'cached_all_activity',
  'cached_opt_list',
  'mentoring_master_site',
  'cached_unit_list',
  // P2H
  'master_questions',
  'master_sites',
  'master_dept',
  'master_model',
  // User login cache
  'loginCache',
];

export const getAllMasterCache = async () => {
  const result = {};
  for (const key of cacheKeys) {
    try {
      const value = await AsyncStorage.getItem(key);
      result[key] = value ? JSON.parse(value) : null;
    } catch (e) {
      result[key] = {error: e.message};
    }
  }
  return result;
};
