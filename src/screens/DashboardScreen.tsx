import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {dashboardStyles as styles} from '../styles/dashboardStyles';
import {useSiteContext} from '../context/SiteContext';
import LinearGradient from 'react-native-linear-gradient';
import {cacheAllMasterData} from '../utils/cacheAllMasterData'; // path ke fungsi kamu
import {
  pushOfflineQueue,
  getOfflineQueueCount,
} from '../utils/offlineQueueHelper';
import API_BASE_URL from '../config';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import {useFocusEffect} from '@react-navigation/native';

const OFFLINE_SUBMIT_KEY = 'offline_submit_p2h';
const PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.onedh';
const API_URL = `${API_BASE_URL.onedh}/CekVersion`;

const getAuthHeader = async () => {
  const cache = await AsyncStorage.getItem('loginCache');
  const token = cache && JSON.parse(cache)?.token;
  if (!token) throw new Error('Token tidak ditemukan!');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const carouselData = [
  {id: '1', text: 'Sed viverra nibh eget tincidunt convallis...'},
  {
    id: '2',
    text: 'Pengumuman: Maintenance server 25 Juni 2025 pukul 02:00 - 04:00 WIB.',
  },
  {id: '3', text: 'Promo! Update aplikasi untuk fitur terbaru OTPD.'},
];

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const carouselRef = useRef<FlatList<any>>(null);
  const insets = useSafeAreaInsets();
  const [refreshingMaster, setRefreshingMaster] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    cacheAllMasterData(); // tidak perlu await
  }, []);

  const isOutdated = (latest, current) => {
    const a = latest.split('.').map(Number);
    const b = current.split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0) > (b[i] || 0)) return true;
      if ((a[i] || 0) < (b[i] || 0)) return false;
    }
    return false;
  };

  // Ambil semua dari context!
  const {activeSite, setActiveSite, sites, user, setSites, setRoles, setUser} =
    useSiteContext();

  const refreshQueueCount = useCallback(async () => {
    const count = await getOfflineQueueCount(OFFLINE_SUBMIT_KEY);
    setQueueCount(count);
  }, []);

  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        setSyncing(true);

        Promise.all([
          pushOfflineQueue(
            OFFLINE_SUBMIT_KEY,
            '/StoreP2H',
            undefined,
            API_BASE_URL.onedh,
          ),
          pushOfflineQueue(
            OFFLINE_SUBMIT_KEY,
            '/StoreJCM',
            (current: number, total: number) => {
              console.log(`Sync JCM progress: ${current} / ${total}`);
            },
            API_BASE_URL.onedh,
          ),
        ])
          .then(refreshQueueCount)
          .finally(() => setSyncing(false));
      }
    });

    // Jalankan juga sekali saat mount
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        setSyncing(true);

        Promise.all([
          pushOfflineQueue(
            OFFLINE_SUBMIT_KEY,
            '/StoreP2H',
            undefined,
            API_BASE_URL.onedh,
          ),
          pushOfflineQueue(
            OFFLINE_SUBMIT_KEY,
            '/StoreJCM',
            (current: number, total: number) => {
              console.log(`Initial Sync JCM: ${current}/${total}`);
            },
            API_BASE_URL.onedh,
          ),
        ])
          .then(refreshQueueCount)
          .finally(() => setSyncing(false));
      }
    });

    return () => unsubscribe();
  }, []);

  // Carousel auto scroll
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1 >= carouselData.length ? 0 : prev + 1;
        carouselRef.current?.scrollToIndex({index: next, animated: true});
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Ganti site, ambil site list dari AsyncStorage (fresh)
  const handleGantiSite = async () => {
    try {
      const data = await AsyncStorage.getItem('loginCache');
      if (data) {
        const session = JSON.parse(data);
        const siteList = [
          ...new Set(
            (session.role || session.roles || []).map((r: any) => r.code_site),
          ),
        ];
        Toast.show({
          type: 'success',
          text1: 'Ganti Site',
          text2: 'Silakan pilih lokasi baru.',
          position: 'top',
          visibilityTime: 2000,
          topOffset: 50,
        });
        navigation.replace('SitePicker', {sites: siteList});
      } else {
        Toast.show({
          type: 'error',
          text1: 'Data Tidak Ditemukan',
          text2: 'Data login tidak tersedia. Silakan login ulang.',
          position: 'top',
          visibilityTime: 2500,
          topOffset: 50,
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: 'Gagal mengambil data site. Coba lagi nanti.',
        position: 'top',
        visibilityTime: 2500,
        topOffset: 50,
      });
    }
  };

  const handleRefreshMaster = async () => {
    setRefreshingMaster(true);
    try {
      await cacheAllMasterData();

      // ✅ Toast sukses
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Master data berhasil diperbarui.',
        position: 'top',
        visibilityTime: 2000,
        topOffset: 50,
      });
    } catch (err) {
      // ❌ Toast gagal
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: 'Gagal refresh master data. Cek koneksi internet.',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
    } finally {
      setRefreshingMaster(false);
    }
  };

  // Logout, reset semua context state juga
  const handleLogout = async () => {
    await AsyncStorage.removeItem('loginCache');
    await AsyncStorage.removeItem('activeSite');
    await AsyncStorage.multiRemove([
      'loginCache',
      'activeSite',
      'token',
      'userData',
    ]);
    setActiveSite(null);
    setRoles([]);
    setSites([]);
    setUser(null);

    // ✅ Tampilkan notifikasi logout
    Toast.show({
      type: 'success',
      text1: 'Berhasil Logout',
      text2: 'Sampai jumpa lagi!',
      position: 'top',
      visibilityTime: 2000,
      topOffset: 50,
    });

    navigation.replace('Login');
  };
  4100;

  // Site chip (highlight active, bisa tap)

  const handleSiteSelect = (site: string) => {
    setActiveSite(site);
    Toast.show({
      type: 'success',
      text1: 'Site Dipilih',
      text2: `Kamu memilih site: ${site}`,
    });
  };

  const checkVersion = async () => {
    try {
      const currentVersion = DeviceInfo.getVersion().trim();
      setAppVersion(currentVersion);

      const headers = await getAuthHeader();
      const response = await fetch(API_URL, {
        method: 'GET',
        headers,
      });

      // 🔐 Cek jika sesi berakhir
      if (response.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Sesi Berakhir',
          text2: 'Silakan login kembali.',
          position: 'top',
          topOffset: 50,
        });

        setTimeout(() => {
          handleLogout(); // ⬅️ Fungsi logout
        }, 1500);

        return; // Hentikan proses
      }

      // ❗ Tangkap error HTTP lainnya
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ✅ Lanjut proses jika aman
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error('Format respon bukan JSON.');
      }

      const latestVersion = data?.version?.trim();
      if (
        !data?.status ||
        !latestVersion ||
        !/^\d+\.\d+\.\d+$/.test(latestVersion)
      ) {
        const msg = data?.notif || data?.message || 'Data versi tidak valid.';
        throw new Error(msg);
      }

      console.log('Current Version:', currentVersion);
      console.log('Latest Version from API:', latestVersion);

      if (isOutdated(latestVersion, currentVersion)) {
        Toast.show({
          type: 'error',
          text1: 'Versi Lama',
          text2: `Aplikasi perlu diperbarui ke versi ${latestVersion}.`,
          autoHide: false,
          position: 'top',
          topOffset: 50,
          onPress: () => Linking.openURL(PLAYSTORE_URL),
        });

        setTimeout(() => {
          handleLogout();
          Linking.openURL(PLAYSTORE_URL);
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err?.message?.toString?.() || 'Terjadi kesalahan tidak diketahui.';

      console.warn('❗ Gagal cek versi:', errorMessage);

      Toast.show({
        type: 'error',
        text1: 'Gagal Cek Versi',
        text2: errorMessage,
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkVersion();
    }, []),
  );

  const SiteChip: React.FC<{
    site: string;
    activeSite: string;
    onPress: (site: string) => void;
  }> = ({site, activeSite, onPress}) => (
    <TouchableOpacity
      onPress={() => onPress(site)}
      style={[styles.siteChip, activeSite === site && styles.siteChipActive]}>
      <Text
        style={[
          styles.siteChipText,
          activeSite === site && styles.siteChipTextActive,
        ]}>
        {site}
      </Text>
      {activeSite === site && (
        <Icon
          name="checkmark-circle"
          size={15}
          color="#3498db"
          style={{marginLeft: 3}}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          {/* HEADER */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 14,
            }}>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.title,
                  {fontSize: 24, fontWeight: 'bold', color: '#183153'},
                ]}>
                Dashboard
              </Text>
            </View>
            <TouchableOpacity
              style={{padding: 8}}
              onPress={() => setDropdownVisible(true)}>
              <Icon name="ellipsis-vertical" size={28} color="#2463EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Icon name="person-circle" size={56} color="#2463EB" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
              {/* Info Baris 1: JDE No */}
              {user?.jdeno ? (
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileId}>JDE No: {user.jdeno}</Text>
                </View>
              ) : null}
              {/* Info Baris 2: Dept & Posisi */}
              <View style={styles.profileInfoRow}>
                {user?.dept && (
                  <Text style={styles.profileDept}>{user.dept}</Text>
                )}
              </View>
              <View style={styles.profileInfoRow}>
                {user?.position && (
                  <Text style={styles.profilePosition}>{user.position}</Text>
                )}
              </View>
              {/* Site */}
              <View style={styles.siteListRow}>
                <Text style={styles.siteListLabel}>Site:</Text>
                {sites.length > 0 ? (
                  <FlatList
                    data={sites}
                    keyExtractor={s => s}
                    renderItem={({item}) => (
                      <SiteChip
                        site={item}
                        activeSite={activeSite}
                        onPress={handleSiteSelect}
                      />
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{alignItems: 'center'}}
                  />
                ) : (
                  <Text
                    style={{color: 'red', fontSize: 13, fontWeight: 'bold'}}>
                    Tidak ada site yang bisa dipilih.
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.notifCard}>
            <Icon
              name="notifications"
              size={20}
              color="#ff9800"
              style={{marginRight: 8}}
            />
            <Text style={styles.notifText}>Notification</Text>
          </View>

          {/* <TouchableOpacity
            style={{
              padding: 8,
              backgroundColor: '#22223b',
              borderRadius: 8,
              alignSelf: 'flex-end',
              margin: 8,
            }}
            onPress={() => navigation.navigate('MasterCacheScreen')}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>
              🔎 Lihat Cache Master
            </Text>
          </TouchableOpacity> */}
          {/* Dropdown Modal */}
          <Modal
            visible={dropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => {
                if (!refreshingMaster) setDropdownVisible(false);
              }}
              disabled={refreshingMaster} // ini juga bisa
            >
              <View style={styles.dropdownMenu}>
                {refreshingMaster ? (
                  <View style={{alignItems: 'center', padding: 16}}>
                    <ActivityIndicator size="large" color="#2463EB" />
                    <Text style={{marginTop: 12}}>Memuat master data...</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={async () => {
                        // Modal tetap dibuka saat loading
                        await handleRefreshMaster();
                        setDropdownVisible(false); // Tutup setelah loading selesai
                      }}>
                      <Icon name="refresh-outline" size={20} color="#2463EB" />
                      <Text style={styles.dropdownText}>
                        Refresh Master Data
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setDropdownVisible(false);
                        handleGantiSite();
                      }}>
                      <Icon
                        name="swap-horizontal-outline"
                        size={20}
                        color="#2463EB"
                      />
                      <Text style={styles.dropdownText}>Ganti Site</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setDropdownVisible(false);
                        handleLogout();
                      }}>
                      <Icon name="log-out-outline" size={20} color="#e74c3c" />
                      <Text style={styles.dropdownText}>Logout</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Pressable>
          </Modal>
          {/* CAROUSEL */}
          {/* <View style={styles.carouselContainer}>
            <FlatList
              ref={carouselRef}
              data={carouselData}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={({item}) => (
                <View
                  style={[
                    styles.carouselCard,
                    {
                      width: windowWidth * 0.8,
                      marginHorizontal: (windowWidth * 0.1) / 2,
                    },
                  ]}>
                  <Text
                    style={styles.carouselText}
                    numberOfLines={4}
                    ellipsizeMode="tail">
                    {item.text}
                  </Text>
                </View>
              )}
              onMomentumScrollEnd={ev => {
                const idx = Math.round(
                  ev.nativeEvent.contentOffset.x / (windowWidth * 0.8),
                );
                setCurrentIndex(idx);
              }}
              contentContainerStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: (windowWidth * 0.1) / 2,
              }}
              snapToInterval={windowWidth * 0.8}
              decelerationRate="fast"
              extraData={windowWidth}
            />
            <View style={styles.dotsContainer}>
              {carouselData.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentIndex ? styles.dotActive : undefined,
                  ]}
                />
              ))}
            </View>
          </View> */}
          {/* --- Tambah menu dashboard lain di sini --- */}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default DashboardScreen;
