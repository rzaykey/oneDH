import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import API_BASE_URL from '../../config';
import {p2hHistoryStyles as styles} from '../../styles/p2hHistoryStyles';
import {useSiteContext} from '../../context/SiteContext';
import {AbsensiPerBulan} from '../../navigation/types';
import {Picker} from '@react-native-picker/picker';

const API_URL = `${API_BASE_URL.onedh}/getAbsensiPerBulan`;

const EWCMyHistoryScreen: React.FC = () => {
  const [data, setData] = useState<AbsensiPerBulan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulan, setBulan] = useState(dayjs().month() + 1);
  const [tahun, setTahun] = useState(dayjs().year());

  const {user} = useSiteContext();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      const parsed = loginCache ? JSON.parse(loginCache) : null;
      const token = parsed?.token;
      const username = parsed?.dataEmp?.jdeno;

      if (!token || !username) {
        setError('Session habis. Silakan login ulang.');
        setData([]);
        return;
      }

      const url = `${API_URL}?username=${username}&bulan=${bulan}&tahun=${tahun}`;
      const response = await fetch(url, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const json = await response.json();
      if (!response.ok || !json.absen) {
        setError(json?.message || 'Gagal mengambil data.');
        setData([]);
      } else {
        setData(json.absen);
      }
    } catch {
      setError('Tidak dapat terhubung ke server.');
      setData([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, [bulan, tahun]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({item}: {item: AbsensiPerBulan}) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={[styles.headerRow, {justifyContent: 'center'}]}>
        <Text style={styles.siteLabel}>
          {dayjs(item.tanggal).format('DD MMM YYYY')}
        </Text>
      </View>

      <View style={{marginTop: 8}}>
        {item.timein === null && item.timeout === null ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon
              name="alert-circle-outline"
              size={18}
              color="red"
              style={{marginRight: 6}}
            />
            <Text style={[styles.labelInfo, {color: 'red', fontWeight: '600'}]}>
              Belum Absen
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 6,
            }}>
            {/* Kolom kiri - Time In */}
            <View style={{flex: 1, alignItems: 'center'}}>
              <Icon name="log-in-outline" size={18} color="#4CAF50" />
              <Text style={[styles.labelInfo, {marginTop: 4}]}>Time In</Text>
              <Text
                style={[styles.labelInfo, {fontWeight: 'bold', marginTop: 2}]}>
                {item.timein ?? '-'}
              </Text>
            </View>

            {/* Kolom kanan - Time Out */}
            <View style={{flex: 1, alignItems: 'center'}}>
              <Icon name="log-out-outline" size={18} color="#F44336" />
              <Text style={[styles.labelInfo, {marginTop: 4}]}>Time Out</Text>
              <Text style={[styles.hmkm, {fontWeight: 'bold', marginTop: 2}]}>
                {item.timeout ?? '-'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const InfoEmpty = ({message = 'Data tidak tersedia'}: {message?: string}) => (
    <View style={styles.emptyWrap}>
      <Image
        source={require('../../assets/images/empty.png')}
        style={{
          width: 240,
          height: 240,
          marginBottom: 12,
          resizeMode: 'contain',
        }}
      />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubText}>
        Pilih bulan dan tahun untuk melihat riwayat absensi Anda.
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerWrap}>
          <Icon
            name="calendar-outline"
            size={22}
            color="#2563eb"
            style={{marginRight: 10}}
          />
          <Text style={styles.title}>Riwayat Absensi Bulaanan</Text>
        </View>

        {/* Picker Bulan & Tahun */}
        <View
          style={[styles.limitPickerWrap, {justifyContent: 'space-between'}]}>
          <View style={{flex: 1, marginRight: 8}}>
            <Picker
              selectedValue={bulan}
              onValueChange={val => setBulan(val)}
              style={styles.pickerMonth}>
              {Array.from({length: 12}, (_, i) => (
                <Picker.Item
                  key={i + 1}
                  label={dayjs().month(i).format('MMMM')}
                  value={i + 1}
                />
              ))}
            </Picker>
          </View>
          <View style={{flex: 1}}>
            <Picker
              selectedValue={tahun}
              onValueChange={val => setTahun(val)}
              style={styles.pickerMonth}>
              {[tahun - 1, tahun, tahun + 1].map(y => (
                <Picker.Item key={y} label={y.toString()} value={y} />
              ))}
            </Picker>
          </View>
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
            data={data}
            keyExtractor={(item, index) => `${item.jde_no}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={<InfoEmpty />}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EWCMyHistoryScreen;
