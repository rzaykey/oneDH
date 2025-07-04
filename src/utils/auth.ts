import AsyncStorage from '@react-native-async-storage/async-storage';

// Simpan seluruh response login
export const saveSession = async (loginResponse: any) => {
  await AsyncStorage.setItem('loginCache', JSON.stringify(loginResponse));
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('loginCache');
};

export const getSession = async () => {
  const cache = await AsyncStorage.getItem('loginCache');
  return cache ? JSON.parse(cache) : null;
};
export const getAuthHeader = async () => {
  const session = await getSession();
  const token = session?.token; // atau sesuaikan dengan key token kamu
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};
