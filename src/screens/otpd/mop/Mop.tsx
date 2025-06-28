import React, {useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  UIManager,
  ToastAndroid,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {tabelStyles as styles} from '../../../styles/tabelStyles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../navigation/types';
import {MopData} from '../../../navigation/types';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import API_BASE_URL from '../../../config';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const pageSizeOptions = [5, 10, 50, 100];
type NavigationProp = StackNavigationProp<RootStackParamList, 'Mop'>;

export default function Mop() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<MopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Online/Offline Listener
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state =>
      setIsConnected(state.isConnected === true),
    );
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsub();
  }, []);

  // Ambil summary MOP (total_count, max_id, last_update)
  const getSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL.mop}/mopData/summary`);
      return await res.json(); // { total_count, max_id, last_update }
    } catch {
      return null;
    }
  };

  /**
   * Auto Sync: Cek summary.last_update, jika beda dengan cache -> fetch data baru!
   */
  const fetchDataAutoSync = useCallback(
    async (forceServer = false) => {
      setLoading(true);
      setSyncing(true);
      try {
        if (!isConnected) {
          // OFFLINE: ambil cache
          const cache = await AsyncStorage.getItem('cached_mop_data');
          setData(cache ? JSON.parse(cache) : []);
          setLoading(false);
          setRefreshing(false);
          setSyncing(false);
          return;
        }

        // ONLINE: Cek last_update
        const summary = await getSummary();
        const lastUpdate = summary?.last_update || '';
        const localUpdate = await AsyncStorage.getItem('mop_last_update');

        // Jika ada update, atau force refresh
        if (forceServer || (lastUpdate && lastUpdate !== localUpdate)) {
          // Fetch baru!
          const res = await fetch(`${API_BASE_URL.mop}/mopData`);
          const json = await res.json();
          const arr = Array.isArray(json) ? json : json.data || [];
          setData(arr);
          await AsyncStorage.setItem('cached_mop_data', JSON.stringify(arr));
          await AsyncStorage.setItem('mop_last_update', lastUpdate || '');
        } else {
          // Tidak ada perubahan, load dari cache saja
          const cache = await AsyncStorage.getItem('cached_mop_data');
          setData(cache ? JSON.parse(cache) : []);
        }
      } catch (err) {
        const cache = await AsyncStorage.getItem('cached_mop_data');
        setData(cache ? JSON.parse(cache) : []);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setSyncing(false);
      }
    },
    [isConnected],
  );

  // Run auto sync sekali saat load, & setiap koneksi online lagi
  useEffect(() => {
    fetchDataAutoSync();
    let interval;
    if (isConnected) {
      interval = setInterval(() => fetchDataAutoSync(), 60 * 1000); // 1 menit, bebas ubah
    }
    return () => interval && clearInterval(interval);
  }, [fetchDataAutoSync, isConnected]);

  // Manual force refresh
  const handleForceRefresh = async () => {
    setSyncing(true);
    await fetchDataAutoSync(true);
    setSyncing(false);
    ToastAndroid.show('Data di-refresh dari server!', ToastAndroid.SHORT);
  };

  // Pull to refresh (swipe down)
  const onRefresh = () => {
    setRefreshing(true);
    fetchDataAutoSync(true);
  };

  // Expand/collapse card
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Filter pencarian
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.employee_name.toLowerCase().includes(q) ||
      item.jde_no.toLowerCase().includes(q) ||
      item.site.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page jika search/pageSize berubah
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [searchQuery, pageSize, totalPages, page]);

  // Reset expanded jika filter/page berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // Loader awal
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={{marginTop: 12}}>Memuat data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <SafeAreaView
        style={{
          flex: 1,
          paddingHorizontal: 8,
          paddingTop: 20,
          paddingBottom: insets.bottom,
        }}>
        {/* Judul halaman */}
        <Text style={styles.pageTitle}>Mine Operator Performance</Text>

        {/* Kolom pencarian */}
        <TextInput
          placeholder="Cari Nama, JDE, atau Site..."
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            setPage(1);
          }}
          style={styles.searchInput}
          {...(Platform.OS === 'ios' ? {clearButtonMode: 'while-editing'} : {})}
        />

        {/* Pilih items per page */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Items per page:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={pageSize}
              onValueChange={itemValue => {
                setPageSize(itemValue);
                setPage(1);
              }}
              style={styles.picker}
              dropdownIconColor="#1E90FF"
              mode="dropdown">
              {pageSizeOptions.map(size => (
                <Picker.Item key={size} label={size.toString()} value={size} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Daftar data MOP */}
        <FlatList
          data={paginatedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({item, index}) => {
            const expanded = item.id === expandedId;
            return (
              <Animatable.View
                animation={expanded ? 'fadeInDown' : 'fadeInUp'}
                duration={350}
                style={styles.cardContainer}>
                {/* Card Header */}
                <TouchableOpacity
                  onPress={() => toggleExpand(item.id)}
                  style={styles.cardHeader}
                  activeOpacity={0.88}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                    }}>
                    <View style={styles.avatar}>
                      <Icon name="person-outline" size={20} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>{item.employee_name}</Text>
                      <Text style={styles.cardSubtitle}>
                        JDE: {item.jde_no}
                      </Text>
                    </View>
                  </View>
                  <View style={{alignItems: 'flex-end', minWidth: 70}}>
                    <Text style={styles.cardSite}>{item.site}</Text>
                    <Text style={{fontSize: 12, color: '#888'}}>
                      {item.month}/{item.year}
                    </Text>
                    <Icon
                      name={
                        expanded ? 'chevron-up-outline' : 'chevron-down-outline'
                      }
                      size={18}
                      color="#bbb"
                      style={{marginTop: 2}}
                    />
                  </View>
                </TouchableOpacity>

                {/* Detail card */}
                {expanded && (
                  <View
                    style={[
                      styles.cardDetail,
                      {
                        paddingTop: 6,
                        borderTopWidth: 1,
                        borderTopColor: '#eee',
                      },
                    ]}>
                    <Text style={[styles.cardSectionTitle, {marginBottom: 2}]}>
                      KPI & Absensi
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Absensi: {item.a_attendance_ratio}%
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Disiplin: {item.b_discipline}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Safety Awareness: {item.c_safety_awareness}
                    </Text>

                    <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                      WH Waste Equip
                    </Text>
                    {[1, 2, 3, 4, 5, 6].map(i => {
                      const val = item[`d_wh_waste_equiptype${i}`];
                      return val ? (
                        <Text
                          key={`wh-waste-${i}`}
                          style={styles.cardDetailText}>
                          Equip {i}: {val}
                        </Text>
                      ) : null;
                    })}

                    <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                      PTY Equip
                    </Text>
                    {[1, 2, 3, 4, 5, 6].map(i => {
                      const val = item[`e_pty_equiptype${i}`];
                      return val ? (
                        <Text
                          key={`pty-equip-${i}`}
                          style={styles.cardDetailText}>
                          Equip {i}: {val}
                        </Text>
                      ) : null;
                    })}

                    <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                      Point & Grade
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Point Eligibilitas:{' '}
                      <Text style={{fontWeight: 'bold'}}>
                        {item.point_eligibilitas}
                      </Text>
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Point Produksi:{' '}
                      <Text style={{fontWeight: 'bold'}}>
                        {item.point_produksi}
                      </Text>
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Total Point:{' '}
                      <Text style={{fontWeight: 'bold', color: '#1E90FF'}}>
                        {item.total_point}
                      </Text>
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Grade Bulanan:{' '}
                      <Text style={{fontWeight: 'bold', color: '#E67E22'}}>
                        {item.mop_bulanan_grade}
                      </Text>
                    </Text>

                    <Text style={[styles.cardSectionTitle, {marginTop: 10}]}>
                      Info Lain
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Tipe MOP: {item.mop_type} | Target Avg HM:{' '}
                      {item.target_avg_hm}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Point: A {item.point_a} | B {item.point_b} | C{' '}
                      {item.point_c} | D {item.point_d} | E {item.point_e}
                    </Text>
                    <Text
                      style={[
                        styles.cardDetailText,
                        {marginBottom: 4, color: '#aaa', fontSize: 12},
                      ]}>
                      Input: {item.created_at && item.created_at.split('T')[0]}
                    </Text>
                  </View>
                )}
              </Animatable.View>
            );
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <Text
              style={{textAlign: 'center', marginVertical: 16, color: 'gray'}}>
              Tidak ada data ditemukan.
            </Text>
          }
          contentContainerStyle={{paddingBottom: 22}}
        />

        {/* Pagination navigasi */}
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            onPress={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={[
              styles.pageButton,
              page === 1 && styles.pageButtonDisabled,
            ]}>
            <Text style={styles.pageButtonText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            Page {page} / {totalPages || 1}
          </Text>
          <TouchableOpacity
            onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            style={[
              styles.pageButton,
              (page === totalPages || totalPages === 0) &&
                styles.pageButtonDisabled,
            ]}>
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
