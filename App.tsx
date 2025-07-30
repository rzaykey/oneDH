import React, {useEffect, useContext} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
} from '@tanstack/react-query';
import {persistQueryClient} from '@tanstack/react-query-persist-client';
import {createAsyncStoragePersister} from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {SiteProvider} from './src/context/SiteContext';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/components/toastConfig'; // ⬅️ import config toast custom

// Context providers
import {OfflineQueueProvider} from './src/utils/OfflineQueueContext';
import {
  MasterCacheProvider,
  MasterCacheContext,
} from './src/utils/MasterCacheContext';

// 1. Setup React Query Client & Persistence
const queryClient = new QueryClient();
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
});

// 2. Setup React Query Online/Offline Manager
onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(Boolean(state.isConnected));
  });
});

// 3. Wrapper agar forceUpdateMaster jalan otomatis saat app start
const AppInitWrapper = () => {
  const {forceUpdateMaster} = useContext(MasterCacheContext);

  useEffect(() => {
    forceUpdateMaster();
  }, []);

  return (
    <SiteProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
          <Toast config={toastConfig} />
        </NavigationContainer>
      </SafeAreaProvider>
    </SiteProvider>
  );
};

// 4. Main App
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineQueueProvider>
        <MasterCacheProvider>
          <AppInitWrapper />
        </MasterCacheProvider>
      </OfflineQueueProvider>
    </QueryClientProvider>
  );
};

export default App;
