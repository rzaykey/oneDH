import React, {useState, useEffect, useCallback} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNPickerSelect from 'react-native-picker-select';
import {useSiteContext} from '../../context/SiteContext';
import API_BASE_URL from '../../config';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';
import {
  addQueueOffline,
  pushOfflineQueue,
  getOfflineQueueCount,
} from '../../utils/offlineQueueHelper';
import {JCMCreateStyle as styles} from '../../styles/JCMCreateStyle';
import {fetchWithCachePerKey} from '../../utils/fetchWithCachePerKey'; // path sesuai
import {fetchWithCache} from '../../utils/fetchWithCache';
import {v4 as uuidv4} from 'uuid';
import 'react-native-get-random-values';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';
import {useFocusEffect} from '@react-navigation/native';

const OFFLINE_SUBMIT_KEY = 'offline_submit_wogen';

const API_URL_GWG = `${API_BASE_URL.onedh}/GetMasterWoGeneral/`;
const API_URL_GS = `${API_BASE_URL.onedh}/GetSupervisor/`;

const CreateWoGenScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();

  const [loadingMaster, setLoadingMaster] = useState(true);

  const [woList, setWoList] = useState([]);
  const [selectedWO, setSelectedWO] = useState(null);

  const [supervisorList, setSupervisorList] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [tanggal, setTanggal] = useState(new Date());
  const [jam, setJam] = useState(new Date());
  const [showTanggalPicker, setShowTanggalPicker] = useState(false);
  const [showJamPicker, setShowJamPicker] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('🌐 Online detected, refreshing data...');
        refreshAll(); // panggil refresh manual
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshAll = useCallback(async () => {
    Toast.show({
      type: 'info',
      text1: 'Menyegarkan data...',
      position: 'top',
      autoHide: true,
      visibilityTime: 1000,
    });

    try {
      const headers = await getAuthHeader();

      // 🔹 Work Order (on-demand cache by unit)
      const woRes = await fetchWithCache('cache_wo_gen', API_URL_GWG, headers);
      const formattedWO = woRes.data.map(wo => ({
        label: `${wo.work_order} - ${wo.wo_task_desc}`,
        value: wo.work_order,
      }));
      setWoList(formattedWO);
      setSelectedWO(null);

      // 🔹 Supervisor (by unit)
      const supRes = await fetchWithCache(
        'cache_supervisor',
        API_URL_GS,
        headers,
      );
      const formattedSup = supRes.data.map(item => ({
        label: item.name,
        value: item.jdeno,
      }));
      setSupervisorList(formattedSup);
      setSelectedSupervisor(null);

      setLoadingMaster(false);

      Toast.show({
        type: 'success',
        text1: 'Data berhasil diperbarui',
      });
    } catch (error) {
      console.error('Error saat refreshAll:', error);
      Toast.show({
        type: 'error',
        text1: 'Gagal memuat data',
        text2: 'Pastikan koneksi internet stabil.',
      });
    }
  }, []);

  const refreshQueueCount = useCallback(async () => {
    const count = await getOfflineQueueCount(OFFLINE_SUBMIT_KEY);
    setQueueCount(count);
  }, []);

  const getAuthHeader = async () => {
    const cache = await AsyncStorage.getItem('loginCache');
    const token = cache && JSON.parse(cache)?.token;
    if (!token) throw new Error('Token tidak ditemukan!');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  const refreshAllMasterData = useCallback(async () => {
    try {
      const headers = await getAuthHeader();

      // 3. Supervisor (jika ada unit)
      const supRes = await fetchWithCache(
        'cache_supervisor',
        API_URL_GS,
        headers,
      );
      const formattedSup = supRes.data.map(item => ({
        label: item.name,
        value: item.jdeno,
      }));
      setSupervisorList(formattedSup);
      setSelectedSupervisor(null);

      // 4. WO (jika ada unit)
      const woRes = await fetchWithCache(
        'cache_wo_gen',
        `${API_URL_GWG}`,
        headers,
      );
      const formattedWO = woRes.data.map(wo => ({
        label: `${wo.work_order} - ${wo.wo_task_desc}`,
        value: wo.work_order,
      }));
      setWoList(formattedWO);
      setSelectedWO(null);

      Toast.show({
        type: 'success',
        text1: 'Data berhasil diperbarui',
      });
    } catch (err) {
      console.error('refreshAllMasterData error:', err);
      Toast.show({
        type: 'error',
        text1: 'Gagal refresh data',
        text2: 'Cek koneksi internet atau ulangi.',
      });
    } finally {
      setLoadingMaster(false);
    }
  }, []);

  // 🔄 Saat koneksi kembali online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('📶 Online, auto-refresh master data');
        refreshAllMasterData();
        validateOfflineSelections();
      }
    });
    return () => unsubscribe();
  }, [refreshAllMasterData]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected || !state.isInternetReachable) {
        console.log('📴 Offline mode, validate dropdown values');
        validateOfflineSelections();
      }
    });

    return () => unsubscribe();
  }, []);

  const validateOfflineSelections = async () => {
    try {
      const headers = await getAuthHeader();

      // ✅ Validate WO
      const woCache = await fetchWithCachePerKey(
        'cache_wo_gen',
        `${API_URL_GWG}`,
        headers,
        true,
      );
      const validWOs = woCache?.data?.map(wo => wo.work_order) || [];

      if (selectedWO && !validWOs.includes(selectedWO)) {
        Toast.show({
          type: 'info',
          text1: 'WO tidak tersedia',
          text2: 'Pilihan WO tidak valid di data offline dan telah di-reset.',
        });
        setSelectedWO(null);
      }
    } catch (error) {
      console.warn('Offline validation failed:', error);
    }
  };

  // 🔄 Saat screen difokuskan
  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        console.log('👁️ Screen focused, refresh + validate');
        await refreshAllMasterData();
        await validateOfflineSelections(); // ⬅️ Tambahkan ini
      };
      run();
    }, [refreshAllMasterData]),
  );

  const handleClearOfflineCache = async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_SUBMIT_KEY);
      await refreshQueueCount();

      Toast.show({
        type: 'success',
        text1: 'Berhasil Hapus Cache',
        text2: 'Data offline berhasil dihapus dari penyimpanan.',
        position: 'top',
      });

      console.log('Offline cache cleared successfully.');
    } catch (error) {
      console.error('Gagal menghapus cache offline:', error);

      Toast.show({
        type: 'error',
        text1: 'Gagal Hapus Cache',
        text2: 'Terjadi kesalahan saat menghapus data offline.',
        position: 'top',
      });
    }
  };

  const handleSubmit = async () => {
    if (loading) return; // mencegah double submit
    setLoading(true); // mulai loading

    console.log('✅ handleSubmit DIPANGGIL');

    const missingFields = [];

    if (!selectedWO) missingFields.push('WO');
    if (!selectedSupervisor) missingFields.push('Supervisor');

    if (missingFields.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Field belum lengkap',
        text2: `Harap isi: ${missingFields.join(', ')}`,
      });
      setLoading(false); // hentikan loading
      return;
    }

    let dataSubmit = {};

    try {
      const tanggalStr = tanggal.toISOString().split('T')[0];
      const jamStr = jam.toTimeString().split(' ')[0];

      const cache = await AsyncStorage.getItem('loginCache');
      const parsed = JSON.parse(cache);
      const jdeno = parsed?.dataEmp?.jdeno;
      const site = parsed?.dataEmp?.site;

      if (!jdeno) {
        Toast.show({
          type: 'error',
          text1: 'Gagal',
          text2: 'Data pengguna tidak ditemukan.',
        });
        setLoading(false);
        return;
      }

      const type = DeviceInfo.getSystemName();
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();

      dataSubmit = {
        id: uuidv4(),
        wono_gen: selectedWO,
        jdeno,
        site,
        tanggal: tanggalStr,
        jam: jamStr,
        typeInput: `(${type})(${build})(${version})`,
        fid_pengawas: selectedSupervisor,
      };
      console.log(dataSubmit);
      const headers = await getAuthHeader();

      const response = await fetch(`${API_BASE_URL.onedh}/StoreTaskWOGen`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dataSubmit),
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Data berhasil disubmit!',
        });
        setLoading(false);
        navigation.goBack();
      } else {
        let resJson = {};
        let rawMessage = '';

        try {
          const text = await response.text();
          try {
            resJson = JSON.parse(text);
          } catch (jsonErr) {
            console.warn('❗ Gagal parsing JSON:', jsonErr);
          }
        } catch (err) {
          console.warn('❗ Gagal membaca response:', err);
        }

        rawMessage =
          resJson?.message ||
          resJson?.notif ||
          'Terjadi kesalahan saat submit.';

        if (resJson?.status === false) {
          Toast.show({
            type: 'error',
            text1: 'Gagal',
            text2: rawMessage,
            text2NumberOfLines: 10,
          });
          setLoading(false);
          return;
        }

        await addQueueOffline(OFFLINE_SUBMIT_KEY, dataSubmit);
        await refreshQueueCount();
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2: 'Data disimpan dan akan dikirim saat online.',
        });
      }
    } catch (error) {
      console.warn('❗ Error saat submit:', error);
      try {
        await addQueueOffline(OFFLINE_SUBMIT_KEY, dataSubmit);
        await refreshQueueCount();
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2: 'Tidak bisa mengirim data. Disimpan ke antrian.',
        });
      } catch (queueErr) {
        console.error('❌ Gagal menyimpan ke queue:', queueErr);
        Toast.show({
          type: 'error',
          text1: 'Gagal',
          text2: 'Tidak bisa menyimpan data ke antrian offline.',
        });
      }
    }

    setLoading(false); // pastikan ini dipanggil di akhir
  };

  const confirmClearOfflineCache = () => {
    Alert.alert('Konfirmasi', 'Yakin ingin menghapus semua data offline?', [
      {text: 'Batal', style: 'cancel'},
      {text: 'Hapus', onPress: handleClearOfflineCache},
    ]);
  };

  if (loadingMaster) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      start={{x: 2, y: 2}}
      end={{x: 1, y: 0}}
      style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Form Job Card Mechanic</Text>
          <TouchableOpacity onPress={refreshAll} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
          </TouchableOpacity>

          {/* === Offline Queue Action Buttons === */}
          {queueCount > 0 && (
            <View style={styles.offlineButtonContainer}>
              <TouchableOpacity
                onPress={async () => {
                  setSyncing(true);
                  const sent = await pushOfflineQueue(
                    OFFLINE_SUBMIT_KEY,
                    '/CreateTaskAssignment',
                    undefined,
                    API_BASE_URL.onedh,
                  );
                  await refreshQueueCount();
                  setSyncing(false);

                  Alert.alert(
                    'Info',
                    sent === 0
                      ? queueCount > 0
                        ? 'Ada data yang gagal dikirim. Cek koneksi/server, data akan dicoba lagi otomatis saat online.'
                        : 'Tidak ada data offline tersisa.'
                      : 'Berhasil mengirim data offline.',
                  );
                }}
                disabled={syncing}
                style={[
                  styles.flatButtonWide,
                  syncing && styles.flatButtonDisabled,
                ]}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.flatButtonText}>
                    {syncing ? 'Menyinkron...' : 'Kirim Data Offline'}
                  </Text>
                  {!syncing && queueCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{queueCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmClearOfflineCache}
                style={styles.flatButtonWide}>
                <Text style={styles.flatButtonText}>Hapus Cache</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* === FORM CARD === */}
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nomor WO</Text>
              <RNPickerSelect
                onValueChange={setSelectedWO}
                items={woList}
                placeholder={{label: 'Pilih WO', value: null}}
                style={styles.picker}
                value={selectedWO}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Supervisor</Text>
              <RNPickerSelect
                onValueChange={value => {
                  if (!selectedWO) {
                    Toast.show({
                      type: 'info',
                      text1: 'Pilih WO terlebih dahulu',
                    });
                    return;
                  }
                  setSelectedSupervisor(value);
                }}
                items={supervisorList}
                placeholder={{label: 'Pilih Supervisor', value: null}}
                style={styles.picker}
                value={selectedSupervisor}
                disabled={!selectedWO} // 🔒 disabled jika WO belum dipilih
              />
            </View>
            <View style={styles.row}>
              {/* Tanggal */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tanggal:</Text>
                <Button
                  title={tanggal.toISOString().split('T')[0]}
                  onPress={() => setShowTanggalPicker(true)}
                />
                {showTanggalPicker && (
                  <DateTimePicker
                    value={tanggal}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowTanggalPicker(false);
                      if (selectedDate) {
                        setTanggal(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Jam */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jam:</Text>
                <Button
                  title={jam.toTimeString().split(' ')[0]}
                  onPress={() => setShowJamPicker(true)}
                />
                {showJamPicker && (
                  <DateTimePicker
                    value={jam}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowJamPicker(false);
                      if (selectedTime) {
                        setJam(selectedTime);
                      }
                    }}
                  />
                )}
              </View>
            </View>
          </View>

          {/* === SUBMIT BUTTON === */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Kirim</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CreateWoGenScreen;
