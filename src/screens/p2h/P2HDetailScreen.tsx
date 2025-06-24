import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, ActivityIndicator} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import {p2hDetailStyles as styles} from '../../styles/p2hDetailStyles';
import LinearGradient from 'react-native-linear-gradient';
import API_BASE_URL from '../../config';

const API_DETAIL_URL = `${API_BASE_URL.p2h}/GetDataP2HDetails`;

type DetailItem = {
  id: string;
  pertanyaan: string;
  jawaban: string;
};

const P2HDetailScreen = ({route}) => {
  const {fid_p2h, unit, driver, tanggal} = route.params;
  const insets = useSafeAreaInsets();

  const [detail, setDetail] = useState<DetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const cache = await AsyncStorage.getItem('loginCache');
        const token =
          cache && JSON.parse(cache)?.token ? JSON.parse(cache).token : null;

        if (!token) {
          setError('Session habis, silakan login ulang.');
          setDetail([]);
          setLoading(false);
          return;
        }

        const url = `${API_DETAIL_URL}?fid_p2h=${fid_p2h}`;
        const response = await fetch(url, {
          method: 'POST', // Ganti sesuai API (POST recommended utk detail P2H)
          headers: {Authorization: `Bearer ${token}`},
        });
        const json = await response.json();

        if (!response.ok) {
          setError(json?.message || 'Gagal mengambil data.');
          setDetail([]);
        } else {
          setDetail(Array.isArray(json.data) ? json.data : []);
        }
      } catch (e) {
        setError('Tidak dapat terhubung ke server.');
        setDetail([]);
      }
      setLoading(false);
    };
    fetchDetail();
  }, [fid_p2h]);

  // Warna badge berdasarkan jawaban
  const getJawabanBadge = (jawaban: string) => {
    if (jawaban === 'Baik')
      return {label: 'Baik', color: '#22c55e', icon: 'checkmark-circle'};
    if (jawaban === 'NA')
      return {label: 'N/A', color: '#fbbf24', icon: 'remove-circle'};
    return {label: jawaban, color: '#ef4444', icon: 'alert-circle'};
  };

  // HEADER CARD
  const renderHeader = () => (
    <View style={styles.headerCard}>
      <Icon
        name="car-sport-outline"
        size={34}
        color="#4f8ef7"
        style={{marginBottom: 5}}
      />
      <Text style={styles.unitText}>{unit}</Text>
      <View style={styles.infoRow}>
        <Icon name="person-circle" size={20} color="#888" />
        <Text style={styles.driverText}>{driver}</Text>
      </View>
      <View style={styles.infoRow}>
        <Icon name="calendar-outline" size={18} color="#888" />
        <Text style={styles.tglText}>{tanggal}</Text>
      </View>
    </View>
  );

  // RENDER ITEM (CHECKLIST)
  const renderItem = ({item, index}: {item: DetailItem; index: number}) => {
    const badge = getJawabanBadge(item.jawaban);
    return (
      <View style={styles.listItem}>
        <View style={styles.noCircle}>
          <Text style={styles.noText}>{index + 1}</Text>
        </View>
        <View style={{flex: 1, marginLeft: 10}}>
          <Text style={styles.question}>{item.pertanyaan}</Text>
          <View style={[styles.badge, {backgroundColor: badge.color + '22'}]}>
            <Icon
              name={badge.icon}
              size={17}
              color={badge.color}
              style={{marginRight: 6}}
            />
            <Text style={[styles.badgeText, {color: badge.color}]}>
              {badge.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
        <FlatList
          data={detail}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={
            <>
              {renderHeader()}
              <Text style={styles.sectionTitle}>Checklist Pemeriksaan</Text>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : loading ? (
                <ActivityIndicator
                  color="#4f8ef7"
                  style={{marginTop: 20}}
                  size="large"
                />
              ) : null}
            </>
          }
          renderItem={renderItem}
          ListEmptyComponent={
            !loading && !error ? (
              <Text style={styles.emptyText}>Tidak ada data checklist.</Text>
            ) : null
          }
          contentContainerStyle={{
            paddingHorizontal: 15,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

export default P2HDetailScreen;
