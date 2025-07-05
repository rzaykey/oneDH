import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {jcmStyles as styles} from '../../styles/jcmStyles';

import {
  getModulePermit,
  canAdd,
  canEdit,
  canDelete,
  canRead,
  PermitType,
} from '../../utils/permit';

// Map untuk pengecekan action ke fungsi permit
const actionChecker = {
  add: canAdd,
  edit: canEdit,
  delete: canDelete,
  read: canRead,
};

// Konfigurasi menu per section
const sectionConfig = [
  {
    section: 'JCM',
    items: [
      {
        label: 'Pilih Pekerjaan',
        icon: 'build-outline',
        action: 'read',
        screen: 'CreateJCMScreen',
        desc: 'Isi formulir pekerjaan JCM',
      },
      {
        label: 'Riwayat Pekerjaan',
        icon: 'file-tray-full-outline',
        action: 'read',
        screen: 'JCMHistoryScreen',
        desc: 'Lihat riwayat JCM',
      },
    ],
  },
  {
    section: 'Task Assignment',
    items: [
      {
        label: 'Daftar JCM',
        icon: 'list-circle-outline',
        action: 'add',
        screen: 'JCMOpenScreen',
        desc: 'Daftar seluruh JCM',
      },
      {
        label: 'Validasi JCM',
        icon: 'person-add-outline',
        action: 'add',
        screen: 'JCMValidasiScreen',
        desc: 'Hasil Validasi JCM mekanik',
      },
    ],
  },
];

const JCMScreen = ({navigation}: any) => {
  const [permit, setPermit] = useState<PermitType | null>(null);

  useEffect(() => {
    const loadPermit = async () => {
      try {
        const loginCache = await AsyncStorage.getItem('loginCache');
        if (!loginCache) return;

        const parsed = JSON.parse(loginCache);
        const roles = parsed?.roles || [];
        const site = parsed?.dataEmp?.site || '';

        const userPermit = getModulePermit(roles, site, 'JCM');
        setPermit(userPermit);
      } catch (error) {
        console.log('Gagal memuat data izin:', error);
      }
    };

    loadPermit();
  }, []);

  if (!permit) return null;

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>JCM - Job Card Mechanic</Text>

        <ScrollView contentContainerStyle={styles.menuList}>
          {sectionConfig.map(section => {
            const visibleItems = section.items.filter(item =>
              actionChecker[item.action](permit),
            );

            if (visibleItems.length === 0) return null;

            return (
              <View key={section.section} style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{section.section}</Text>

                {visibleItems.map(item => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.menuCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(item.screen)}>
                    <View style={styles.iconCircle}>
                      <Icon name={item.icon} size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuDesc}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default JCMScreen;
