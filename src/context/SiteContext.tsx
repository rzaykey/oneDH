import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SiteContextType = {
  activeSite: string | null;
  setActiveSite: (site: string) => void;
  sites: string[];
  setSites: (sites: string[]) => void;
  roles: any[];
  setRoles: (roles: any[]) => void;
  user: any | null;
  setUser: (user: any) => void;
  refreshContext: () => Promise<void>;
};

const SiteContext = createContext<SiteContextType>({
  activeSite: null,
  setActiveSite: () => {},
  sites: [],
  setSites: () => {},
  roles: [],
  setRoles: () => {},
  user: null,
  setUser: () => {},
  refreshContext: async () => {},
});

export const useSiteContext = () => useContext(SiteContext);

export const SiteProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [activeSite, setActiveSiteState] = useState<string | null>(null);
  const [sites, setSites] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);

  // Fungsi untuk load ulang context dari AsyncStorage
  const refreshContext = useCallback(async () => {
    const data = await AsyncStorage.getItem('loginCache');
    if (data) {
      const session = JSON.parse(data);
      setUser(session.dataEmp || null);
      const _roles = session.role || session.roles || [];
      setRoles(_roles);
      const siteList = Array.isArray(_roles)
        ? [...new Set(_roles.map((r: any) => r.code_site))]
        : [];
      setSites(siteList);
      const site = await AsyncStorage.getItem('activeSite');
      if (site) setActiveSiteState(site);
      else if (siteList.length > 0) setActiveSiteState(siteList[0]);
    } else {
      setUser(null);
      setRoles([]);
      setSites([]);
      setActiveSiteState(null);
    }
  }, []);

  // Panggil sekali saja saat app pertama kali dibuka
  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const setActiveSite = (site: string) => {
    setActiveSiteState(site);
    AsyncStorage.setItem('activeSite', site);
  };

  return (
    <SiteContext.Provider
      value={{
        activeSite,
        setActiveSite,
        sites,
        setSites,
        roles,
        setRoles,
        user,
        setUser,
        refreshContext,
      }}>
      {children}
    </SiteContext.Provider>
  );
};
