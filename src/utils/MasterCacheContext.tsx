import React, {createContext, useCallback, useState, ReactNode} from 'react';
import {cacheAllMasterData} from './cacheAllMasterData';

// Type untuk context value
type MasterCacheContextType = {
  forceUpdateMaster: () => Promise<void>;
  isCaching: boolean;
};

// Buat context dengan default (harus sama type-nya)
export const MasterCacheContext = createContext<MasterCacheContextType>({
  forceUpdateMaster: async () => {},
  isCaching: false,
});

type MasterCacheProviderProps = {
  children: ReactNode;
};

export const MasterCacheProvider: React.FC<MasterCacheProviderProps> = ({
  children,
}) => {
  const [isCaching, setIsCaching] = useState(false);

  const forceUpdateMaster = useCallback(async () => {
    setIsCaching(true);
    const result = await cacheAllMasterData();
    setIsCaching(false);
    return result;
  }, []);

  return (
    <MasterCacheContext.Provider value={{forceUpdateMaster, isCaching}}>
      {children}
    </MasterCacheContext.Provider>
  );
};
