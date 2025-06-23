import AsyncStorage from '@react-native-async-storage/async-storage';

export const getOfflineMentoringQueueCount = async () => {
  const key = 'mentoring_queue_offline';
  const data = await AsyncStorage.getItem(key);
  if (!data) return 0;
  try {
    const arr = JSON.parse(data);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
};
