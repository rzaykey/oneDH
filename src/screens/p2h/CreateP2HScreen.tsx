import React, {useState, useEffect, useCallback} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Button,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import RNPickerSelect from 'react-native-picker-select';
import {createP2HStyles as styles} from '../../styles/createP2HStyles';
import {useSiteContext} from '../../context/SiteContext';
import API_BASE_URL from '../../config';
import DateTimePicker from '@react-native-community/datetimepicker';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';
import {
  addQueueOffline,
  pushOfflineQueue,
  getOfflineQueueCount,
} from '../../utils/offlineQueueHelper';

const checklistOptions = ['Baik', 'Tidak Baik', 'N/A'];
const DRAFT_KEY = 'draft_p2h_form';
const OFFLINE_SUBMIT_KEY = 'offline_submit_p2h';

const CreateP2HScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();

  // === State untuk isian form ===
  const [nounit, setNoUnit] = useState('');
  const [model, setModel] = useState('');
  const [KM, setKM] = useState('');
  const [section, setSection] = useState('');
  const [dept, setDept] = useState('');
  const [site, setSite] = useState('');
  const [tanggal, setTanggal] = useState(dayjs().format('YYYY-MM-DD'));
  const [jam, setJam] = useState(dayjs().format('HH:mm'));
  const [keterangan, setKeterangan] = useState('');
  const [inlineRadioOptions, setInlineRadioOptions] = useState({});
  const [stickerCommissioning, setStickerCommissioning] = useState('Berlaku');
  const [stickerFuelPermit, setStickerFuelPermit] = useState('Berlaku');

  // === Master data ===
  const [modelList, setModelList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // === Lainnya ===
  const [isConnected, setIsConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formLocked, setFormLocked] = useState(false);

  const getAuthHeader = async () => {
    const cache = await AsyncStorage.getItem('loginCache');
    const token = cache && JSON.parse(cache)?.token;
    if (!token) throw new Error('Token tidak ditemukan!');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  // ==== 1. Restore draft ATAU ambil dari loginCache ====
  useEffect(() => {
    const restoreDraftOrLogin = async () => {
      const draftStr = await AsyncStorage.getItem(DRAFT_KEY);
      if (draftStr) {
        try {
          const data = JSON.parse(draftStr);
          setNoUnit(data.nounit || '');
          setModel(data.model || '');
          setKM(data.KM || '');
          setSection(data.section || '');
          setDept(data.dept || '');
          setSite(data.site || '');
          setTanggal(
            data.tanggal?.trim() ? data.tanggal : dayjs().format('YYYY-MM-DD'),
          );
          setKeterangan(data.keterangan || '');
          setInlineRadioOptions(data.inlineRadioOptions || {});
          setStickerCommissioning(data.stickerCommissioning || 'Berlaku');
          setStickerFuelPermit(data.stickerFuelPermit || 'Berlaku');
          return;
        } catch {}
      }
      // Kalau tidak ada draft, ambil dari loginCache
      const loginCache = await AsyncStorage.getItem('loginCache');
      if (loginCache) {
        const cache = JSON.parse(loginCache);
        setSite(cache.dataEmp?.site || activeSite || '');
        setModel(cache.dataEmp?.model || '');
        // Note: dept di cache bisa nama, nanti user pilih di dropdown
        setDept('');
      }
      // Restore section dan dept terakhir jika belum ada
      const lastSection = await AsyncStorage.getItem('last_section');
      const lastDept = await AsyncStorage.getItem('last_dept');
      const lastNoUnit = await AsyncStorage.getItem('last_nounit');
      const lastModel = await AsyncStorage.getItem('last_model');

      setSection(prev => (prev ? prev : lastSection || ''));
      setDept(prev => (prev ? prev : lastDept || ''));
      setNoUnit(prev => (prev ? prev : lastNoUnit || ''));
      setModel(prev => (prev ? prev : lastModel || ''));
    };
    restoreDraftOrLogin();
  }, [activeSite]);

  const fetchMasters = async (forceRefresh = false) => {
    setLoadingMaster(true);

    let modelData = [],
      questionData = [],
      deptData = [];

    try {
      // Ambil cache dulu
      const modelCache = await AsyncStorage.getItem('master_model');
      const questionCache = await AsyncStorage.getItem('master_questions');
      const deptCache = await AsyncStorage.getItem('master_dept');

      const hasCache =
        modelCache &&
        questionCache &&
        deptCache &&
        JSON.parse(modelCache).length > 0 &&
        JSON.parse(questionCache).length > 0 &&
        JSON.parse(deptCache).length > 0;

      if (hasCache && !forceRefresh) {
        // ✅ Gunakan data cache
        modelData = JSON.parse(modelCache);
        questionData = JSON.parse(questionCache);
        deptData = JSON.parse(deptCache);

        setModelList(modelData);
        setQuestionList(questionData);
        setDeptList(deptData);

        Toast.show({
          type: 'info',
          text1: 'Data Master',
          text2: 'Menggunakan data lokal dari cache.',
          position: 'top',
        });

        setLoadingMaster(false);
        return;
      }

      // ❗ Cache tidak lengkap atau user paksa refresh
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected;

      if (!isOnline) {
        Toast.show({
          type: 'error',
          text1: 'Offline',
          text2: 'Tidak dapat memuat ulang. Gunakan data lokal.',
          position: 'top',
        });

        modelData = modelCache ? JSON.parse(modelCache) : [];
        questionData = questionCache ? JSON.parse(questionCache) : [];
        deptData = deptCache ? JSON.parse(deptCache) : [];

        setModelList(modelData);
        setQuestionList(questionData);
        setDeptList(deptData);
        setLoadingMaster(false);
        return;
      }

      const headers = await getAuthHeader();

      // === Fetch Model ===
      const modelRes = await fetch(`${API_BASE_URL.onedh}/GetModel`, {headers});
      const modelJson = await modelRes.json();
      modelData = Array.isArray(modelJson.data) ? modelJson.data : [];
      if (modelData.length > 0) {
        await AsyncStorage.setItem('master_model', JSON.stringify(modelData));
      }

      // === Fetch Questions ===
      const qRes = await fetch(`${API_BASE_URL.onedh}/MasterQuestion`, {
        headers,
      });
      const qJson = await qRes.json();
      questionData = Array.isArray(qJson.data) ? qJson.data : [];
      if (questionData.length > 0) {
        await AsyncStorage.setItem(
          'master_questions',
          JSON.stringify(questionData),
        );
      }

      // === Fetch Dept ===
      const dRes = await fetch(`${API_BASE_URL.onedh}/GetDept`, {headers});
      const dJson = await dRes.json();
      deptData = Array.isArray(dJson.data) ? dJson.data : [];
      if (deptData.length > 0) {
        await AsyncStorage.setItem('master_dept', JSON.stringify(deptData));
      }

      // ✅ Update state
      setModelList(modelData);
      setQuestionList(questionData);
      setDeptList(deptData);

      Toast.show({
        type: 'success',
        text1: 'Data Diperbarui',
        text2: 'Berhasil mengambil data dari server.',
        position: 'top',
      });
    } catch (err) {
      console.error('❌ fetchMasters error:', err);
      setModelList([]);
      setQuestionList([]);
      setDeptList([]);

      Toast.show({
        type: 'error',
        text1: 'Gagal Memuat Data',
        text2: 'Terjadi kesalahan saat mengambil data master.',
        position: 'top',
      });
    }

    setLoadingMaster(false);
  };

  // ==== 2. Fetch master data ====
  useEffect(() => {
    fetchMasters();
  }, [activeSite]);

  // ==== 3. Load offline queue count, push offline queue dsb ====
  const refreshQueueCount = useCallback(async () => {
    const count = await getOfflineQueueCount(OFFLINE_SUBMIT_KEY);
    setQueueCount(count);
  }, []);

  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
      if (state.isConnected) {
        setSyncing(true);
        pushOfflineQueue(
          OFFLINE_SUBMIT_KEY,
          '/StoreP2H',
          undefined,
          API_BASE_URL.onedh,
        ).then(() => {
          refreshQueueCount();
          setSyncing(false);
        });
      }
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, [refreshQueueCount]);

  // ==== 4. Save draft setiap perubahan ====
  useEffect(() => {
    const saveDraft = async () => {
      const type = DeviceInfo.getSystemName();
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();
      const draft = {
        nounit,
        model,
        KM,
        section,
        dept,
        site,
        tanggal,
        keterangan,
        inlineRadioOptions,
        stickerCommissioning,
        stickerFuelPermit,
        device_info: `(${type})(${build})(${version})`,
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    };

    saveDraft();
  }, [
    formLocked,
    nounit,
    model,
    KM,
    section,
    dept,
    site,
    tanggal,
    keterangan,
    inlineRadioOptions,
    stickerCommissioning,
    stickerFuelPermit,
  ]);

  // ==== 5. Reset form ====
  const resetForm = async (keepUnitInfo = true, resetTanggalDibuat = false) => {
    if (!keepUnitInfo) {
      setNoUnit('');
      setModel('');
      setSection('');
      setDept('');
    } else {
      const lastSection = await AsyncStorage.getItem('last_section');
      const lastDept = await AsyncStorage.getItem('last_dept');
      const lastNoUnit = await AsyncStorage.getItem('last_nounit');
      const lastModel = await AsyncStorage.getItem('last_model');
      setSection(lastSection || '');
      setDept(lastDept || '');
      setNoUnit(lastNoUnit || '');
      setModel(lastModel || '');
    }

    setTanggal(dayjs().format('YYYY-MM-DD'));
    setJam(dayjs().format('HH:mm'));
    setKeterangan('');
    setInlineRadioOptions({});
    setStickerCommissioning('Berlaku');
    setStickerFuelPermit('Berlaku');

    const type = DeviceInfo.getSystemName();
    const version = DeviceInfo.getVersion();
    const build = DeviceInfo.getBuildNumber();
    const draft = {
      nounit,
      model,
      KM: '',
      section,
      dept,
      site,
      tanggal: dayjs().format('YYYY-MM-DD'),
      keterangan: '',
      inlineRadioOptions: {},
      stickerCommissioning: 'Berlaku',
      stickerFuelPermit: 'Berlaku',
      device_info: `(${type})(${build})(${version})`,
    };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  };

  // ==== 6. Hapus draft ====
  const removeDraft = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
  };

  // ==== 7. Validasi form ====
  function isFormValid() {
    if (!nounit) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'No. Unit wajib diisi!',
      });
      return false;
    }
    if (!model) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Model Unit wajib dipilih!',
      });
      return false;
    }
    if (!KM) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'HM wajib diisi!',
      });
      return false;
    }
    if (!section) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Section wajib diisi!',
      });
      return false;
    }
    if (!site) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Site wajib diisi!',
      });
      return false;
    }
    if (!dept) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Departemen wajib dipilih!',
      });
      return false;
    }
    const checklistQuestions = questionList.filter(
      q => String(q.id) !== '27' && String(q.id) !== '28',
    );
    if (
      checklistQuestions.length > 0 &&
      checklistQuestions.some(q => !inlineRadioOptions[q.id])
    ) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Semua checklist wajib diisi!',
      });
      return false;
    }
    if (!stickerCommissioning) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Stiker Commisioning wajib dipilih!',
      });
      return false;
    }
    if (!stickerFuelPermit) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Stiker Fuel Permit wajib dipilih!',
      });
      return false;
    }

    return true;
  }

  // ==== 8. Checklist handler ====
  const handleChangeChecklist = useCallback((id, value) => {
    setInlineRadioOptions(prev => ({...prev, [id]: value}));
  }, []);

  // ==== 9. Submit ====
  const handleSubmit = async () => {
    if (!isFormValid()) {
      return;
    }

    setLoading(true);

    const checklistQuestions = questionList.filter(
      q => String(q.id) !== '27' && String(q.id) !== '28',
    );
    const jawabanChecklist = checklistQuestions.map(
      q => `${q.id}-${inlineRadioOptions[q.id] || ''}`,
    );

    const systemName = DeviceInfo.getSystemName();
    const systemVersion = DeviceInfo.getSystemVersion();
    const version = DeviceInfo.getVersion();

    const fullInfo = `${systemName} ${systemVersion} - ${version}`;

    const payload = {
      nounit,
      model,
      KM,
      namapengemudi: user?.name || '',
      jdeno: user?.jdeno || '',
      dept,
      section,
      site,
      inlineRadioOptions: jawabanChecklist,
      Berlaku: stickerCommissioning,
      Sticker: stickerFuelPermit,
      tanggal: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      keterangan,
      device_info: fullInfo,
    };

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      await addQueueOffline(OFFLINE_SUBMIT_KEY, payload);
      await refreshQueueCount();
      setLoading(false);
      await removeDraft();
      resetForm();

      Toast.show({
        type: 'info',
        text1: 'Offline',
        text2:
          'Data disimpan ke antrian offline. Akan dikirim otomatis saat online!',
        position: 'top',
      });

      navigation.replace('P2HMyHistory');
      return;
    }

    // Online submit
    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      const token = loginCache ? JSON.parse(loginCache).token : null;

      const response = await fetch(`${API_BASE_URL.onedh}/StoreP2H`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      let isSuccess = false;

      try {
        data = await response.json();
        isSuccess = response.ok && data.status === true;
      } catch (jsonErr) {
        console.log('[JSON PARSE ERROR]', jsonErr);
      }

      setLoading(false);

      if (isSuccess) {
        await removeDraft();
        await AsyncStorage.setItem('last_section', section);
        await AsyncStorage.setItem('last_dept', dept);
        await AsyncStorage.setItem('last_nounit', nounit);
        await AsyncStorage.setItem('last_model', model);
        await AsyncStorage.removeItem('tanggal');
        await AsyncStorage.removeItem('keterangan');
        await AsyncStorage.removeItem('inlineRadioOptions');
        resetForm(true);

        if (netState.isConnected) {
          setSyncing(true);
          await pushOfflineQueue(
            OFFLINE_SUBMIT_KEY,
            '/StoreP2H',
            undefined,
            API_BASE_URL.onedh,
          );
          await refreshQueueCount();
          setSyncing(false);
        }

        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: data.message || 'P2H berhasil disimpan!',
          position: 'top',
        });

        navigation.replace('P2HMyHistory');
      } else {
        // server balas error atau parsing JSON gagal
        await addQueueOffline(OFFLINE_SUBMIT_KEY, payload);
        await refreshQueueCount();
        await removeDraft();
        resetForm();

        Toast.show({
          type: 'info',
          text1: 'Gagal Kirim ke Server',
          text2:
            'Data disimpan ke antrian offline & akan dikirim otomatis saat server kembali normal.',
          position: 'top',
        });

        navigation.replace('P2HMyHistory');
      }
    } catch (err) {
      console.log('[FETCH ERROR]', err);
      setLoading(false);
      await addQueueOffline(OFFLINE_SUBMIT_KEY, payload);
      await refreshQueueCount();
      await removeDraft();
      resetForm();

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          'Data disimpan ke antrian offline & akan dikirim saat server kembali tersedia.',
        position: 'top',
      });

      navigation.replace('P2HMyHistory');
    }
  };

  const showOfflineQueue = async () => {
    const data = await AsyncStorage.getItem(OFFLINE_SUBMIT_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      Alert.alert('Offline Queue', JSON.stringify(parsed, null, 2));
    } else {
      Alert.alert('Queue kosong');
    }
  };

  useEffect(() => {
    if (!tanggal?.trim()) {
      setTanggal(dayjs().format('YYYY-MM-DD'));
    }
  }, []);

  // ==== 10. Render ====
  const stickerCommissioningQ = questionList.find(q => String(q.id) === '27');
  const stickerFuelPermitQ = questionList.find(q => String(q.id) === '28');
  const checklistQuestions = questionList.filter(
    q => String(q.id) !== '27' && String(q.id) !== '28',
  );

  if (loadingMaster) {
    return (
      <SafeAreaView
        style={[
          styles.containerLoading,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.title}>Memuat data...</Text>
          <Text style={styles.subtitle}>Mohon tunggu sebentar</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={[styles.container]}>
        <ScrollView contentContainerStyle={{paddingBottom: 30}}>
          <Text style={styles.title}>Form Pemeriksaan P2H</Text>
          <Button
            title="Lihat Offline Queue"
            onPress={() => showOfflineQueue('offline_submit_p2h')}
          />

          {/* BADGE QUEUE */}
          {queueCount > 0 && (
            <View
              style={{
                backgroundColor: queueCount === 0 ? '#16a34a' : '#e74c3c',
                alignSelf: 'flex-end',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
                marginBottom: 8,
              }}>
              <Text style={{color: 'white'}}>
                {queueCount} data offline menunggu dikirim!
              </Text>
              {isConnected && (
                <TouchableOpacity
                  onPress={async () => {
                    setSyncing(true);
                    const sent = await pushOfflineQueue(
                      OFFLINE_SUBMIT_KEY,
                      '/StoreP2H',
                      undefined,
                      API_BASE_URL.onedh,
                    );
                    await refreshQueueCount();
                    setSyncing(false);
                    if (sent === 0) {
                      Alert.alert(
                        'Info',
                        queueCount > 0
                          ? 'Ada data yang gagal dikirim. Cek koneksi/server, data akan dicoba lagi otomatis saat online.'
                          : 'Tidak ada data offline tersisa.',
                      );
                    }
                  }}
                  style={{
                    marginTop: 6,
                    backgroundColor: '#27ae60',
                    paddingVertical: 6,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={syncing}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>
                    {syncing ? 'Mengirim...' : 'Push Sekarang ke Server'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.rowContainer}>
            {/* Tombol Refresh */}
            <TouchableOpacity
              style={[styles.refreshButton, loadingMaster && {opacity: 0.6}]}
              onPress={fetchMasters}
              disabled={loadingMaster}>
              <Text style={styles.refreshButtonText}>
                {loadingMaster ? 'Loading...' : 'Refresh Data'}
              </Text>
            </TouchableOpacity>
            {loadingMaster && (
              <ActivityIndicator
                size="small"
                color="#4F46E5"
                style={{marginTop: 10}}
              />
            )}

            <View
              style={[
                styles.statusContainer,
                {backgroundColor: isConnected ? '#dcfce7' : '#fee2e2'},
              ]}>
              <View
                style={[
                  styles.statusIndicator,
                  {backgroundColor: isConnected ? '#22c55e' : '#ef4444'},
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {color: isConnected ? '#166534' : '#991b1b'},
                ]}>
                {isConnected ? 'Online' : 'Offline'}
                {syncing && isConnected ? ' • Sinkronisasi...' : ''}
              </Text>
            </View>
          </View>

          {/* CARD: Informasi Unit */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Unit</Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text style={styles.label}>No. Unit</Text>
              <Text style={{color: 'red'}}>Ex: DHLVxxxx</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="No Unit Ex: DHLVxxxx"
              value={nounit}
              onChangeText={setNoUnit}
            />
            <Text style={styles.label}>Model Unit</Text>
            <RNPickerSelect
              placeholder={{label: 'Pilih Model', value: ''}}
              value={model}
              onValueChange={setModel}
              items={
                Array.isArray(modelList)
                  ? modelList.map(m => ({
                      label: m.value || m.desc || m.label,
                      value: m.value || m.desc || m.value,
                      key: String(m.id || m.desc || m.value),
                    }))
                  : []
              }
              style={{
                inputIOS: {...styles.input, color: '#111'},
                inputAndroid: {...styles.input, color: '#111'},
                placeholder: {...styles.input, color: '#aaa'},
              }}
            />
            {modelList.length === 0 && (
              <Text style={{color: 'red', marginBottom: 10}}>
                Belum ada data model. Silakan refresh data.
              </Text>
            )}
            <Text style={styles.label}>HM</Text>
            <TextInput
              style={styles.input}
              placeholder="HM"
              value={KM}
              keyboardType="numeric"
              onChangeText={setKM}
            />
          </View>

          {/* CARD: Lokasi dan Departemen */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lokasi & Departemen</Text>
            <Text style={styles.label}>Site</Text>
            <View style={[styles.input, {backgroundColor: '#f4f4f4'}]}>
              <Text>{site ? site : '-'}</Text>
            </View>
            <Text style={styles.label}>Section</Text>
            <TextInput
              style={styles.input}
              placeholder="Section"
              value={section}
              onChangeText={setSection}
            />
            <Text style={styles.label}>Departemen</Text>
            <RNPickerSelect
              placeholder={{label: 'Pilih Departemen', value: ''}}
              value={dept}
              onValueChange={setDept}
              items={
                Array.isArray(deptList)
                  ? deptList.map(d => ({
                      label: d.department_name,
                      value: d.id || d.value,
                      key: String(d.id || d.value),
                    }))
                  : []
              }
              style={{
                inputIOS: {...styles.input, color: '#111'},
                inputAndroid: {...styles.input, color: '#111'},
                placeholder: {...styles.input, color: '#aaa'},
              }}
            />
            {deptList.length === 0 && (
              <Text style={{color: 'red', marginBottom: 10}}>
                Belum ada departemen. Silakan refresh data.
              </Text>
            )}
          </View>

          {/* CARD: Checklist Pemeriksaan */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Checklist Pemeriksaan</Text>
            {checklistQuestions.length === 0 && (
              <Text style={{color: 'red', marginBottom: 10}}>
                Belum ada pertanyaan. Silakan refresh data.
              </Text>
            )}
            {checklistQuestions.map(q => (
              <View key={q.id} style={styles.checklistCard}>
                <Text style={{fontWeight: '600', marginBottom: 7}}>
                  {q.pertanyaan || q.question || q.label}
                </Text>
                <View style={styles.radioRow}>
                  {checklistOptions.map(opt => (
                    <TouchableOpacity
                      key={q.id + '-' + opt}
                      onPress={() => handleChangeChecklist(q.id, opt)}
                      style={styles.radioTouchable}
                      activeOpacity={0.8}>
                      <View
                        style={[
                          styles.radioOuter,
                          inlineRadioOptions[q.id] === opt &&
                            styles.radioOuterActive,
                        ]}>
                        {inlineRadioOptions[q.id] === opt && (
                          <View style={styles.radioInnerFullBlue} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          inlineRadioOptions[q.id] === opt &&
                            styles.radioLabelActive,
                        ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* CARD: Stiker Khusus */}
          {(stickerCommissioningQ || stickerFuelPermitQ) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Stiker Khusus</Text>
              {stickerCommissioningQ && (
                <View style={{marginBottom: 16}}>
                  <Text style={styles.label}>
                    {stickerCommissioningQ.pertanyaan}
                  </Text>
                  <View style={{flexDirection: 'row', gap: 16}}>
                    {['Berlaku', 'Tidak Berlaku'].map(opt => (
                      <TouchableOpacity
                        key={'stickerCommissioning-' + opt}
                        onPress={() => setStickerCommissioning(opt)}
                        style={[
                          styles.radioButton2,
                          stickerCommissioning === opt &&
                            styles.radioButton2Active,
                        ]}>
                        <Text
                          style={[
                            styles.radioText2,
                            stickerCommissioning === opt &&
                              styles.radioText2Active,
                          ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {stickerFuelPermitQ && (
                <View style={{marginBottom: 16}}>
                  <Text style={styles.label}>
                    {stickerFuelPermitQ.pertanyaan}
                  </Text>
                  <View style={{flexDirection: 'row', gap: 16}}>
                    {['Berlaku', 'Tidak Berlaku'].map(opt => (
                      <TouchableOpacity
                        key={'stickerFuel-' + opt}
                        onPress={() => setStickerFuelPermit(opt)}
                        style={[
                          styles.radioButton2,
                          stickerFuelPermit === opt &&
                            styles.radioButton2Active,
                        ]}>
                        <Text
                          style={[
                            styles.radioText2,
                            stickerFuelPermit === opt &&
                              styles.radioText2Active,
                          ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* CARD: Lainnya */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lainnya</Text>

            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={[styles.input, {height: 60}]}
              placeholder="Keterangan"
              value={keterangan}
              onChangeText={setKeterangan}
              multiline
            />
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Kirim P2H</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CreateP2HScreen;
