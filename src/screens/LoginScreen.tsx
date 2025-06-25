import React, {useState, useEffect} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {loginStyles as styles} from '../styles/loginStyles';
import LinearGradient from 'react-native-linear-gradient';
import API_BASE_URL from '../config';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import {useSiteContext} from '../context/SiteContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({navigation}: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState({user: false, pass: false});
  const [errors, setErrors] = useState({user: '', pass: ''});
  const insets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState(true);
  const {refreshContext} = useSiteContext();
  // Login handler
  const handleLogin = async () => {
    let errUser = !username ? 'Username wajib diisi' : '';
    let errPass = !password ? 'Password wajib diisi' : '';
    setErrors({user: errUser, pass: errPass});
    if (errUser || errPass) return;

    setLoading(true);
    const payload = {
      jdeno: username.trim(), // sesuai API-mu
      password: password.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL.auth}/CekLogin`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // ---- PENYESUAIAN DENGAN JSON BARU ----
      if (response.ok && data.status === 'success' && data.token) {
        // Simpan SEMUA data yang didapatkan
        await AsyncStorage.setItem(
          'loginCache',
          JSON.stringify({
            token: data.token,
            name: data.name,
            email: data.email,
            dataEmp: data.dataEmp,
            roles: data.role, // array, ini KUNCI FILTER dashboard
          }),
        );
        await refreshContext();
        // **Redirect ke AuthLoadingScreen**
        navigation.replace('AuthLoading');
      } else {
        Alert.alert('Login gagal', data.message || 'Cek username & password');
      }
    } catch (error) {
      Alert.alert('Error', 'Tidak dapat terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, []);

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[styles.container, {paddingBottom: insets.bottom}]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}
        keyboardVerticalOffset={20}>
        <View style={styles.statusWrapper}>
          <Text
            style={[
              styles.statusLabel,
              isConnected ? styles.statusOnline : styles.statusOffline,
            ]}>
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>One DH - Login</Text>

        <View
          style={[
            styles.inputWrapper,
            focus.user && styles.inputFocus,
            errors.user ? styles.inputError : null,
          ]}>
          <TextInput
            style={styles.input}
            placeholder="JDE Employee"
            placeholderTextColor="#0f0f0f"
            autoCapitalize="none"
            value={username}
            onFocus={() => setFocus(f => ({...f, user: true}))}
            onBlur={() => setFocus(f => ({...f, user: false}))}
            onChangeText={text => {
              setUsername(text);
              if (text) setErrors(e => ({...e, user: ''}));
            }}
            returnKeyType="next"
          />
        </View>
        {errors.user ? (
          <Text style={styles.errorText}>{errors.user}</Text>
        ) : null}

        <View
          style={[
            styles.inputWrapper,
            focus.pass && styles.inputFocus,
            errors.pass ? styles.inputError : null,
          ]}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#0f0f0f"
            secureTextEntry={!showPassword}
            value={password}
            autoCapitalize="none"
            onFocus={() => setFocus(f => ({...f, pass: true}))}
            onBlur={() => setFocus(f => ({...f, pass: false}))}
            onChangeText={text => {
              setPassword(text);
              if (text) setErrors(e => ({...e, pass: ''}));
            }}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowPassword(v => !v)}>
            <Text style={{color: '#888', fontSize: 16}}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.pass ? (
          <Text style={styles.errorText}>{errors.pass}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            (loading || !username || !password) && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading || !username || !password}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Masuk</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;
