import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {styles} from '../styles/registerStyles';
import LinearGradient from 'react-native-linear-gradient';
import {Picker} from '@react-native-picker/picker';
import API_BASE_URL from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import {useSiteContext} from '../context/SiteContext';

export default function RegisterScreen() {
  const [jdeno, setJdeno] = useState('');
  const [siteList, setSiteList] = useState([]);
  const [selectedSiteCode, setSelectedSiteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [siteLoading, setSiteLoading] = useState(false);
  const navigation = useNavigation();
  const {refreshContext} = useSiteContext();

  // Fetch data site dari API
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setSiteLoading(true);
        const response = await fetch(`${API_BASE_URL.onedh}/MasterSite`);
        const json = await response.json();
        if (json?.data && Array.isArray(json.data)) {
          setSiteList(json.data);
        } else {
          showToast('error', 'Gagal Ambil Site', 'Data site tidak valid');
        }
      } catch (err) {
        showToast(
          'error',
          'Gagal Ambil Site',
          err.message || 'Terjadi kesalahan',
        );
      } finally {
        setSiteLoading(false);
      }
    };

    fetchSites();
  }, []);

  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 50,
    });
  };

  const saveLogin = async data => {
    await AsyncStorage.setItem(
      'loginCache',
      JSON.stringify({
        token: data.token,
        name: data.name,
        email: data.email,
        dataEmp: data.dataEmp,
        roles: data.role,
      }),
    );
  };

  const handleRegister = async () => {
    if (!jdeno || !selectedSiteCode) {
      Alert.alert('Peringatan', 'Harap isi JDE No dan pilih Site');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL.auth}/RegisterUser`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({jdeno, site_id: selectedSiteCode}),
      });

      const result = await response.json();

      if (response.ok) {
        if (result?.status === false) {
          showToast(
            'error',
            'Registrasi Gagal',
            result?.notif || 'Gagal mendaftar',
          );
        } else if (result?.status === 'success' && result?.token) {
          await saveLogin(result);
          await refreshContext();
          showToast(
            'success',
            'Registrasi Berhasil',
            `Selamat datang, ${result.name}!`,
          );
          navigation.replace('AuthLoading');
        } else {
          showToast('error', 'Error', 'Respons tidak valid dari server.');
        }
      } else {
        showToast('error', 'Error', result?.message || 'Gagal mendaftar.');
      }
    } catch (err) {
      showToast('error', 'Error', err?.message || 'Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <View style={styles.container}>
        <Text style={styles.title}>Daftar Akun</Text>

        <TextInput
          placeholder="Masukkan JDE No"
          value={jdeno}
          placeholderTextColor="#888"
          onChangeText={setJdeno}
          style={styles.input}
        />

        <Text style={styles.label}>Pilih Site</Text>
        <View style={styles.pickerWrapper}>
          {siteLoading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <Picker
              selectedValue={selectedSiteCode}
              onValueChange={itemValue => setSelectedSiteCode(itemValue)}
              style={styles.picker}>
              <Picker.Item label="-- Pilih Site --" value={null} />
              {siteList.map(site => (
                <Picker.Item
                  key={site.id}
                  label={`${site.id} - ${site.site}`}
                  value={site.id}
                />
              ))}
            </Picker>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!jdeno || !selectedSiteCode || loading) && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={!jdeno || !selectedSiteCode || loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{marginTop: 20}}>
          <Text style={{color: '#0066cc'}}>
            Sudah punya akun? Masuk di sini
          </Text>
        </TouchableOpacity>

        <Toast />
      </View>
    </LinearGradient>
  );
}
