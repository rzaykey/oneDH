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
  Platform,
  Switch,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import dayjs from 'dayjs';

const OFFLINE_SUBMIT_KEY = 'offline_submit_eas_present';

const CreatePresentAESScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();

  // === State untuk isian form ===
  const [site, setSite] = useState('');
  const [dept, setDept] = useState('');
  const [title, setTitle] = useState('');
  const [remark, setRemark] = useState('');
  const [namePresenter, setNamePresenter] = useState('');
  const [company, setCompany] = useState(user?.company || '');
  const [position, setPosition] = useState(user?.position || '');
  const [namaPemateri, setNamaPemateri] = useState('');
  const [dateStart, setDateStart] = useState(new Date());
  const [dateFinish, setDateFinish] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [deptList, setDeptList] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [useManualInput, setUseManualInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [siteList, setSiteList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [fidCategory, setFidCategory] = useState('1'); // default kategori

  const getAuthHeader = async () => {
    const cache = await AsyncStorage.getItem('loginCache');
    const token = cache && JSON.parse(cache)?.token;
    if (!token) throw new Error('Token tidak ditemukan!');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
  const fetchMasters = async (forceRefresh = false) => {
    setLoadingMaster(true);

    try {
      const [deptCache, siteCache, categoryCache] = await Promise.all([
        AsyncStorage.getItem('master_dept'),
        AsyncStorage.getItem('master_site'),
        AsyncStorage.getItem('master_category'),
      ]);

      const hasCache =
        deptCache &&
        siteCache &&
        categoryCache &&
        JSON.parse(deptCache).length > 0 &&
        JSON.parse(siteCache).length > 0 &&
        JSON.parse(categoryCache).length > 0;

      if (hasCache && !forceRefresh) {
        setDeptList(JSON.parse(deptCache));
        setSiteList(JSON.parse(siteCache));
        setCategoryList(JSON.parse(categoryCache));
        Toast.show({
          type: 'info',
          text1: 'Data Master',
          text2: 'Menggunakan data lokal dari cache.',
          position: 'top',
        });
        setLoadingMaster(false);
        return;
      }

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        Toast.show({
          type: 'error',
          text1: 'Offline',
          text2: 'Tidak dapat memuat ulang. Gunakan data lokal.',
          position: 'top',
        });

        setDeptList(deptCache ? JSON.parse(deptCache) : []);
        setSiteList(siteCache ? JSON.parse(siteCache) : []);
        setCategoryList(categoryCache ? JSON.parse(categoryCache) : []);
        setLoadingMaster(false);
        return;
      }

      const headers = await getAuthHeader();

      const [deptRes, siteRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL.onedh}/GetDept`, {headers}),
        fetch(`${API_BASE_URL.onedh}/GetSite`, {headers}),
        fetch(`${API_BASE_URL.onedh}/GetCategory`, {headers}),
      ]);

      const deptJson = await deptRes.json();
      const siteJson = await siteRes.json();
      const catJson = await catRes.json();

      const deptData = Array.isArray(deptJson.data) ? deptJson.data : [];
      const siteData = Array.isArray(siteJson.data) ? siteJson.data : [];
      const catData = Array.isArray(catJson.data) ? catJson.data : [];

      await AsyncStorage.setItem('master_dept', JSON.stringify(deptData));
      await AsyncStorage.setItem('master_site', JSON.stringify(siteData));
      await AsyncStorage.setItem('master_category', JSON.stringify(catData));

      setDeptList(deptData);
      setSiteList(siteData);
      setCategoryList(catData);
      Toast.show({
        type: 'success',
        text1: 'Master Diperbarui',
        text2: 'Berhasil ambil data dari server.',
        position: 'top',
      });
    } catch (err) {
      console.error('❌ fetchMasters error:', err);
      setDeptList([]);
      setSiteList([]);
      setCategoryList([]);
      Toast.show({
        type: 'error',
        text1: 'Gagal Memuat Data',
        text2: 'Terjadi kesalahan saat ambil master data.',
        position: 'top',
      });
    }

    setLoadingMaster(false);
  };
  // ==== 2. Fetch master data ====
  useEffect(() => {
    fetchMasters();
  }, []); // <== tambahkan ini

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
          '/CreateAgenda',
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

  // ==== 7. Validasi form ====
  function isFormValid() {
    const now = dayjs();
    const start = dayjs(dateStart);
    const finish = dayjs(dateFinish);
    if (!site || !dept || !title || !dateStart || !dateFinish) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Lengkapi semua field wajib!',
      });
      return false;
    } // Cek apakah dateStart atau dateFinish terlalu dekat dengan waktu saat ini (belum dipilih)
    if (start.diff(now, 'minute') >= -1 && start.diff(now, 'minute') <= 1) {
      Alert.alert('Validasi Gagal', 'Tanggal dan jam mulai belum dipilih.');
      return;
    }

    if (finish.diff(now, 'minute') >= -1 && finish.diff(now, 'minute') <= 1) {
      Alert.alert('Validasi Gagal', 'Tanggal dan jam selesai belum dipilih.');
      return;
    }

    // Cek urutan tanggal
    if (finish.isBefore(start)) {
      Alert.alert(
        'Validasi Gagal',
        'Tanggal selesai tidak boleh sebelum tanggal mulai.',
      );
      return;
    }
    return true;
  }

  // ==== 9. Submit ====
  const handleSubmit = async () => {
    if (!isFormValid()) {
      return;
    }

    setLoading(true);

    const payload = {
      jdeno: user?.jdeno || '',
      name_presenter: user?.name || '',
      nama_pemateri: user?.name || '',
      company: company,
      positon: position,
      fid_site: site,
      fid_category: fidCategory,
      tittle: title,
      datestart: dateStart,
      datefinish: dateFinish,
      remark: remark,
      device_info: `(${DeviceInfo.getSystemName()})(${DeviceInfo.getVersion()})`,
      dept: dept,
    };
    console.log(payload);

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      await addQueueOffline(OFFLINE_SUBMIT_KEY, payload);
      await refreshQueueCount();
      setLoading(false);

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
      // const token = loginCache ? JSON.parse(loginCache).token : null;

      // const response = await fetch(`${API_BASE_URL.onedh}/CreateAgenda`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(payload),
      // });

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
        if (netState.isConnected) {
          setSyncing(true);
          await pushOfflineQueue(
            OFFLINE_SUBMIT_KEY,
            '/CreateAgenda',
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
      console.log('🗂 Offline Queue:', parsed);
      Alert.alert('Offline Queue', JSON.stringify(parsed, null, 2));
    } else {
      console.log('🟢 Queue kosong');
      Alert.alert('Queue kosong');
    }
  };

  const clearOfflineQueue = async () => {
    const existing = await AsyncStorage.getItem(OFFLINE_SUBMIT_KEY);
    if (existing) {
      await AsyncStorage.removeItem(OFFLINE_SUBMIT_KEY);
      console.log('🧹 Offline queue cleared.');
      Alert.alert('Sukses', 'Offline queue telah dibersihkan.');
    } else {
      console.log('⚠️ Tidak ada data untuk dihapus.');
      Alert.alert('Tidak Ada Data', 'Queue sudah kosong.');
    }
  };

  useEffect(() => {
    if (!useManualInput) {
      setNamaPemateri(user?.name || '');
      setCompany(user?.company || '');
      setPosition(user?.position || '');
    }
  }, [user, useManualInput]);

  const handleToggle = (value: boolean) => {
    setUseManualInput(value);
    if (value) {
      setNamaPemateri('');
      setCompany('');
      setPosition('');
    } else {
      setNamaPemateri(user?.name || '');
      setCompany(user?.company || '');
      setPosition(user?.position || '');
    }
  };

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{paddingBottom: 30}}>
          <Text style={styles.title}>Form Pengisian Agenda</Text>

          {/* Tombol Cek Queue */}
          <View style={{marginVertical: 10}}>
            <Button
              title="Tampilkan Offline Queue"
              onPress={showOfflineQueue}
            />
            <View style={{height: 10}} />
            <Button
              title="Hapus Offline Queue"
              color="red"
              onPress={clearOfflineQueue}
            />
          </View>

          {/* BADGE QUEUE */}
          {queueCount > 0 && (
            <View
              style={{
                backgroundColor: '#e74c3c',
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
                      '/StoCreateAgendareP2H',
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

          {/* HEADER STATUS */}
          <View style={styles.rowContainer}>
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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Presenter</Text>

            <Text style={styles.label}>JDE No</Text>
            <TextInput
              style={[styles.input, {backgroundColor: '#f1f5f9'}]}
              value={user?.jdeno || ''}
              editable={false}
            />
            <Text style={styles.label}>Nama Presenter</Text>
            <TextInput
              style={[styles.input, {backgroundColor: '#f1f5f9'}]}
              value={user?.name || ''}
              editable={false}
            />
            {/* Switch untuk memilih mode input */}
            <View style={styles.switchRow}>
              <Text style={styles.labelSwitch}>
                Input manual data pemateri ??{' '}
              </Text>
              <Switch value={useManualInput} onValueChange={handleToggle} />
            </View>

            {/* Nama Pemateri */}
            <Text style={styles.label}>Nama Pemateri</Text>
            <TextInput
              style={[styles.input, {color: '#000'}]}
              value={namaPemateri}
              onChangeText={setNamaPemateri}
              editable={useManualInput}
            />

            <Text style={styles.label}>Perusahaan</Text>
            <TextInput
              style={[styles.input, {color: '#000'}]}
              value={company}
              onChangeText={setCompany}
              editable={useManualInput}
            />

            <Text style={styles.label}>Jabatan / Posisi</Text>
            <TextInput
              style={[styles.input, {color: '#000'}]}
              value={position}
              onChangeText={setPosition}
              editable={useManualInput}
            />
          </View>

          {/* CARD: Lokasi & Departemen */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Data Agenda / Kegiatan</Text>

            {/* Title */}
            <Text style={styles.label}>Judul / Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Judul kegiatan"
              value={title}
              onChangeText={setTitle}
            />

            {/* Kategori */}
            <Text style={styles.label}>Jenis Kegiatan</Text>
            <RNPickerSelect
              placeholder={{label: 'Pilih Kategori', value: ''}}
              value={fidCategory}
              onValueChange={setFidCategory}
              items={
                Array.isArray(categoryList)
                  ? categoryList.map(c => ({
                      label: c.name,
                      value: c.id,
                      key: String(c.id),
                    }))
                  : []
              }
              style={{
                inputIOS: {...styles.input, color: '#111'},
                inputAndroid: {...styles.input, color: '#111'},
                placeholder: {...styles.input, color: '#aaa'},
              }}
            />
          </View>

          {/* CARD: Info Lainnya */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Tambahan</Text>
            <Text style={styles.label}>Departemen</Text>
            <RNPickerSelect
              placeholder={{label: 'Pilih Departemen', value: ''}}
              value={dept}
              onValueChange={setDept}
              items={
                Array.isArray(deptList)
                  ? deptList.map(d => ({
                      label: d.department_name,
                      value: d.department_name,
                      key: String(d.department_name),
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
            {/* Site */}
            <Text style={styles.label}>Site</Text>
            <RNPickerSelect
              placeholder={{label: 'Pilih Site', value: ''}}
              value={site}
              onValueChange={setSite}
              items={
                Array.isArray(siteList)
                  ? siteList.map(s => ({
                      label: s.code,
                      value: s.code,
                      key: String(s.code),
                    }))
                  : []
              }
              style={{
                inputIOS: {...styles.input, color: '#111'},
                inputAndroid: {...styles.input, color: '#111'},
                placeholder: {...styles.input, color: '#aaa'},
              }}
            />

            {/* Tanggal Mulai */}
            <Text style={styles.label}>Tanggal Mulai</Text>
            <View style={styles.row}>
              {/* Tanggal Mulai */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tanggal:</Text>
                <Button
                  title={dayjs(dateStart).format('YYYY-MM-DD')}
                  onPress={() => setShowStartDatePicker(true)}
                />
                {showStartDatePicker && (
                  <DateTimePicker
                    value={dayjs(dateStart, 'YYYY-MM-DD HH:mm:ss').toDate()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (event?.type === 'set' && selectedDate) {
                        const time = dayjs(dateStart).format('HH:mm:ss');
                        setDateStart(
                          dayjs(selectedDate).format(`YYYY-MM-DD ${time}`),
                        );
                      }
                    }}
                  />
                )}
              </View>

              {/* Jam Mulai */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jam:</Text>
                <Button
                  title={dayjs(dateStart).format('HH:mm:ss')}
                  onPress={() => setShowStartTimePicker(true)}
                />
                {showStartTimePicker && (
                  <DateTimePicker
                    value={dayjs(dateStart, 'YYYY-MM-DD HH:mm:ss').toDate()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowStartTimePicker(false);
                      if (event?.type === 'set' && selectedTime) {
                        const date = dayjs(dateStart).format('YYYY-MM-DD');
                        setDateStart(
                          dayjs(
                            `${date} ${dayjs(selectedTime).format('HH:mm:ss')}`,
                          ).format('YYYY-MM-DD HH:mm:ss'),
                        );
                      }
                    }}
                  />
                )}
              </View>
            </View>

            {/* Tanggal Selesai */}
            <Text style={styles.label}>Tanggal Selesai</Text>
            <View style={styles.row}>
              {/* Tanggal Selesai */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tanggal:</Text>
                <Button
                  title={dayjs(dateFinish).format('YYYY-MM-DD')}
                  onPress={() => setShowEndDatePicker(true)}
                />
                {showEndDatePicker && (
                  <DateTimePicker
                    value={dayjs(dateFinish, 'YYYY-MM-DD HH:mm:ss').toDate()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (event?.type === 'set' && selectedDate) {
                        const time = dayjs(dateFinish).format('HH:mm:ss');
                        setDateFinish(
                          dayjs(selectedDate).format(`YYYY-MM-DD ${time}`),
                        );
                      }
                    }}
                  />
                )}
              </View>

              {/* Jam Selesai */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jam:</Text>
                <Button
                  title={dayjs(dateFinish).format('HH:mm:ss')}
                  onPress={() => setShowEndTimePicker(true)}
                />
                {showEndTimePicker && (
                  <DateTimePicker
                    value={dayjs(dateFinish, 'YYYY-MM-DD HH:mm:ss').toDate()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowEndTimePicker(false);
                      if (event?.type === 'set' && selectedTime) {
                        const date = dayjs(dateFinish).format('YYYY-MM-DD');
                        setDateFinish(
                          dayjs(
                            `${date} ${dayjs(selectedTime).format('HH:mm:ss')}`,
                          ).format('YYYY-MM-DD HH:mm:ss'),
                        );
                      }
                    }}
                  />
                )}
              </View>
            </View>

            {/* Keterangan */}
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={[styles.input, {height: 60}]}
              placeholder="Keterangan"
              value={remark}
              onChangeText={setRemark}
              multiline
            />
          </View>

          {/* Submit Button */}
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

export default CreatePresentAESScreen;
