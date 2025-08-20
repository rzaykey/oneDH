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
import {createP2HStyles as styles} from '../../styles/createP2HStyles';
import {useSiteContext} from '../../context/SiteContext';
import API_BASE_URL from '../../config';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';
import {
  addQueueOffline,
  pushOfflineQueue,
  getOfflineQueueCount,
} from '../../utils/offlineQueueHelper';
import ShowOfflineQueueModalScreen from '../aes/ShowOfflineQueueModalScreen';

const OFFLINE_SUBMIT_KEY = 'offline_submit_aes_guest';

const CreateGuestScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();
  const [showModal, setShowModal] = useState(false);

  // === State untuk isian form ===
  const [keterangan, setKeterangan] = useState('');
  const [code_agenda, setCodeAgenda] = useState('');
  const [company, setCompany] = useState(user?.company || '');
  const [position, setPosition] = useState(user?.position || '');
  const [dept, setDept] = useState(user?.dept || '');
  const [site, setSite] = useState(user?.site || '');

  // === Lainnya ===
  const [isConnected, setIsConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // ====  Load offline queue count, push offline queue dsb ====
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
          '/SubmitCodeAgenda',
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
    if (!code_agenda) {
      Toast.show({
        type: 'error',
        text1: 'Validasi Gagal',
        text2: 'Code wajib diisi!',
      });
      return false;
    }
    return true;
  }

  // ==== 9. Submit ====
  const handleSubmit = async () => {
    if (!isFormValid()) {
      return;
    }

    setLoading(true);

    const brand = DeviceInfo.getBrand();
    const modelDevice = DeviceInfo.getModel();
    const systemName = DeviceInfo.getSystemName();
    const systemVersion = DeviceInfo.getSystemVersion();
    const version = DeviceInfo.getVersion();
    const build = DeviceInfo.getBuildNumber();

    const fullInfo = `${brand} ${modelDevice} - ${systemName} ${systemVersion} - ${version} ${build}`;

    const payload = {
      fid_guest: user?.jdeno || '',
      name_guest: user?.name || '',
      position: position,
      department: dept,
      company: company,
      remark: keterangan,
      code_agenda,
      device_info: fullInfo,
    };
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
      navigation.replace('GuestAESMyHistory');
      return;
    }

    // Online submit
    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      const token = loginCache ? JSON.parse(loginCache).token : null;

      const response = await fetch(`${API_BASE_URL.onedh}/SubmitCodeAgenda`, {
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

      if (data?.status === true) {
        // Lakukan sync jika online
        if (netState.isConnected) {
          setSyncing(true);
          await pushOfflineQueue(
            OFFLINE_SUBMIT_KEY,
            '/SubmitCodeAgenda',
            undefined,
            API_BASE_URL.onedh,
          );
          await refreshQueueCount();
          setSyncing(false);
        }

        // Tampilkan Toast
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: `${
            data.notif || data.message || 'Event berhasil disimpan!'
          } (Kode: ${data.code || '-'})`,
          position: 'top',
          visibilityTime: 3000,
          topOffset: 40,
        });

        navigation.replace('GuestAESMyHistory');
      } else {
        // server balas error atau parsing JSON gagal
        await addQueueOffline(OFFLINE_SUBMIT_KEY, payload);
        await refreshQueueCount();
        Toast.show({
          type: 'error',
          text1: 'Gagal Menyimpan Agenda',
          text2: data?.notif || data?.message || 'Terjadi kesalahan.',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 40,
        });
        navigation.replace('GuestAESMyHistory');
      }
    } catch (err) {
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

      navigation.replace('GuestAESMyHistory');
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

  const clearOfflineQueue = async () => {
    const existing = await AsyncStorage.getItem(OFFLINE_SUBMIT_KEY);
    if (existing) {
      await AsyncStorage.removeItem(OFFLINE_SUBMIT_KEY);
      Alert.alert('Sukses', 'Offline queue telah dibersihkan.');
    } else {
      Alert.alert('Tidak Ada Data', 'Queue sudah kosong.');
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
          <Text style={styles.title}>Form Attendance Guest</Text>

          {/* <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              padding: 10,
              backgroundColor: '#2980b9',
              borderRadius: 10,
              marginBottom: 10,
            }}>
            <Text style={{color: '#fff'}}>Lihat Data Offline</Text>
          </TouchableOpacity> */}

          {queueCount > 0 && (
            <View style={{marginVertical: 10}}>
              {/* <Button
                title="Tampilkan Offline Queue"
                onPress={showOfflineQueue}
              /> */}
              <View style={{height: 10}} />
              <Button
                title="Hapus Offline Queue"
                color="red"
                onPress={clearOfflineQueue}
              />
            </View>
          )}

          <ShowOfflineQueueModalScreen
            visible={showModal}
            onClose={() => setShowModal(false)}
            queueKey={OFFLINE_SUBMIT_KEY}
          />

          {/* Badge Queue */}
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
                      '/SubmitCodeAgenda',
                      undefined,
                      API_BASE_URL.onedh,
                    );
                    await refreshQueueCount();
                    setSyncing(false);

                    if (sent === 1) {
                      Toast.show({
                        type: 'success',
                        text1: 'Sukses',
                        text2: `${sent} data berhasil dikirim ke server.`,
                        position: 'top',
                        visibilityTime: 3000,
                        topOffset: 40,
                      });
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

          {loading && (
            <ActivityIndicator
              size="small"
              color="#4F46E5"
              style={{marginTop: 10}}
            />
          )}

          {/* Status Koneksi */}
          <View style={styles.rowContainer}>
            <View
              style={[
                styles.statusContainer,
                {
                  backgroundColor: isConnected ? '#dcfce7' : '#fee2e2',
                },
              ]}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: isConnected ? '#22c55e' : '#ef4444',
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isConnected ? '#166534' : '#991b1b',
                  },
                ]}>
                {isConnected ? 'Online' : 'Offline'}
                {syncing && isConnected ? ' • Sinkronisasi...' : ''}
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Code Event</Text>
            <Text style={styles.label}>Code Event</Text>
            <TextInput
              style={[styles.input, {height: 60}]}
              placeholder="Code"
              value={code_agenda}
              onChangeText={setCodeAgenda}
              multiline
            />
          </View>

          {/* Card Informasi Pribadi */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informasi Pribadi</Text>
            <Text style={styles.label}>Nama</Text>
            <View style={[styles.input, {backgroundColor: '#f4f4f4'}]}>
              <Text>{company || '-'}</Text>
            </View>
            <Text style={styles.label}>Jde</Text>
            <View style={[styles.input, {backgroundColor: '#f4f4f4'}]}>
              <Text>{site || '-'}</Text>
            </View>
          </View>

          {/* Lokasi & Departemen */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lokasi & Departemen</Text>
            <Text style={styles.label}>Company</Text>
            <View style={[styles.input, {backgroundColor: '#f4f4f4'}]}>
              <Text>{company || '-'}</Text>
            </View>
            <Text style={styles.label}>Site</Text>
            <View style={[styles.input, {backgroundColor: '#f4f4f4'}]}>
              <Text>{site || '-'}</Text>
            </View>
            <Text style={styles.label}>Departement</Text>
            <View style={[styles.input, {backgroundColor: '#f4f4f4'}]}>
              <Text>{dept || '-'}</Text>
            </View>
            <Text style={styles.label}>Position</Text>
            <View style={[styles.input, {backgroundColor: '#f4f4f4'}]}>
              <Text>{position || '-'}</Text>
            </View>
          </View>

          {/* Keterangan */}
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

          {/* Submit */}
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

export default CreateGuestScreen;
