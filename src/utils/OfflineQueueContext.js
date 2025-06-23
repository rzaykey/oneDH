import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  pushOfflineQueue,
  getOfflineQueueCount,
  clearOfflineQueue,
} from './offlineQueueHelper';

export const OfflineQueueContext = createContext();

export const OfflineQueueProvider = ({children}) => {
  const mentoringKey = 'mentoring_queue_offline';
  const dailyKey = 'daily_queue_offline';
  const trainHoursKey = 'trainhours_queue_offline';

  const [mentoringQueueCount, setMentoringQueueCount] = useState(0);
  const [trainHoursQueueCount, setTrainHoursQueueCount] = useState(0);
  const [dailyQueueCount, setDailyQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshQueueCount = useCallback(async () => {
    setMentoringQueueCount(await getOfflineQueueCount(mentoringKey));
    setDailyQueueCount(await getOfflineQueueCount(dailyKey));
    setTrainHoursQueueCount(await getOfflineQueueCount(trainHoursKey));
  }, []);

  const pushMentoringQueue = useCallback(async () => {
    setSyncing(true);
    await pushOfflineQueue(mentoringKey, '/mentoring/store');
    await refreshQueueCount(); // <-- Tambahkan await di sini!
    setSyncing(false);
  }, [refreshQueueCount]);

  const pushDailyQueue = useCallback(async () => {
    setSyncing(true);
    await pushOfflineQueue(dailyKey, '/dayActivities');
    await refreshQueueCount(); // <-- Tambahkan await di sini!
    setSyncing(false);
  }, [refreshQueueCount]);

  const pushTrainHoursQueue = useCallback(async () => {
    setSyncing(true);
    await pushOfflineQueue(trainHoursKey, '/trainHours/store');
    await refreshQueueCount(); // <-- Tambahkan await di sini!
    setSyncing(false);
  }, [refreshQueueCount]);
  

  // AUTO-PUSH saat online
  const lastIsConnected = useRef(true);
  useEffect(() => {
    refreshQueueCount();
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (lastIsConnected.current === false && state.isConnected === true) {
        await pushMentoringQueue();
        await pushDailyQueue();
        await pushTrainHoursQueue();
      }
      lastIsConnected.current = state.isConnected;
    });
    return () => unsubscribe();
  }, [
    pushMentoringQueue,
    pushDailyQueue,
    pushTrainHoursQueue,
    refreshQueueCount,
  ]);

  // Refresh count secara periodik (boleh dihapus jika ingin)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshQueueCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshQueueCount]);

  return (
    <OfflineQueueContext.Provider
      value={{
        mentoringQueueCount,
        dailyQueueCount,
        trainHoursQueueCount,
        syncing,
        refreshQueueCount,
        pushMentoringQueue,
        pushDailyQueue,
        pushTrainHoursQueue,
        clearOfflineQueue,
      }}>
      {children}
    </OfflineQueueContext.Provider>
  );
};
