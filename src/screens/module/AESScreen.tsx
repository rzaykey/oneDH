import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {p2hStyles as styles} from '../../styles/p2hStyles';
import Modal from 'react-native-modal';

const fullMenu = [
  {
    id: 'input',
    label: 'Isi Event',
    icon: 'checkbox-outline',
    desc: 'Isi Event Presenter/Peserta',
    screen: 'CreatePresentAESScreen',
  },
  {
    id: 'history',
    label: 'Riwayat Event',
    icon: 'document-text-outline',
    desc: 'Lihat Hasil Riwayat Semua Karyawan',
    screen: 'P2HHistory',
  },
  {
    id: 'myhistory',
    label: 'Riwayat Event Saya',
    icon: 'alert-circle-outline',
    desc: 'Riwayat Presenter/Peserta',
    screen: 'AESMyHistory',
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

const AESScreen = ({navigation}: any) => {
  const [menus, setMenus] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);

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

  const handleMenuPress = (menu: any) => {
    if (menu.id === 'input' || menu.id === 'myhistory') {
      setSelectedMenu(menu);
      setModalVisible(true);
    } else {
      navigation.navigate(menu.screen);
    }
  };

  const navigateWithRole = (role: 'presenter' | 'guest') => {
    if (!selectedMenu) return;
    setModalVisible(false);

    // Tentukan screen tujuan berdasarkan menu dan peran
    let targetScreen = selectedMenu.screen;

    if (selectedMenu.id === 'input') {
      targetScreen =
        role === 'presenter'
          ? 'CreatePresentAESScreen'
          : 'CreateGuestAESScreen';
    } else if (selectedMenu.id === 'myhistory') {
      targetScreen =
        role === 'presenter' ? 'AESMyHistory' : 'GuestAESMyHistory';
    }

    navigation.navigate(targetScreen);
  };

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>EAS - Event Attendance System</Text>
        <FlatList
          data={menus}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.menuList}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.menuCard}
              onPress={() => handleMenuPress(item)}>
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
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Pilih Peran Anda</Text>

          <TouchableOpacity
            style={styles.modalButtonYellow}
            onPress={() => navigateWithRole('presenter')}>
            <Text style={styles.modalButtonText}>Presenter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalButtonBlue}
            onPress={() => navigateWithRole('guest')}>
            <Text style={styles.modalButtonText}>Peserta</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default AESScreen;
