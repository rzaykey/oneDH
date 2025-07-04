import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {accountProfileStyles as styles} from '../styles/accountProfileStyles';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Platform} from 'react-native'; // tambahkan kalau belum

const AccountProfileScreen = ({navigation}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const cacheStr = await AsyncStorage.getItem('loginCache');
        if (cacheStr) setProfile(JSON.parse(cacheStr));
      } catch (e) {
        Alert.alert('Error', 'Gagal memuat data profil!');
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  // Helper masking token
  const maskToken = token => {
    if (!token) return '-';
    return token.substring(0, 6) + '...' + token.slice(-6);
  };

  // Pastikan role pasti array
  let parsedRole = [];
  if (profile) {
    if (Array.isArray(profile.roles)) parsedRole = profile.roles;
    else if (typeof profile.roles === 'string') {
      try {
        parsedRole = JSON.parse(profile.roles);
      } catch {
        parsedRole = [];
      }
    }
  }

  if (loading) {
    return (
      <LinearGradient
        colors={['#FFD700', '#2463EB']}
        style={{flex: 1}}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2463EB" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient
        colors={['#FFD700', '#2463EB']}
        style={{flex: 1}}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.center}>
            <Text style={{color: 'red'}}>Tidak ada data profil ditemukan.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 2, y: 2}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1}}>
          <ScrollView
            contentContainerStyle={{paddingBottom: 140, paddingHorizontal: 20}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{flex: 1}}
              keyboardVerticalOffset={20}>
              {/* --- Konten Profil --- */}
              <View style={styles.headerCard}>
                <Icon
                  name="person-circle"
                  size={60}
                  color="#2463EB"
                  style={{marginBottom: 5}}
                />
                <Text style={styles.profileName}>
                  {profile?.dataEmp?.name ?? profile.name}
                </Text>
                <Text style={styles.profileEmail}>{profile.email ?? '-'}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoRow}>
                  <Text style={styles.infoLabel}>JDE No:</Text>{' '}
                  {profile?.dataEmp?.jdeno}
                </Text>
                <Text style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Site:</Text>{' '}
                  {profile?.dataEmp?.site}
                </Text>
                <Text style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dept:</Text>{' '}
                  {profile?.dataEmp?.dept}
                </Text>
                <Text style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Position:</Text>{' '}
                  {profile?.dataEmp?.position}
                </Text>
              </View>

              <View style={styles.rolesCard}>
                <Text style={styles.rolesTitle}>Roles & Permissions</Text>
                {parsedRole.length > 0 ? (
                  parsedRole.map((r, idx) => (
                    <View key={idx} style={styles.roleItem}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 2,
                        }}>
                        <Icon
                          name="checkmark-circle"
                          color="#2463EB"
                          size={16}
                        />
                        <Text style={styles.roleName}>{r.name}</Text>
                        <Text style={styles.roleSite}> ({r.code_site})</Text>
                      </View>
                      <Text style={styles.rolePerm}>
                        {r.module}
                        {/* -{' '} */}
                        {/* <Text style={{fontWeight: 'bold'}}>
                          {(r.permit || '').toUpperCase()}
                        </Text> */}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{color: 'red'}}>Tidak ada role ditemukan.</Text>
                )}
              </View>
            </KeyboardAvoidingView>
          </ScrollView>
          {/* ✅ Tombol Logout Tetap di Bawah */}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AccountProfileScreen;
