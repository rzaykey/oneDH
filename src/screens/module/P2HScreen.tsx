import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {p2hStyles as styles} from '../../styles/p2hStyles';

const fullMenu = [
  {
    id: 'input',
    label: 'Isi P2H',
    icon: 'checkbox-outline',
    desc: 'Isi checklist harian kendaraan',
    screen: 'CreateP2HScreen',
  },
  {
    id: 'history',
    label: 'Riwayat P2H',
    icon: 'document-text-outline',
    desc: 'Lihat hasil pemeriksaan yang sudah dibuat karyawan',
    screen: 'P2HHistory',
  },
  {
    id: 'myhistory',
    label: 'Riwayat P2H Saya',
    icon: 'alert-circle-outline',
    desc: 'Lihat hasil pemeriksaan diri sendiri',
    screen: 'P2HMyHistory',
  },
];

// Fungsi pengecekan apakah user adalah Admin HSE
const isAdminHSE = (role: any[], user: any, activeSite: string): boolean => {
  return !!role.find(
    r =>
      r.code_site === activeSite &&
      r.name?.toLowerCase().includes('admin hse') &&
      r.user_id === user?.jdeno,
  );
};

const P2HScreen = ({navigation}: any) => {
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const loginCache = await AsyncStorage.getItem('loginCache');
        if (!loginCache) return;

        const parsed = JSON.parse(loginCache);
        const user = parsed?.dataEmp;
        const roles = parsed?.roles || [];
        const site = user?.site || '';

        const filtered = fullMenu.filter(menu => {
          if (menu.id === 'history') {
            return isAdminHSE(roles, user, site);
          }
          return true;
        });

        setMenus(filtered);
      } catch (error) {
        console.log('Gagal memuat role:', error);
      }
    };

    loadMenus();
  }, []);

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>P2H - Pemeriksaan Harian Kendaraan</Text>
        <FlatList
          data={menus}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.menuList}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.screen)}>
              <View style={styles.iconCircle}>
                <Icon name={item.icon} size={27} color="#fff" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Icon name="chevron-forward" size={23} color="#AAB2BD" />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default P2HScreen;
