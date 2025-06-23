import React from 'react';
import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {p2hStyles as styles} from '../../styles/p2hStyles';

const p2hMenus = [
  {
    id: 'input',
    label: 'Input Pemeriksaan',
    icon: 'checkbox-outline',
    desc: 'Isi checklist harian kendaraan',
    screen: 'CreateP2HScreen',
  },
  {
    id: 'history',
    label: 'Riwayat Pemeriksaan',
    icon: 'document-text-outline',
    desc: 'Lihat hasil pemeriksaan yang sudah dibuat',
    screen: 'P2HHistory',
  },
  {
    id: 'report',
    label: 'Laporan Tidak Lolos',
    icon: 'alert-circle-outline',
    desc: 'Daftar kendaraan gagal inspeksi',
    screen: 'P2HFailedReport',
  },
];

const P2HScreen = ({navigation}: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>P2H - Pemeriksaan Harian Kendaraan</Text>
      <FlatList
        data={p2hMenus}
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
  );
};

export default P2HScreen;
