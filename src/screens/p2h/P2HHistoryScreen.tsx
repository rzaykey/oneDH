import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../config';
import {useNavigation} from '@react-navigation/native';
import {p2hHistoryStyles as styles} from '../../styles/p2hHistoryStyles';
import {useSiteContext} from '../../context/SiteContext';
import {isAdminHSE} from '../../utils/role'; // Tambahkan ini
import LinearGradient from 'react-native-linear-gradient';

const API_URL = `${API_BASE_URL.p2h}/GetDataP2H`;

const P2HHistoryScreen = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Context
  const {roles, user, activeSite} = useSiteContext();

  // Cek apakah admin HSE site aktif
  const canViewAll = isAdminHSE(roles, user, activeSite);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [activeSite, user?.jdeno, canViewAll]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const cache = await AsyncStorage.getItem('loginCache');
      const token =
        cache && JSON.parse(cache)?.token ? JSON.parse(cache).token : null;
      console.log('Token yang dipakai:', token); // Log token, cek benar/ada

      if (!token) {
        setHistory([]);
        setError('Session habis. Silakan login ulang.');
        setLoading(false);
        return;
      }

      console.log('Fetch GET:', API_URL, 'Headers:', {
        Authorization: `Bearer ${token}`,
      });

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Raw Response:', response);

      // Kadang response bukan JSON valid (bisa error parsing)
      let json;
      try {
        json = await response.json();
      } catch (jsonErr) {
        console.log('Gagal parsing JSON:', jsonErr);
        setError('Respon server tidak valid.');
        setHistory([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('Isi JSON:', json);

      if (!response.ok) {
        setError(json?.message || 'Gagal mengambil data.');
        setHistory([]);
      } else {
        let data = json.data || [];
        console.log('Data history sebelum filter:', data);

        // === INI FILTERINGNYA ===
        if (!canViewAll && user?.jdeno) {
          data = data.filter((item: any) => item.jdeno === user.jdeno);
          console.log('Data history setelah filter:', data);
        }
        setHistory(data);
      }
    } catch (err) {
      console.log('ERROR fetchHistory:', err);
      setError('Tidak dapat terhubung ke server.');
      setHistory([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({item}: {item: any}) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.83}
      onPress={() =>
        navigation.navigate('P2HDetail', {
          fid_p2h: item.id,
          unit: item.no_unit,
          driver: item.namapengemudi,
          tanggal: item.tanggal,
        })
      }>
      <View style={styles.headerRow}>
        <Text style={styles.unitText}>{item.no_unit}</Text>
        <Text style={styles.siteLabel}>{item.site}</Text>
      </View>
      <Text style={styles.modelText}>{item.model}</Text>
      <View style={styles.row}>
        <Icon name="person-circle-outline" size={17} color="#4886E3" />
        <Text style={styles.driverName}>
          {item.namapengemudi}
          {item.jdeno === user?.jdeno ? ' (Punya Anda)' : ''}
        </Text>
      </View>
      <View style={styles.rowSpace}>
        <Text style={styles.labelInfo}>
          <Icon name="calendar-outline" size={15} color="#999" />{' '}
          {dayjs(item.tanggal).format('DD MMM YYYY')}
        </Text>
        <Text style={styles.hmkm}>{item.hmkm} HM/KM</Text>
      </View>
      <View style={styles.badgeRow}>
        <Badge
          label={`Fuel: ${item.fuel_permit}`}
          color={item.fuel_permit === 'Berlaku' ? '#4CAF50' : '#E53935'}
        />
        <Badge
          label={`Sticker: ${item.sticker_permit}`}
          color={item.sticker_permit === 'Berlaku' ? '#4CAF50' : '#E53935'}
        />
      </View>
      {item.keterangan ? (
        <View style={styles.keteranganRow}>
          <Text style={styles.ketLabel}>Keterangan: </Text>
          <Text style={styles.ketValue}>{item.keterangan}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const InfoEmpty = ({message = 'Data kosong/belum ada pemeriksaan P2H.'}) => (
    <View style={styles.emptyWrap}>
      <Icon
        name="file-tray-outline"
        size={56}
        color="#c9c9c9"
        style={{marginBottom: 6}}
      />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubText}>
        Silakan lakukan pemeriksaan P2H dan data akan muncul di sini.
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.headerWrap}>
          <Icon
            name="clipboard-outline"
            size={22}
            color="#2563eb"
            style={{marginRight: 20}}
          />
          <Text style={styles.title}>Riwayat Pemeriksaan P2H</Text>
        </View>
        {error ? (
          <InfoEmpty message={error} />
        ) : loading ? (
          <ActivityIndicator
            color="#4886E3"
            style={{marginTop: 32}}
            size="large"
          />
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <InfoEmpty message="Data kosong/belum ada pemeriksaan P2H." />
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4886E3']}
              />
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const Badge = ({label, color}: {label: string; color: string}) => (
  <View
    style={[styles.badge, {backgroundColor: color + '22', borderColor: color}]}>
    <Text style={[styles.badgeText, {color}]}>{label}</Text>
  </View>
);

export default P2HHistoryScreen;
