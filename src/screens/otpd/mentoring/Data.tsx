import React, {useEffect, useState, useCallback} from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  UIManager,
  Platform,
  ToastAndroid,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {tabelStyles as styles} from '../../../styles/tabelStyles';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, MentoringData} from '../../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import API_BASE_URL from '../../../config';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const pageSizeOptions = [5, 10, 50, 100];
type NavigationProp = StackNavigationProp<RootStackParamList, 'Data'>;

export default function Data() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // State utama
  const [data, setData] = useState<MentoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // -- Online/Offline Detection
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state =>
      setIsConnected(state.isConnected === true),
    );
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsub();
  }, []);

  // Ambil summary (untuk auto-update)
  const getSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL.mop}/mentoring/summaryMentoring`);
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
          const cache = await AsyncStorage.getItem('cached_mentoring_data');
          setData(cache ? JSON.parse(cache) : []);
          setLoading(false);
          setRefreshing(false);
          setSyncing(false);
          return;
        }

        // ONLINE: Cek last_update
        const summary = await getSummary();
        const lastUpdate = summary?.last_update || '';
        const localUpdate = await AsyncStorage.getItem('mentoring_last_update');

        // Jika ada update, atau force refresh
        if (forceServer || (lastUpdate && lastUpdate !== localUpdate)) {
          // Fetch baru!
          const res = await fetch(`${API_BASE_URL.mop}/mentoring-data`);
          const json = await res.json();
          const arr = Array.isArray(json) ? json : json.data || [];
          setData(arr);
          await AsyncStorage.setItem(
            'cached_mentoring_data',
            JSON.stringify(arr),
          );
          await AsyncStorage.setItem('mentoring_last_update', lastUpdate || '');
        } else {
          // Tidak ada perubahan, load dari cache saja
          const cache = await AsyncStorage.getItem('cached_mentoring_data');
          setData(cache ? JSON.parse(cache) : []);
        }
      } catch (err) {
        const cache = await AsyncStorage.getItem('cached_mentoring_data');
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
    // Auto-poll background setiap 1 menit jika online
    let interval;
    if (isConnected) {
      interval = setInterval(() => fetchDataAutoSync(), 60 * 1000);
    }
    return () => interval && clearInterval(interval);
  }, [fetchDataAutoSync, isConnected]);

  // Force Refresh button
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

  // Expand/collapse card detail
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Edit/Delete: Disable if offline or while syncing
  const handleEdit = (item: MentoringData) => {
    if (!isConnected || syncing) {
      Alert.alert(
        'Offline',
        'Edit hanya tersedia saat online & tidak sedang sync.',
      );
      return;
    }
    Alert.alert(
      'Edit Data',
      `Apakah Anda ingin mengedit data untuk ${item.operator_name}?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Edit',
          onPress: () =>
            navigation.navigate('EditDataMentoring', {id: item.id}),
        },
      ],
    );
  };

  const handleDelete = useCallback(
    async (id: number) => {
      if (!isConnected || syncing) {
        Alert.alert(
          'Offline',
          'Hapus hanya tersedia saat online & tidak sedang sync.',
        );
        return;
      }
      try {
        const loginCache = await AsyncStorage.getItem('loginCache');
        const token = loginCache ? JSON.parse(loginCache).token : null;
        if (!token) return Alert.alert('Sesi Habis', 'Silakan login kembali.');
        Alert.alert('Konfirmasi Hapus', 'Yakin ingin menghapus data ini?', [
          {text: 'Batal', style: 'cancel'},
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await fetch(
                  `${API_BASE_URL.mop}/mentoring/${id}/delete`,
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
                  Alert.alert('Sukses', json.message);
                  fetchDataAutoSync(true);
                } else {
                  Alert.alert('Gagal', json.message || 'Gagal menghapus data.');
                }
              } catch (err) {
                Alert.alert('Error', 'Terjadi kesalahan saat menghapus.');
              }
            },
          },
        ]);
      } catch (err) {
        Alert.alert('Error', 'Terjadi kesalahan.');
      }
    },
    [fetchDataAutoSync, isConnected, syncing],
  );

  // Filter pencarian
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.trainer_name.toLowerCase().includes(q) ||
      item.operator_name.toLowerCase().includes(q) ||
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

  // Reset expanded card saat search/pagination berubah
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // Loader
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={{marginTop: 12}}>Memuat data...</Text>
      </SafeAreaView>
    );
  }

  // --- UI ---
  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 2, y: 2}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={{flex: 1, marginVertical: 18}}>
        <View style={{flex: 1, paddingHorizontal: 8, paddingTop: 20}}>
          <Text style={styles.pageTitle}>Data Mentoring</Text>

          <TextInput
            placeholder="Cari Trainer, Operator, atau Site..."
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

          <FlatList
            data={paginatedData}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              const expanded = item.id === expandedId;
              return (
                <Animatable.View
                  animation={expanded ? 'fadeInDown' : 'fadeInUp'}
                  duration={350}
                  style={styles.cardContainer}>
                  <TouchableOpacity
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.88}
                    style={styles.cardHeader}>
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
                        <Text style={styles.cardTitle}>
                          {item.operator_name}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          {item.trainer_name}
                        </Text>
                      </View>
                    </View>
                    <View style={{alignItems: 'flex-end', minWidth: 70}}>
                      <Text style={styles.cardSite}>{item.site}</Text>
                      <Icon
                        name={
                          expanded
                            ? 'chevron-up-outline'
                            : 'chevron-down-outline'
                        }
                        size={18}
                        color="#bbb"
                        style={{marginTop: 2}}
                      />
                    </View>
                  </TouchableOpacity>

                  {expanded && (
                    <View style={styles.cardDetail}>
                      <Text style={styles.cardDetailText}>
                        Area:{' '}
                        <Text style={{fontWeight: 'bold'}}>{item.area}</Text>
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Unit Class:{' '}
                        <Text style={{fontWeight: 'bold'}}>
                          {item.class_name}
                        </Text>
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Date:{' '}
                        <Text style={{fontWeight: 'bold'}}>
                          {item.date_mentoring.split(' ')[0]}
                        </Text>
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Hour:{' '}
                        <Text style={{fontWeight: 'bold'}}>
                          {item.start_time} - {item.end_time}
                        </Text>
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Point Observasi:{' '}
                        <Text style={{fontWeight: 'bold'}}>
                          {item.average_point_observation}
                        </Text>
                      </Text>
                      <Text style={styles.cardDetailText}>
                        Point Mentoring:{' '}
                        <Text style={{fontWeight: 'bold'}}>
                          {item.average_point_mentoring}
                        </Text>
                      </Text>
                      <View style={styles.cardActionRow}>
                        <TouchableOpacity
                          style={[
                            styles.editButton,
                            (!isConnected || syncing) && {opacity: 0.5},
                          ]}
                          onPress={() => handleEdit(item)}
                          disabled={!isConnected || syncing}>
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.deleteButton,
                            (!isConnected || syncing) && {opacity: 0.5},
                          ]}
                          onPress={() => handleDelete(item.id)}
                          disabled={!isConnected || syncing}>
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

          <View
            style={[
              styles.paginationContainer,
              {
                paddingBottom: insets.bottom || 18,
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
