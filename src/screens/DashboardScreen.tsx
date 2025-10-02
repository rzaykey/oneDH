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
import {AbsensiToday} from '../navigation/types';
import dayjs from 'dayjs';
import moment from 'moment';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import {Buffer} from 'buffer';

const OFFLINE_SUBMIT_KEY = 'offline_submit_p2h';
const PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.onedh';
const API_URL = `${API_BASE_URL.onedh}/CekVersion`;

type PdfItem = {
  id: number;
  day: number;
  month: number;
  year: number;
  file_name: string;
};

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
  const [absensiToday, setAbsensiToday] = useState<AbsensiToday | null>(null);
  const [loadingAbsensi, setLoadingAbsensi] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);

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

  //Version
  const checkVersion = async () => {
    try {
      const currentVersion = DeviceInfo.getVersion().trim();
      setAppVersion(currentVersion);

      const headers = await getAuthHeader();
      const response = await fetch(API_URL, {
        method: 'GET',
        headers,
      });

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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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

  const fetchAbsensiToday = useCallback(async () => {
    setLoadingAbsensi(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // Timeout 10 detik

    try {
      const cache = await AsyncStorage.getItem('loginCache');
      const parsedCache = cache ? JSON.parse(cache) : null;
      const token = parsedCache?.token;
      const username = parsedCache?.dataEmp?.jdeno;

      if (!token || !username) {
        Toast.show({
          type: 'info',
          text1: 'Session tidak lengkap',
          text2: 'Silakan login ulang.',
        });
        setAbsensiToday(null);
        return;
      }

      const url = `${API_BASE_URL.onedh}/getAbsensiToday?username=${username}`;
      const response = await fetch(url, {
        headers: {Authorization: `Bearer ${token}`},
        signal: controller.signal,
      });
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
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      if (!json || !json.absen) {
        throw new Error('Response tidak sesuai format');
      }

      const firstData = Array.isArray(json.absen)
        ? json.absen[0]
        : json.absen ??
          (Array.isArray(json.absen_ls) ? json.absen_ls[0] : null);

      console.log(firstData);
      setAbsensiToday(prev =>
        JSON.stringify(prev) === JSON.stringify(firstData) ? prev : firstData,
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        Toast.show({
          type: 'error',
          text1: 'Gagal Memuat Absensi',
          text2: err?.message ?? 'Terjadi kesalahan.',
        });
      }
      setAbsensiToday(null);
    } finally {
      setLoadingAbsensi(false);
    }
  }, []);

  // Fetch PDF list for today
  const fetchPdfList = useCallback(async () => {
    try {
      setLoading(true);

      const cache = await AsyncStorage.getItem('loginCache');
      const parsedCache = cache ? JSON.parse(cache) : null;
      const token = parsedCache?.token;

      if (!token) {
        Toast.show({
          type: 'info',
          text1: 'Session tidak lengkap',
          text2: 'Silakan login ulang.',
        });
        return;
      }

      const today = moment();
      const url = `${
        API_BASE_URL.onedh
      }/getIDPdfDay?day=${today.date()}&month=${
        today.month() + 1
      }&year=${today.year()}`;

      const res = await fetch(url, {
        headers: {Authorization: `Bearer ${token}`},
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      if (json.status === 'success' && json.data?.length > 0) {
        const item = json.data[0];
        setPdfs([
          {
            id: item.id,
            day: parseInt(item.day, 10),
            month: parseInt(item.month, 10),
            year: parseInt(item.year, 10),
            file_name: item.file_name,
          },
        ]);
      } else {
        setPdfs([]);
      }
    } catch (err: any) {
      console.error('DEBUG: Error fetch PDF:', err);
      Toast.show({
        type: 'error',
        text1: 'Gagal memuat PDF',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPdfList();
  }, [fetchPdfList]);

  const openFile = async (fileItem: {
    id: string | number;
    file_name: string;
  }) => {
    try {
      const cache = await AsyncStorage.getItem('loginCache');
      const token = cache ? JSON.parse(cache)?.token : null;

      if (!token) {
        Toast.show({
          type: 'info',
          text1: 'Session tidak lengkap',
          text2: 'Silakan login ulang.',
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const folderPath = `${RNFS.CachesDirectoryPath}/files/${today}`;

      const originalFileName = fileItem.file_name || 'dokumen';
      const safeFileName = originalFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const extension = safeFileName.includes('.')
        ? safeFileName.split('.').pop()
        : 'bin';
      const finalFileName = safeFileName.endsWith(`.${extension}`)
        ? safeFileName
        : `${safeFileName}.${extension}`;
      const localPath = `${folderPath}/${finalFileName}`;

      // Jika sudah ada → langsung buka
      if (await RNFS.exists(localPath)) {
        return openWithFallback(localPath, String(fileItem.id));
      }

      const res = await fetch(
        `${API_BASE_URL.onedh}/P5M/GetPdf?id=${fileItem.id}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const arrayBuffer = await res.arrayBuffer();
      const base64Data = Buffer?.from
        ? Buffer.from(arrayBuffer).toString('base64')
        : btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      if (!(await RNFS.exists(folderPath))) {
        await RNFS.mkdir(folderPath);
      }

      await RNFS.writeFile(localPath, base64Data, 'base64');

      // Simpan info untuk auto-hapus besok
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 1);
      await AsyncStorage.setItem('fileExpiry', expiry.toISOString());
      await AsyncStorage.setItem('filePath', localPath);

      return openWithFallback(localPath, String(fileItem.id));
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Tidak dapat membuka file',
        text2: 'Membuka di browser sebagai alternatif...',
      });
      setTimeout(() => {
        Linking.openURL(`${API_BASE_URL.onedh}/P5M/GetPdf?id=${fileItem.id}`);
      }, 1500);
    }
  };

  const openWithFallback = async (path: string, id: string) => {
    try {
      await FileViewer.open(path, {showOpenWithDialog: true});
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Tidak ada aplikasi pembaca',
        text2: 'Membuka file via browser...',
      });
      setTimeout(() => {
        Linking.openURL(`${API_BASE_URL.onedh}/P5M/GetPdf?id=${id}`);
      }, 1500);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAbsensiToday();
      const interval = setInterval(() => {
        fetchAbsensiToday();
      }, 60000);
      return () => clearInterval(interval);
    }, [fetchAbsensiToday]),
  );

  useEffect(() => {
    checkVersion();
  }, []);

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
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>
                Halo, {user?.name ?? 'User'} 👋
              </Text>
              <Text style={styles.subGreeting}>
                {dayjs().format('dddd, DD MMMM YYYY')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerMenu}
              onPress={() => setDropdownVisible(true)}>
              <Icon name="ellipsis-vertical" size={28} color="#2463EB" />
            </TouchableOpacity>
          </View>

          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <Icon name="person-circle" size={64} color="#2463EB" />
            <View style={{marginLeft: 12, flex: 1}}>
              {/* Nama + Posisi di atas */}
              <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>

              {/* Baris Info */}
              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfo}>
                  JDE: {user?.jdeno ?? '-'}
                </Text>
              </View>
              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfo}>
                  Dept: {user?.dept ?? '-'}
                </Text>
              </View>

              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfo}>
                  Position: {user?.position ?? '-'}
                </Text>
              </View>
              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfo}>
                  Company: {user?.company ?? '-'}
                </Text>
              </View>
              {/* Site List */}
              <View style={styles.siteRow}>
                <Text style={styles.siteLabel}>Site:</Text>
                {sites.length > 0 ? (
                  <FlatList
                    data={sites}
                    keyExtractor={s => s}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={[
                          styles.siteChip,
                          item === activeSite && styles.siteChipActive,
                        ]}
                        onPress={() => handleSiteSelect(item)}>
                        <Text
                          style={[
                            styles.siteChipText,
                            item === activeSite && styles.siteChipTextActive,
                          ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  />
                ) : (
                  <Text style={styles.siteWarning}>Tidak ada site.</Text>
                )}
              </View>
            </View>
          </View>

          {/* ABSENSI WIDGET */}
          <View style={styles.absenCard}>
            {absensiToday ? (
              <>
                <Text style={styles.notifTitle}>Absensi Hari Ini</Text>
                <View style={styles.absenRow}>
                  <View style={styles.absenCol}>
                    <Icon name="log-in-outline" size={22} color="#4CAF50" />
                    <Text style={styles.absenLabel}>Masuk</Text>
                    <Text style={styles.absenValue}>
                      {absensiToday.timein?.split(' ')[1] ?? '-'}
                    </Text>
                  </View>
                  <View style={styles.absenCol}>
                    <Icon name="log-out-outline" size={22} color="#F44336" />
                    <Text style={styles.absenLabel}>Keluar</Text>
                    <Text style={styles.absenValue}>
                      {absensiToday.timeout?.split(' ')[1] ?? '-'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.notifStatus}>
                  Status:{' '}
                  {absensiToday.timeout
                    ? 'Lengkap'
                    : absensiToday.timein
                    ? 'Belum Pulang'
                    : 'Belum Masuk'}
                </Text>
              </>
            ) : (
              <Text style={styles.notifTitle}>
                Belum ada data absensi hari ini
              </Text>
            )}
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.quickActions}>
            {pdfs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="document-outline" size={40} color="#A0A0A0" />
                <Text style={styles.emptyTitle}>Tidak ada PDF</Text>
                <Text style={styles.emptySubtitle}>
                  Materi Safety Talk akan muncul di sini jika sudah tersedia.
                </Text>
              </View>
            ) : (
              pdfs.map(pdf => (
                <TouchableOpacity
                  key={pdf.id}
                  style={styles.quickAction}
                  onPress={() => openFile(pdf)}>
                  <Icon name="document-outline" size={28} color="#2463EB" />
                  <Text style={styles.quickActionLabel}>
                    Materi Safety Talk{' '}
                    {`PDF ${pdf.day}/${pdf.month}/${pdf.year}`}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* DROPDOWN MENU */}
          <Modal
            visible={dropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => {
                if (!refreshingMaster) setDropdownVisible(false);
              }}>
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
                        await handleRefreshMaster();
                        setDropdownVisible(false);
                      }}>
                      <Icon name="refresh-outline" size={20} color="#2463EB" />
                      <Text style={styles.dropdownText}>Refresh Master</Text>
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
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default DashboardScreen;
