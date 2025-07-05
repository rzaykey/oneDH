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

const DRAFT_KEY = 'draft_p2h_form';
const OFFLINE_SUBMIT_KEY = 'offline_submit_jcm';

const API_URL_MU = `${API_BASE_URL.onedh}/MasterUnit`;
const API_URL_GWU = `${API_BASE_URL.onedh}/GetWoUnit/`;
const API_URL_GGT = `${API_BASE_URL.onedh}/GetGroupTask`;
const API_URL_GTA = `${API_BASE_URL.onedh}/GetTaskAssignment/`;
const API_URL_GS = `${API_BASE_URL.onedh}/GetSupervisor/`;

const CreateJCMcreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();

  const [loadingMaster, setLoadingMaster] = useState(true);
  const [unitList, setUnitList] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [woList, setWoList] = useState([]);
  const [selectedWO, setSelectedWO] = useState(null);

  const [groupTaskList, setGroupTaskList] = useState([]);
  const [selectedGroupTask, setSelectedGroupTask] = useState(null);

  const [assignmentList, setAssignmentList] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [supervisorList, setSupervisorList] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const [isConnected, setIsConnected] = useState(true);
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

      // Units
      const unitsRes = await fetchWithCache('cache_units', API_URL_MU, headers);
      const formattedUnits = unitsRes.data.map(unit => ({
        label: unit.plant_no,
        value: unit.plant_no,
      }));
      setUnitList(formattedUnits);

      // Group Task
      const groupRes = await fetchWithCache(
        'cache_group_task',
        API_URL_GGT,
        headers,
      );
      const formattedGroups = groupRes.data.map(item => ({
        label: item.group_task,
        value: item.group_task,
      }));
      setGroupTaskList(formattedGroups);

      // Supervisor
      if (selectedUnit) {
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
      }

      // WO
      if (selectedUnit) {
        const woRes = await fetchWithCachePerKey(
          'cache_wo',
          selectedUnit,
          `${API_URL_GWU}${selectedUnit}`,
          headers,
        );
        const formattedWO = woRes.data.map(wo => ({
          label: `${wo.work_order} - ${wo.wo_type}`,
          value: wo.work_order,
        }));
        setWoList(formattedWO);
        setSelectedWO(null);
      }

      // Assignment
      if (selectedGroupTask) {
        const asgRes = await fetchWithCachePerKey(
          'cache_assignment',
          selectedGroupTask,
          `${API_URL_GTA}${selectedGroupTask}`,
          headers,
        );
        const formattedAsg = asgRes.data.map(item => ({
          label: item.task,
          value: item.id,
        }));
        setAssignmentList(formattedAsg);
        setSelectedAssignment(null);
      }

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
  }, [selectedUnit, selectedGroupTask]);

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

      // 1. Units
      const unitsRes = await fetchWithCache('cache_units', API_URL_MU, headers);
      const formattedUnits = unitsRes.data.map(unit => ({
        label: unit.plant_no,
        value: unit.plant_no,
      }));
      setUnitList(formattedUnits);

      // 2. Group Task
      const groupRes = await fetchWithCache(
        'cache_group_task',
        API_URL_GGT,
        headers,
      );
      const formattedGroups = groupRes.data.map(item => ({
        label: item.group_task,
        value: item.group_task,
      }));
      setGroupTaskList(formattedGroups);

      // 3. Supervisor (jika ada unit)
      if (selectedUnit) {
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
      }

      // 4. WO (jika ada unit)
      if (selectedUnit) {
        const woRes = await fetchWithCachePerKey(
          'cache_wo',
          selectedUnit,
          `${API_URL_GWU}${selectedUnit}`,
          headers,
        );
        const formattedWO = woRes.data.map(wo => ({
          label: `${wo.work_order} - ${wo.wo_type}`,
          value: wo.work_order,
        }));
        setWoList(formattedWO);
        setSelectedWO(null);
      }

      // 5. Assignment (jika ada group task)
      if (selectedGroupTask) {
        const asgRes = await fetchWithCachePerKey(
          'cache_assignment',
          selectedGroupTask,
          `${API_URL_GTA}${selectedGroupTask}`,
          headers,
        );
        const formattedAsg = asgRes.data.map(item => ({
          label: item.task,
          value: item.id,
        }));
        setAssignmentList(formattedAsg);
        setSelectedAssignment(null);
      }

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
  }, [selectedUnit, selectedGroupTask]);

  // 🔄 Saat koneksi kembali online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('📶 Online, auto-refresh master data');
        refreshAllMasterData();
      }
    });
    return () => unsubscribe();
  }, [refreshAllMasterData]);

  // 🔄 Saat screen difokuskan
  useFocusEffect(
    useCallback(() => {
      console.log('👁️ Screen focused, refresh master data');
      refreshAllMasterData();
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

    if (!selectedUnit) missingFields.push('Unit');
    if (!selectedWO) missingFields.push('WO');
    if (!selectedGroupTask) missingFields.push('Group Task');
    if (!selectedAssignment) missingFields.push('Assignment');
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

      if (!jdeno) {
        Toast.show({
          type: 'error',
          text1: 'Gagal',
          text2: 'Data pengguna tidak ditemukan.',
        });
        setLoading(false);
        return;
      }

      const selectedAssignmentObj = assignmentList.find(
        item => item.value === selectedAssignment,
      );

      const type = DeviceInfo.getSystemName();
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();

      dataSubmit = {
        id: uuidv4(),
        wono: selectedWO,
        jdeno,
        tanggal: tanggalStr,
        jam: jamStr,
        unitNo: selectedUnit,
        typeInput: `(${type})(${build})(${version})`,
        wo_task_desc: selectedAssignmentObj?.label || '',
        fid_wo_Task: selectedAssignment,
        fid_pengawas: selectedSupervisor,
        parrent_wo_task: selectedGroupTask,
      };

      const headers = await getAuthHeader();

      const response = await fetch(
        `${API_BASE_URL.onedh}/CreateTaskAssignment`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(dataSubmit),
        },
      );

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Job Card berhasil disubmit!',
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

        rawMessage = resJson?.message || 'Terjadi kesalahan saat submit.';

        if (
          resJson?.status === false &&
          (rawMessage.includes('Anda Bukanlah Seorang Mekanik') ||
            rawMessage.startsWith('Mohon Lakukan Tap Out pada Job Card') ||
            rawMessage.startsWith(
              'Silahkan clossing pekerjaan anda dimenu Riwayat Pekerjaan Saya',
            ))
        ) {
          Toast.show({
            type: 'error',
            text1: 'Gagal',
            text2: rawMessage,
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
              <Text style={styles.label}>Pilih Unit</Text>
              <RNPickerSelect
                onValueChange={setSelectedUnit}
                items={unitList}
                placeholder={{label: 'Pilih Unit', value: null}}
                style={styles.picker}
                value={selectedUnit}
              />
            </View>

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
              <Text style={styles.label}>Group Task</Text>
              <RNPickerSelect
                onValueChange={setSelectedGroupTask}
                items={groupTaskList}
                placeholder={{label: 'Pilih Group Task', value: null}}
                style={styles.picker}
                value={selectedGroupTask}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Task Assignment</Text>
              <RNPickerSelect
                onValueChange={setSelectedAssignment}
                items={assignmentList}
                placeholder={{label: 'Pilih Task Assignment', value: null}}
                style={styles.picker}
                value={selectedAssignment}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Supervisor</Text>
              <RNPickerSelect
                onValueChange={setSelectedSupervisor}
                items={supervisorList}
                placeholder={{label: 'Pilih Supervisor', value: null}}
                style={styles.picker}
                value={selectedSupervisor}
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
              <Text style={styles.buttonText}>Kirim JCM</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CreateJCMcreen;
