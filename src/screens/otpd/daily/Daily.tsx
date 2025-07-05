import React, {useEffect, useState, useCallback, useRef} from 'react';
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
  AppState,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {tabelStyles as styles} from '../../../styles/tabelStyles';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, DailyActivity} from '../../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from '../../../config';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

const pageSizeOptions = [5, 10, 50, 100];

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'Daily'>;

export default function Daily() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // Main state
  const [data, setData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  // Master cache (optional, bisa dihilangkan kalau hanya list index)
  const [kpiMaster, setKpiMaster] = useState([]);
  const [activityMaster, setActivityMaster] = useState([]);
  const [unitMaster, setUnitMaster] = useState([]);
  const [masterVersion, setMasterVersion] = useState(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  // Background sync interval
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- ONLINE/OFFLINE LISTENER ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, []);

  // --- AUTO BACKGROUND SYNC LOGIC ---
  // 1. Function ambil summary dari server
  const getServerSummary = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL.mop.mop}/apiDayActAll/summaryDayAct`,
      );
      const json = await res.json();
      return {
        max_id: String(json.max_id),
        last_update: String(json.last_update),
      };
    } catch {
      return {};
    }
  };

  // 2. AUTO SYNC DATA: bandingkan summary dengan cache
  const fetchDataAutoSync = useCallback(
    async (forceServer = false) => {
      setIsSyncing(true);
      setLoading(true);
      try {
        if (!isConnected) {
          const cache = await AsyncStorage.getItem(
            'cached_daily_activity_list',
          );
          setData(cache ? JSON.parse(cache) : []);
          Toast.show({
            type: 'info',
            text1: 'Mode Offline',
            text2: 'Menggunakan data terakhir yang tersimpan.',
          });
          return;
        }

        // Ambil summary dari server
        const {max_id: serverMaxId, last_update: serverLastUpdate} =
          await getServerSummary();

        const localMaxId = await AsyncStorage.getItem('daily_max_id');
        const localLastUpdate = await AsyncStorage.getItem('daily_last_update');

        // Jika data berubah atau dipaksa refresh
        if (
          forceServer ||
          localMaxId !== serverMaxId ||
          localLastUpdate !== serverLastUpdate
        ) {
          const res = await fetch(`${API_BASE_URL.mop}/apiDayActAll`);
          const json = await res.json();
          const arr = Array.isArray(json) ? json : json.data || [];

          setData(arr);
          await AsyncStorage.setItem(
            'cached_daily_activity_list',
            JSON.stringify(arr),
          );
          await AsyncStorage.setItem('daily_max_id', serverMaxId || '');
          await AsyncStorage.setItem(
            'daily_last_update',
            serverLastUpdate || '',
          );
          Toast.show({
            type: 'success',
            text1: 'Berhasil Sinkronisasi ✅',
            text2: 'Data daily activity berhasil diperbarui dari server.',
          });
        } else {
          const cache = await AsyncStorage.getItem(
            'cached_daily_activity_list',
          );
          setData(cache ? JSON.parse(cache) : []);
          Toast.show({
            type: 'info',
            text1: 'Tidak Ada Perubahan',
            text2: 'Data sudah sesuai dengan server.',
          });
        }
      } catch (e) {
        const cache = await AsyncStorage.getItem('cached_daily_activity_list');
        setData(cache ? JSON.parse(cache) : []);
        Toast.show({
          type: 'error',
          text1: 'Gagal Sinkronisasi ❌',
          text2: 'Terjadi kesalahan saat mengambil data dari server.',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsSyncing(false);
      }
    },
    [isConnected],
  );

  // --- BACKGROUND SYNC INTERVAL (setiap 2 menit, bebas diubah) ---
  useEffect(() => {
    if (!isConnected) return;
    // Jalankan auto sync pertama kali
    fetchDataAutoSync();

    // Set interval untuk background sync
    syncIntervalRef.current = setInterval(() => {
      fetchDataAutoSync();
    }, 2 * 60 * 1000); // setiap 2 menit

    // Juga sync saat app di foreground
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') fetchDataAutoSync();
    });

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (appStateSub) appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, fetchDataAutoSync]);

  // Manual refresh
  const handleForceRefresh = async () => {
    await fetchDataAutoSync(true);
    ToastAndroid.show('Data di-refresh dari server!', ToastAndroid.SHORT);
  };

  // Master data dari cache (optional)
  useEffect(() => {
    AsyncStorage.getItem('dropdown_kpi').then(d => {
      if (d) setKpiMaster(JSON.parse(d));
    });
    AsyncStorage.getItem('cached_all_activity').then(d => {
      if (d) setActivityMaster(JSON.parse(d));
    });
    AsyncStorage.getItem('dropdown_unit').then(d => {
      if (d) setUnitMaster(JSON.parse(d));
    });
  }, [masterVersion]);

  // Lookup helper (optional)
  function getKpiLabelById(id) {
    const found = kpiMaster.find(kpi => String(kpi.value) === String(id));
    return found ? found.label : id;
  }
  function getActivityLabelById(id) {
    const found = activityMaster.find(a => String(a.id) === String(id));
    return found ? found.activity : id;
  }
  function getUnitLabelById(id) {
    const found = unitMaster.find(
      u => String(u.value) === String(id) || String(u.modelOnly) === String(id),
    );
    return found ? found.label : id;
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchDataAutoSync(true);
  };

  // Expand/collapse
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Edit/delete: only online
  const handleEdit = (item: DailyActivity) => {
    Alert.alert(
      'Edit Daily',
      `Apakah Anda ingin mengedit data untuk ${item.employee_name}?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Edit',
          onPress: () => {
            navigation.navigate('EditDailyActivity', {id: item.id});
          },
        },
      ],
    );
  };

  const handleDelete = useCallback(
    async (id: number) => {
      if (!isConnected) {
        Toast.show({
          type: 'error',
          text1: 'Offline',
          text2: 'Hapus hanya tersedia saat online.',
        });
        return;
      }

      try {
        const loginCache = await AsyncStorage.getItem('loginCache');
        const token = loginCache ? JSON.parse(loginCache).token : null;
        if (!token) {
          Toast.show({
            type: 'error',
            text1: 'Sesi Habis',
            text2: 'Silakan login kembali.',
          });
          return;
        }

        Alert.alert('Konfirmasi Hapus', 'Yakin ingin menghapus data ini?', [
          {text: 'Batal', style: 'cancel'},
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await fetch(
                  `${API_BASE_URL.mop}/dayActivities/${id}/delete`,
                  {
                    method: 'DELETE',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                    },
                  },
                );
                const text = await res.text();
                const json = JSON.parse(text);

                if (json.success) {
                  Toast.show({
                    type: 'success',
                    text1: 'Berhasil Dihapus ✅',
                    text2: json.message || 'Data berhasil dihapus.',
                  });
                  fetchDataAutoSync(true);
                } else {
                  Toast.show({
                    type: 'error',
                    text1: 'Gagal Menghapus ❌',
                    text2: json.message || 'Terjadi kesalahan.',
                  });
                }
              } catch (err) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Terjadi kesalahan saat menghapus.',
                });
              }
            },
          },
        ]);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Terjadi kesalahan.',
        });
      }
    },
    [fetchDataAutoSync, isConnected],
  );

  // Filtering & paging
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.employee_name?.toLowerCase().includes(q) ||
      item.jde_no?.toLowerCase().includes(q) ||
      item.site?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page jika search/paging berubah
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(1);
    }
  }, [searchQuery, pageSize, totalPages, page]);

  // Reset expand card saat filter/page berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // Loading Spinner
  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={[
          styles.containerLoading,
          {paddingTop: insets.top, paddingBottom: insets.bottom},
        ]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.titleLoading}>Memuat data...</Text>
          <Text style={styles.subtitle}>Mohon tunggu sebentar</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- UI ---
  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
          {/* --- Judul halaman dan Force Refresh --- */}
          <View style={{marginBottom: 10, marginTop: 2}}>
            {/* Judul halaman */}
            <Text style={[styles.pageTitle, {marginBottom: 2}]}>
              Daily Activity
            </Text>
          </View>
          {/* Search */}
          <TextInput
            placeholder="Cari Nama, JDE, atau Site..."
            value={searchQuery}
            onChangeText={text => {
              setSearchQuery(text);
              setPage(1);
            }}
            style={styles.searchInput}
            {...(Platform.OS === 'ios'
              ? {clearButtonMode: 'while-editing'}
              : {})}
          />
          {/* Pilihan page size */}
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
                dropdownIconColor="#2463EB"
                mode="dropdown">
                {pageSizeOptions.map(size => (
                  <Picker.Item
                    key={size}
                    label={size.toString()}
                    value={size}
                  />
                ))}
              </Picker>
            </View>
          </View>
          {/* FlatList data */}
          <FlatList
            data={paginatedData}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              const expanded = item.id === expandedId;
              return (
                <Animatable.View
                  animation={expanded ? 'fadeInDown' : 'fadeInUp'}
                  duration={350}
                  style={[
                    styles.cardContainer,
                    expanded && styles.cardExpanded,
                  ]}>
                  {/* Card Header */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(item.id)}
                    style={{paddingBottom: expanded ? 0 : 8}}
                    activeOpacity={0.88}>
                    <View style={styles.cardHeader}>
                      <View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                          }}>
                          <View style={styles.avatar}>
                            <Icon
                              name="person-outline"
                              size={20}
                              color="#fff"
                            />
                          </View>
                          <View>
                            <Text style={styles.cardTitle}>
                              {item.employee_name}
                            </Text>
                            <Text style={styles.cardSubtitle}>
                              {item.position || item.site}
                            </Text>
                            <Text style={styles.cardSubtitle}>
                              JDE: {item.jde_no}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{alignItems: 'flex-end', minWidth: 70}}>
                        <Text style={styles.cardSite}>{item.site}</Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: '#888',
                            marginBottom: 3,
                          }}>
                          {item.date_activity?.split(' ')[0]}
                        </Text>
                        <Icon
                          name={
                            expanded
                              ? 'chevron-up-outline'
                              : 'chevron-down-outline'
                          }
                          size={18}
                          color="#bbb"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                  {/* Card Detail */}
                  {expanded && (
                    <View style={styles.cardDetail}>
                      <Text style={styles.cardDetailText}>
                        Jenis KPI: {getKpiLabelById(item.kpi_type)} -{' '}
                        {getActivityLabelById(item.activity)}
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Unit Detail: {getUnitLabelById(item.unit_detail)}
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Jumlah Peserta: {item.total_participant}
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Total Hours: {item.total_hour}
                      </Text>
                      <View style={styles.cardActionRow}>
                        <TouchableOpacity
                          style={[styles.editButton]}
                          onPress={() => handleEdit(item)}>
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.deleteButton,
                            !isConnected && {opacity: 0.4},
                          ]}
                          onPress={() => handleDelete(item.id)}
                          disabled={!isConnected}>
                          <Text style={styles.actionButtonText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
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
                style={{
                  textAlign: 'center',
                  marginVertical: 16,
                  color: 'gray',
                }}>
                Tidak ada data ditemukan.
              </Text>
            }
            contentContainerStyle={{
              paddingBottom: 100 + insets.bottom,
            }}
          />

          {/* Pagination Bar */}
          <View
            style={[
              styles.paginationContainer,
              {
                paddingBottom: insets.bottom || 18,
                borderColor: '#eee',
              },
            ]}>
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
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
