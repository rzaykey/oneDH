import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {styles} from '../styles/upadatePasswordStyles';
import LinearGradient from 'react-native-linear-gradient';
import API_BASE_URL from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

const UpdatePassword = ({navigation}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const API_URL_UP = `${API_BASE_URL.onedh}/UpdatePassword`;

  const getAuthHeader = async () => {
    const cache = await AsyncStorage.getItem('loginCache');
    const token = cache && JSON.parse(cache)?.token;
    if (!token) throw new Error('Token tidak ditemukan!');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Password terlalu pendek',
        text2: 'Minimal 6 karakter.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Konfirmasi tidak cocok',
        text2: 'Password baru dan konfirmasi harus sama.',
      });
      return;
    }

    setLoading(true);

    try {
      const headers = await getAuthHeader();
      const response = await fetch(API_URL_UP, {
        method: 'POST',
        headers,
        body: JSON.stringify({password: newPassword}),
      });
      const resJson = await response.json();

      if (response.ok && resJson.status === true) {
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: resJson.message || 'Password anda berhasil diubah.',
        });

        setTimeout(async () => {
          await AsyncStorage.removeItem('loginCache'); // Hapus token/session
          await AsyncStorage.removeItem('activeSite');
          navigation.reset({
            index: 0,
            routes: [{name: 'Login'}], // Ganti dengan nama screen login kamu
          });
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Gagal',
          text2: resJson.message || 'Gagal memperbarui password.',
        });
      }
    } catch (error) {
      console.error('UpdatePassword error:', error);
      Toast.show({
        type: 'error',
        text1: 'Terjadi Kesalahan',
        text2: 'Silakan coba lagi nanti.',
      });
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
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>🔒 Update Password</Text>

          {/* Password Baru */}
          <Text style={styles.label}>Password Baru</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              placeholder="Masukkan password baru"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Icon
                name={showNew ? 'eye' : 'eye-off'}
                size={20}
                color="#666"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Konfirmasi */}
          <Text style={styles.label}>Konfirmasi Password Baru</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              placeholder="Ulangi password baru"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Icon
                name={showConfirm ? 'eye' : 'eye-off'}
                size={20}
                color="#666"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Tombol Simpan */}
          <TouchableOpacity
            style={[styles.button, loading && {opacity: 0.7}]}
            onPress={handleUpdatePassword}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>💾 Simpan Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default UpdatePassword;
