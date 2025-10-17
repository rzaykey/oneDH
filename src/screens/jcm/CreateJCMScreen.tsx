import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Button,
  TextInput,
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
import {fetchWithCachePerKey} from '../../utils/fetchWithCachePerKey';
import {fetchWithCache} from '../../utils/fetchWithCache';
import {v4 as uuidv4} from 'uuid';
import 'react-native-get-random-values';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';
import {useFocusEffect} from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import dayjs from 'dayjs';

const OFFLINE_SUBMIT_KEY = 'offline_submit_jcm';

const API_URL_MU = `${API_BASE_URL.onedh}/MasterUnit`;
const API_URL_GWU = `${API_BASE_URL.onedh}/GetWoUnit/`;
const API_URL_GGT = `${API_BASE_URL.onedh}/GetGroupTask`;
const API_URL_GTA = `${API_BASE_URL.onedh}/GetTaskAssignment/`;
const API_URL_GS = `${API_BASE_URL.onedh}/GetSupervisor/`;

const CreateJCMscreen = ({navigation}) => {
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

  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [tanggal, setTanggal] = useState(new Date());
  const [jam, setJam] = useState(new Date());
  const [showTanggalPicker, setShowTanggalPicker] = useState(false);
  const [showJamPicker, setShowJamPicker] = useState(false);
  const [hM, setHM] = useState('');
  const [openUnit, setOpenUnit] = useState(false);

  const getAuthHeader = async () => {
    const cache = await AsyncStorage.getItem('loginCache');
    const token = cache && JSON.parse(cache)?.token;
    if (!token) throw new Error('Token tidak ditemukan!');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  };

  const refreshMaster = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const [unitsRes, groupsRes] = await Promise.all([
        fetchWithCache('cache_units', API_URL_MU, headers),
        fetchWithCache('cache_group_task', API_URL_GGT, headers),
      ]);

      setUnitList(
        (unitsRes.data || []).map((u: any) => ({
          label: u.plant_no,
          value: u.plant_no,
        })),
      );

      setGroupTaskList(
        (groupsRes.data || []).map((g: any) => ({
          label: g.group_task,
          value: g.group_task,
        })),
      );
    } catch (e) {
      Toast.show({type: 'error', text1: 'Gagal mengambil master data'});
    } finally {
      setLoadingMaster(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshMaster();
      validateOfflineSelections();
    }, [refreshMaster]),
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        refreshMaster();
        validateOfflineSelections();
      } else {
        validateOfflineSelections();
      }
    });
    return () => unsubscribe();
  }, [refreshMaster]);

  const refreshQueueCount = useCallback(async () => {
    const count = await getOfflineQueueCount(OFFLINE_SUBMIT_KEY);
    setQueueCount(count);
  }, []);

  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  useEffect(() => {
    const run = async () => {
      if (!selectedUnit) {
        setWoList([]);
        setSelectedWO(null);
        setGroupTaskList(prev => prev);
        setSelectedGroupTask(null);
        setAssignmentList([]);
        setSelectedAssignment(null);
        setSupervisorList([]);
        setSelectedSupervisor(null);
        return;
      }
      try {
        const headers = await getAuthHeader();
        const woRes = await fetchWithCachePerKey(
          'cache_wo',
          selectedUnit,
          `${API_URL_GWU}${selectedUnit}`,
          headers,
        );
        const formatted = (woRes.data || []).map((wo: any) => ({
          label: `${wo.work_order} - ${wo.wo_type}`,
          value: wo.work_order,
        }));
        setWoList(formatted);
        setSelectedWO(null);
        setSelectedGroupTask(null);
        setAssignmentList([]);
        setSelectedAssignment(null);
        setSupervisorList([]);
        setSelectedSupervisor(null);
      } catch (e) {
      }
    };
    run();
  }, [selectedUnit]);

  useEffect(() => {
    const run = async () => {
      if (!selectedWO) {
        setSelectedGroupTask(null);
        setAssignmentList([]);
        setSelectedAssignment(null);
        setSupervisorList([]);
        setSelectedSupervisor(null);
        return;
      }
      try {
        const headers = await getAuthHeader();
        const groupRes = await fetchWithCache(
          'cache_group_task',
          API_URL_GGT,
          headers,
        );
        const formatted = (groupRes.data || []).map((g: any) => ({
          label: g.group_task,
          value: g.group_task,
        }));
        setGroupTaskList(formatted);
        setSelectedGroupTask(null);
        setAssignmentList([]);
        setSelectedAssignment(null);
        setSupervisorList([]);
        setSelectedSupervisor(null);
      } catch (e) {
      }
    };
    run();
  }, [selectedWO]);

  useEffect(() => {
    const run = async () => {
      if (!selectedGroupTask) {
        setAssignmentList([]);
        setSelectedAssignment(null);
        setSupervisorList([]);
        setSelectedSupervisor(null);
        return;
      }
      try {
        const headers = await getAuthHeader();
        const asgRes = await fetchWithCachePerKey(
          'cache_assignment',
          selectedGroupTask,
          `${API_URL_GTA}${selectedGroupTask}`,
          headers,
        );
        const formatted = (asgRes.data || []).map((a: any) => ({
          label: a.task,
          value: a.id,
        }));
        setAssignmentList(formatted);
        setSelectedAssignment(null);
        setSupervisorList([]);
        setSelectedSupervisor(null);
      } catch (e) {
      }
    };
    run();
  }, [selectedGroupTask]);

  useEffect(() => {
    const run = async () => {
      const ready =
        selectedUnit && selectedWO && selectedGroupTask && selectedAssignment;
      if (!ready) {
        setSupervisorList([]);
        setSelectedSupervisor(null);
        return;
      }
      try {
        const headers = await getAuthHeader();
        const supRes = await fetchWithCache(
          'cache_supervisor',
          API_URL_GS,
          headers,
        );
        const formatted = (supRes.data || []).map((s: any) => ({
          label: s.name,
          value: s.jdeno,
        }));
        setSupervisorList(formatted);
        setSelectedSupervisor(null);
      } catch (e) {
      }
    };
    run();
  }, [selectedUnit, selectedWO, selectedGroupTask, selectedAssignment]);

  const validateOfflineSelections = async () => {
    try {
      const headers = await getAuthHeader();

      const unitCache = await fetchWithCache(
        'cache_units',
        API_URL_MU,
        headers,
        true,
      );
      const validUnits = unitCache?.data?.map((i: any) => i.plant_no) || [];
      if (selectedUnit && !validUnits.includes(selectedUnit)) {
        Toast.show({type: 'info', text1: 'Unit tidak tersedia, di-reset.'});
        setSelectedUnit(null);
      }

      if (selectedUnit) {
        const woCache = await fetchWithCachePerKey(
          'cache_wo',
          selectedUnit,
          `${API_URL_GWU}${selectedUnit}`,
          headers,
          true,
        );
        const validWO = woCache?.data?.map((i: any) => i.work_order) || [];
        if (selectedWO && !validWO.includes(selectedWO)) {
          Toast.show({type: 'info', text1: 'WO tidak tersedia, di-reset.'});
          setSelectedWO(null);
        }
      }

      const groupCache = await fetchWithCache(
        'cache_group_task',
        API_URL_GGT,
        headers,
        true,
      );
      const validGroups = groupCache?.data?.map((i: any) => i.group_task) || [];
      if (selectedGroupTask && !validGroups.includes(selectedGroupTask)) {
        Toast.show({
          type: 'info',
          text1: 'Group Task tidak tersedia, di-reset.',
        });
        setSelectedGroupTask(null);
      }

      if (selectedGroupTask) {
        const asgCache = await fetchWithCachePerKey(
          'cache_assignment',
          selectedGroupTask,
          `${API_URL_GTA}${selectedGroupTask}`,
          headers,
          true,
        );
        const validAssignments = asgCache?.data?.map((i: any) => i.id) || [];
        if (
          selectedAssignment &&
          !validAssignments.includes(selectedAssignment)
        ) {
          Toast.show({
            type: 'info',
            text1: 'Assignment tidak tersedia, di-reset.',
          });
          setSelectedAssignment(null);
        }
      }
    } catch (e) {
    }
  };

  const refreshAndValidate = useCallback(async () => {
    await refreshMaster();
    await validateOfflineSelections();
  }, [refreshMaster]);

  useFocusEffect(
    useCallback(() => {
      refreshAndValidate();
    }, [refreshAndValidate]),
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        refreshAndValidate();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAndValidate]);

  const handleClearOfflineCache = async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_SUBMIT_KEY);
      await refreshQueueCount();

      Toast.show({
        type: 'success',
        text1: 'Berhasil Hapus Cache',
        text2: 'Data offline berhasil dihapus dari penyimpanan.',
        position: 'top',
        text2NumberOfLines: 10,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Gagal Hapus Cache',
        text2: 'Terjadi kesalahan saat menghapus data offline.',
        position: 'top',
        text2NumberOfLines: 10,
      });
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

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
      setLoading(false);
      return;
    }

    let dataSubmit = {};

    try {
      const tanggalStr = dayjs(tanggal).format('YYYY-MM-DD');
      const jamStr = dayjs(jam).format('HH:mm:ss');

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

      const selectedAssignmentObj = assignmentList.find(
        item => item.value === selectedAssignment,
      );

      const systemName = DeviceInfo.getSystemName();
      const systemVersion = DeviceInfo.getSystemVersion();
      const version = DeviceInfo.getVersion();

      const fullInfo = `${systemName} ${systemVersion} - ${version}`;

      dataSubmit = {
        id: uuidv4(),
        wono: selectedWO,
        jdeno,
        site,
        tanggal: tanggalStr,
        jam: jamStr,
        unitNo: selectedUnit,
        typeInput: fullInfo,
        wo_task_desc: selectedAssignmentObj?.label || '',
        fid_wo_Task: selectedAssignment,
        fid_pengawas: selectedSupervisor,
        parrent_wo_task: selectedGroupTask,
        hm_bd: hM,
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
          }
        } catch (err) {
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
            text2NumberOfLines: 20,
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
      try {
        await addQueueOffline(OFFLINE_SUBMIT_KEY, dataSubmit);
        await refreshQueueCount();
        Toast.show({
          type: 'info',
          text1: 'Offline',
          text2: 'Tidak bisa mengirim data. Disimpan ke antrian.',
        });
      } catch (queueErr) {
        Toast.show({
          type: 'error',
          text1: 'Gagal',
          text2: 'Tidak bisa menyimpan data ke antrian offline.',
        });
      }
    }

    setLoading(false);
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
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          enableOnAndroid={true}
          extraScrollHeight={100}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Form Job Card Mechanic</Text>
          {/* <TouchableOpacity
            onPress={refreshMaster}
            style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>🔄 Refresh Data</Text>
          </TouchableOpacity> */}

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

          <View style={styles.card}>
            <View style={[styles.formGroup, {zIndex: 3000}]}>
              <Text style={styles.label}>Pilih Unit</Text>
              <DropDownPicker
                open={openUnit}
                value={selectedUnit}
                items={unitList}
                setOpen={setOpenUnit}
                setValue={setSelectedUnit}
                setItems={setUnitList}
                placeholder="Pilih Unit"
                searchable={true}
                searchPlaceholder="Cari Unit..."
                zIndex={3000}
                zIndexInverse={1000}
                listMode="MODAL"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
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
            <View style={styles.formGroup}>
              <Text style={styles.label}>HM</Text>
              <TextInput
                style={styles.label}
                placeholder="HM"
                value={hM}
                keyboardType="numeric"
                onChangeText={setHM}
              />
            </View>
            <View style={styles.row}>
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
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CreateJCMscreen;
