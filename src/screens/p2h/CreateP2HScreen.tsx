import React, {useState, useEffect, useCallback} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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

import {
  addQueueOffline,
  pushOfflineQueue,
  getOfflineQueueCount,
  clearOfflineQueue,
} from '../../utils/offlineQueueHelper';

const checklistOptions = ['Baik', 'Tidak Baik', 'N/A'];
const DRAFT_KEY = 'draft_p2h_form';
const OFFLINE_SUBMIT_KEY = 'offline_submit_p2h';
const API_ENDPOINT = '/StoreP2H';

const CreateP2HScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();

  // Dropdown master state
  const [modelList, setModelList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [deptList, setDeptList] = useState([]);
  const [jam, setJam] = useState(dayjs().format('HH:mm'));
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // Form state
  const [nounit, setNoUnit] = useState('');
  const [model, setModel] = useState('');
  const [KM, setKM] = useState('');
  const [section, setSection] = useState('');
  const [dept, setDept] = useState('');
  const [site, setSite] = useState('');
  const [tanggal, setTanggal] = useState(dayjs().format('YYYY-MM-DD'));
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);

  const [stickerCommissioning, setStickerCommissioning] = useState('Berlaku');
  const [stickerFuelPermit, setStickerFuelPermit] = useState('Berlaku');

  // Pertanyaan
  const stickerCommissioningQ = questionList.find(q => String(q.id) === '27');
  const stickerFuelPermitQ = questionList.find(q => String(q.id) === '28');
  const checklistQuestions = questionList.filter(
    q => String(q.id) !== '27' && String(q.id) !== '28',
  );
  const [inlineRadioOptions, setInlineRadioOptions] = useState({});

  const [isConnected, setIsConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // Restore draft saat mount
  useEffect(() => {
    const restoreDraft = async () => {
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
          setTanggal(data.tanggal || dayjs().format('YYYY-MM-DD'));
          setKeterangan(data.keterangan || '');
          setInlineRadioOptions(data.inlineRadioOptions || {});
          setStickerCommissioning(data.stickerCommissioning || 'Berlaku');
          setStickerFuelPermit(data.stickerFuelPermit || 'Berlaku');
        } catch {}
      }
    };
    restoreDraft();
  }, []);

  // Load offline queue count
  const refreshQueueCount = useCallback(async () => {
    const count = await getOfflineQueueCount(OFFLINE_SUBMIT_KEY);
    setQueueCount(count);
  }, []);

  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount]);

  // Auto push queue ketika online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
      if (state.isConnected) {
        setSyncing(true);
        pushOfflineQueue(
          OFFLINE_SUBMIT_KEY,
          '/StoreP2H',
          undefined,
          API_BASE_URL.p2h, // <<< PENTING: agar ke endpoint P2H, bukan mop!
        ).then(() => {
          refreshQueueCount();
          setSyncing(false);
        });
      }
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, [refreshQueueCount]);

  // Fetch master data
  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMaster(true);
      try {
        const m = await AsyncStorage.getItem('master_model');
        setModelList(Array.isArray(JSON.parse(m)) ? JSON.parse(m) : []);
        const q = await AsyncStorage.getItem('master_questions');
        setQuestionList(Array.isArray(JSON.parse(q)) ? JSON.parse(q) : []);
        const d = await AsyncStorage.getItem('master_dept');
        setDeptList(Array.isArray(JSON.parse(d)) ? JSON.parse(d) : []);

        // Auto set dept/model/site dari user login (jika kosong & belum diisi draft)
        const loginCache = await AsyncStorage.getItem('loginCache');
        if (loginCache) {
          const cache = JSON.parse(loginCache);
          const userDeptName = cache.dataEmp?.dept;
          if (!site) setSite(cache.dataEmp?.site || activeSite || '');
          if (!model) setModel(cache.dataEmp?.model || '');
          if (!dept) {
            const deptObj = (
              Array.isArray(JSON.parse(d)) ? JSON.parse(d) : []
            ).find(
              item =>
                item.dept_name === userDeptName ||
                item.nama === userDeptName ||
                item.label === userDeptName,
            );
            setDept(deptObj?.id || '');
          }
        }
        setInlineRadioOptions(obj =>
          Object.keys(obj).length
            ? obj
            : (Array.isArray(JSON.parse(q)) ? JSON.parse(q) : [])
                .filter(q => String(q.id) !== '27' && String(q.id) !== '28')
                .reduce((acc, q) => ({...acc, [q.id]: ''}), {}),
        );
      } catch {
        setModelList([]);
        setQuestionList([]);
        setDeptList([]);
        setDept('');
      }
      setLoadingMaster(false);
    };
    fetchMasters();
  }, [activeSite]);

  // Save draft ke cache setiap ada perubahan isian
  useEffect(() => {
    const saveDraft = async () => {
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
      };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    };
    saveDraft();
  }, [
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

  const resetForm = () => {
    setNoUnit('');
    setModel('');
    setKM('');
    setSection('');
    setDept('');
    setSite('');
    setTanggal(dayjs().format('YYYY-MM-DD'));
    setJam(dayjs().format('HH:mm'));
    setKeterangan('');
    setInlineRadioOptions({});
    setStickerCommissioning('Berlaku');
    setStickerFuelPermit('Berlaku');
  };

  // Hapus draft
  const removeDraft = async () => {
    await AsyncStorage.removeItem(DRAFT_KEY);
  };

  function isFormValid() {
    if (!nounit) return 'No. Unit wajib diisi!';
    if (!model) return 'Model Unit wajib dipilih!';
    if (!KM) return 'HM wajib diisi!';
    if (!section) return 'Section wajib diisi!';
    if (!site) return 'Site wajib diisi!';
    if (!dept) return 'Departemen wajib dipilih!';
    if (
      checklistQuestions.length > 0 &&
      checklistQuestions.some(q => !inlineRadioOptions[q.id])
    ) {
      return 'Semua checklist wajib diisi!';
    }
    if (!stickerCommissioning) return 'Stiker Commisioning wajib dipilih!';
    if (!stickerFuelPermit) return 'Stiker Fuel Permit wajib dipilih!';
    return '';
  }

  // Change checklist
  const handleChangeChecklist = useCallback((id, value) => {
    setInlineRadioOptions(prev => ({...prev, [id]: value}));
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
      if (state.isConnected) {
        setSyncing(true);
        pushOfflineQueue(
          OFFLINE_SUBMIT_KEY,
          '/StoreP2H',
          undefined,
          API_BASE_URL.p2h, // <<< PENTING: agar ke endpoint P2H, bukan mop!
        ).then(sent => {
          refreshQueueCount();
          setSyncing(false);
          if (sent === 0) {
            getOfflineQueueCount(OFFLINE_SUBMIT_KEY).then(cnt => {
              if (cnt > 0) {
                Alert.alert(
                  'Gagal Sync',
                  `${cnt} data gagal dikirim, cek koneksi atau hubungi admin. Data akan dicoba otomatis lagi saat online.`,
                );
              }
            });
          }
        });
      }
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, [refreshQueueCount]);

  // SUBMIT
  const handleSubmit = async () => {
    const errorMsg = isFormValid();
    if (errorMsg) {
      Alert.alert('Validasi', errorMsg);
      return;
    }
    setLoading(true);

    const jawabanChecklist = checklistQuestions.map(
      q => `${q.id}-${inlineRadioOptions[q.id] || ''}`,
    );

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
      tanggal: `${tanggal} ${jam}`,
      keterangan,
      // id_local: akan otomatis dibuat di addQueueOffline
    };
    // Cek koneksi
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      await addQueueOffline(OFFLINE_SUBMIT_KEY, payload);
      await refreshQueueCount();
      setLoading(false);
      await removeDraft();
      resetForm();
      Alert.alert(
        'Offline',
        'Data disimpan ke antrian offline. Akan dikirim otomatis saat online!',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('P2HHistory'),
          },
        ],
      );
      return;
    }
    // Kirim online seperti biasa
    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      const token = loginCache ? JSON.parse(loginCache).token : null;

      const response = await fetch(`${API_BASE_URL.p2h}/StoreP2H`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok && data.status === true) {
        await removeDraft();
        resetForm();
        // Tambahkan di sini:
        if (isConnected) {
          setSyncing(true);
          await pushOfflineQueue(
            OFFLINE_SUBMIT_KEY, // Key queue P2H kamu
            '/StoreP2H', // endpoint service P2H
            undefined, // progress callback (optional, bisa null/undefined)
            API_BASE_URL.p2h, // <<< wajib isi baseUrl ini agar ke endpoint P2H
          );
          await refreshQueueCount();
          setSyncing(false);
        }
        Alert.alert('Sukses', data.message || 'P2H berhasil disimpan!', [
          {
            text: 'OK',
            onPress: () => navigation.replace('P2HHistory'),
          },
        ]);
        pushOfflineQueue(
          OFFLINE_SUBMIT_KEY,
          '/StoreP2H',
          undefined,
          API_BASE_URL.p2h, // <<< PENTING: agar ke endpoint P2H, bukan mop!
        ).then(successCount => {
          console.log('Offline queue synced! Data terkirim:', successCount);
          refreshQueueCount();
          setSyncing(false);
        });
      } else {
        Alert.alert('Gagal', data.message || 'Gagal mengirim data!');
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Gagal mengirim data. Periksa koneksi atau server!');
    }
  };

  if (loadingMaster) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{marginTop: 12}}>Memuat data master...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
        <ScrollView contentContainerStyle={{paddingBottom: 30}}>
          <Text style={styles.title}>Form Pemeriksaan P2H</Text>
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
                      API_BASE_URL.p2h, // <<< PENTING: agar ke endpoint P2H, bukan mop!
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

          <View style={{padding: 1, alignItems: 'center'}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 6,
                backgroundColor: isConnected ? '#dcfce7' : '#fee2e2',
                borderRadius: 12,
                marginBottom: 8,
              }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: isConnected ? '#22c55e' : '#ef4444',
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  color: isConnected ? '#166534' : '#991b1b',
                  fontWeight: '600',
                }}>
                {isConnected ? 'Online' : 'Offline'}
                {syncing && isConnected ? ' • Sinkronisasi...' : ''}
              </Text>
            </View>
          </View>
          {/* CARD: Informasi Unit */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Unit</Text>
            <Text style={styles.label}>No. Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="No Unit"
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
                Belum ada data model. Silakan refresh master.
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
                Belum ada departemen. Silakan refresh master.
              </Text>
            )}
          </View>

          {/* CARD: Checklist Pemeriksaan */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Checklist Pemeriksaan</Text>
            {checklistQuestions.length === 0 && (
              <Text style={{color: 'red', marginBottom: 10}}>
                Belum ada pertanyaan. Silakan refresh master.
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

            {/* DATE PICKER */}
            <Text style={styles.label}>Tanggal</Text>
            <TouchableOpacity
              style={[styles.input, {justifyContent: 'center'}]}
              onPress={() => setShowDate(true)}>
              <Text>{tanggal}</Text>
            </TouchableOpacity>
            {showDate && (
              <DateTimePicker
                value={dayjs(tanggal).toDate()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDate(false);
                  if (selectedDate) {
                    setTanggal(dayjs(selectedDate).format('YYYY-MM-DD'));
                  }
                }}
              />
            )}

            {/* TIME PICKER */}
            <Text style={styles.label}>Jam</Text>
            <TouchableOpacity
              style={[styles.input, {justifyContent: 'center'}]}
              onPress={() => setShowTime(true)}>
              <Text>{jam}</Text>
            </TouchableOpacity>
            {showTime && (
              <DateTimePicker
                value={dayjs(jam, 'HH:mm').toDate()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTime(false);
                  if (selectedTime) {
                    setJam(dayjs(selectedTime).format('HH:mm'));
                  }
                }}
              />
            )}

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
