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
import NetInfo from '@react-native-community/netinfo';
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
import Icon from 'react-native-vector-icons/FontAwesome'; // atau Feather, MaterialIcons, dsb.
import 'react-native-get-random-values';

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

  useEffect(() => {
    if (selectedUnit) {
      const fetchSupervisor = async () => {
        try {
          const headers = await getAuthHeader();
          const json = await fetchWithCache(
            'cache_supervisor',
            `${API_URL_GS}`,
            headers,
          );
          const formatted = json.data.map(item => ({
            label: item.name,
            value: item.jdeno,
          }));
          setSupervisorList(formatted);
          setSelectedSupervisor(null);
        } catch (error) {
          console.error('Error fetching supervisor:', error);
        }
      };
      fetchSupervisor();
    } else {
      setSupervisorList([]);
      setSelectedSupervisor(null);
    }
  }, [selectedUnit]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const headers = await getAuthHeader();
        const json = await fetchWithCache('cache_units', API_URL_MU, headers);

        const formatted = json.data.map(unit => ({
          label: unit.plant_no,
          value: unit.plant_no,
        }));
        setUnitList(formatted);
      } catch (error) {
        console.error('Error fetching unit:', error);
      }
    };

    const fetchGroupTask = async () => {
      try {
        const headers = await getAuthHeader();
        const json = await fetchWithCache(
          'cache_group_task',
          API_URL_GGT,
          headers,
        );

        const formatted = json.data.map(item => ({
          label: item.group_task,
          value: item.group_task,
        }));
        setGroupTaskList(formatted);
      } catch (error) {
        console.error('Error fetching group task:', error);
      }
    };

    fetchUnits();
    fetchGroupTask();
    setLoadingMaster(false);
  }, []);

  // Dependent dropdown: WO
  useEffect(() => {
    if (selectedUnit) {
      const fetchWO = async () => {
        try {
          const headers = await getAuthHeader();
          const json = await fetchWithCachePerKey(
            'cache_wo', // prefix
            selectedUnit, // dynamic key
            `${API_URL_GWU}${selectedUnit}`,
            headers,
          );

          const formatted = json.data.map(wo => ({
            label: `${wo.work_order} - ${wo.wo_type}`,
            value: wo.work_order,
          }));
          setWoList(formatted);
          setSelectedWO(null);
        } catch (error) {
          console.error('Error fetching WO:', error);
        }
      };

      fetchWO();
    } else {
      setWoList([]);
      setSelectedWO(null);
    }
  }, [selectedUnit]);

  // Dependent dropdown: Assignment
  useEffect(() => {
    if (selectedGroupTask) {
      const fetchAssignment = async () => {
        try {
          const headers = await getAuthHeader();
          const json = await fetchWithCachePerKey(
            'cache_assignment',
            selectedGroupTask,
            `${API_URL_GTA}${selectedGroupTask}`,
            headers,
          );

          const formatted = json.data.map(item => ({
            label: item.task,
            value: item.id,
          }));
          setAssignmentList(formatted);
          setSelectedAssignment(null);
        } catch (error) {
          console.error('Error fetching assignment:', error);
        }
      };

      fetchAssignment();
    } else {
      setAssignmentList([]);
      setSelectedAssignment(null);
    }
  }, [selectedGroupTask]);

  const handleClearOfflineCache = async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_SUBMIT_KEY);
      await refreshQueueCount();
      Alert.alert('Sukses', 'Data offline berhasil dihapus.');
    } catch (error) {
      console.error('Gagal menghapus cache offline:', error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat menghapus cache.');
    }
  };

  const handleSubmit = async () => {
    if (
      !selectedWO ||
      !selectedSupervisor ||
      !selectedAssignment ||
      !selectedUnit ||
      !selectedGroupTask
    ) {
      Alert.alert('Error', 'Mohon lengkapi semua field yang diperlukan.');
      return;
    }

    let dataSubmit: any = {}; // ✅ Deklarasi di luar try

    try {
      const tanggalStr = tanggal.toISOString().split('T')[0];
      const jamStr = jam.toTimeString().split(' ')[0];

      const cache = await AsyncStorage.getItem('loginCache');
      const parsed = JSON.parse(cache);
      const jdeno = parsed?.dataEmp?.jdeno;

      const selectedAssignmentObj = assignmentList.find(
        item => item.value === selectedAssignment,
      );

      if (!jdeno) {
        Alert.alert('Error', 'Data pengguna tidak ditemukan.');
        return;
      }

      const type = DeviceInfo.getSystemName();
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();

      dataSubmit = {
        id: uuidv4(),
        wono: selectedWO,
        jdeno: jdeno,
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
        Alert.alert('Sukses', 'Job Card berhasil disubmit!');
        navigation.goBack();
      } else {
        let resJson = {};
        let rawMessage = '';
        try {
          const text = await response.text();
          try {
            resJson = JSON.parse(text);
          } catch (jsonErr) {
            console.warn('Gagal parsing JSON dari response.text():', jsonErr);
          }
        } catch (err) {
          console.warn('Gagal membaca response:', err);
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
          Alert.alert('Gagal', rawMessage);
          return;
        }

        await addQueueOffline(OFFLINE_SUBMIT_KEY, dataSubmit);
        await refreshQueueCount();
        Alert.alert(
          'Offline',
          'Tidak bisa submit ke server. Data disimpan untuk dikirim nanti.',
        );
      }
    } catch (error) {
      console.warn('Error saat submit:', error.message);
      try {
        await addQueueOffline(OFFLINE_SUBMIT_KEY, dataSubmit);
        await refreshQueueCount();
        Alert.alert(
          'Offline',
          'Tidak bisa mengirim data sekarang. Data disimpan ke antrian.',
        );
      } catch (queueErr) {
        console.error('Gagal menyimpan ke queue:', queueErr);
        Alert.alert('Gagal', 'Tidak bisa menyimpan data ke antrian offline.');
      }
    }
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
