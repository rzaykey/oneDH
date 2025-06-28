import React, {useEffect, useState, useCallback, useRef} from 'react';
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
  AppState,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {tabelStyles as styles} from '../../../styles/tabelStyles';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {
  RootStackParamList,
  TrainHours as TrainHoursType,
} from '../../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';
import API_BASE_URL from '../../../config';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';

// Aktifkan animasi layout Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const pageSizeOptions = [5, 10, 50, 100];

type NavigationProp = StackNavigationProp<RootStackParamList, 'TrainHours'>;

export default function TrainHoursScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  // State
  const [data, setData] = useState<TrainHoursType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(true);
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
      const res = await fetch(`${API_BASE_URL.mop}/trainHours/summary`);
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
          const cache = await AsyncStorage.getItem('cached_trainhours_list');
          setData(cache ? JSON.parse(cache) : []);
          setLoading(false);
          setRefreshing(false);
          setIsSyncing(false);
          return;
        }
        // Ambil summary dari server
        const {max_id: serverMaxId, last_update: serverLastUpdate} =
          await getServerSummary();
        const localMaxId = await AsyncStorage.getItem('trainhours_max_id');
        const localLastUpdate = await AsyncStorage.getItem(
          'trainhours_last_update',
        );
        // Kalau ada perubahan, fetch ulang
        if (
          forceServer ||
          localMaxId !== serverMaxId ||
          localLastUpdate !== serverLastUpdate
        ) {
          const res = await fetch(`${API_BASE_URL.mop}/trainHours`);
          const json = await res.json();
          const arr = Array.isArray(json.data) ? json.data : [];
          setData(arr);
          await AsyncStorage.setItem(
            'cached_trainhours_list',
            JSON.stringify(arr),
          );
          await AsyncStorage.setItem('trainhours_max_id', serverMaxId || '');
          await AsyncStorage.setItem(
            'trainhours_last_update',
            serverLastUpdate || '',
          );
        } else {
          // Tidak ada perubahan, cukup pakai cache
          const cache = await AsyncStorage.getItem('cached_trainhours_list');
          setData(cache ? JSON.parse(cache) : []);
        }
        setLoading(false);
        setRefreshing(false);
        setIsSyncing(false);
      } catch (e) {
        const cache = await AsyncStorage.getItem('cached_trainhours_list');
        setData(cache ? JSON.parse(cache) : []);
        setLoading(false);
        setRefreshing(false);
        setIsSyncing(false);
      }
    },
    [isConnected],
  );

  // --- BACKGROUND SYNC INTERVAL (misal 2 menit) ---
  useEffect(() => {
    if (!isConnected) return;
    fetchDataAutoSync();
    syncIntervalRef.current = setInterval(() => {
      fetchDataAutoSync();
    }, 2 * 60 * 1000);
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') fetchDataAutoSync();
    });
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (appStateSub) appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, fetchDataAutoSync]);

  // Manual force refresh
  const handleForceRefresh = async () => {
    await fetchDataAutoSync(true);
    ToastAndroid.show('Data di-refresh dari server!', ToastAndroid.SHORT);
  };

  // Pull-to-refresh: cache only
  const onRefresh = () => {
    setRefreshing(true);
    AsyncStorage.getItem('cached_trainhours_list').then(cache => {
      setData(cache ? JSON.parse(cache) : []);
      setRefreshing(false);
    });
  };

  // Expand/collapse
  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Filter & paging
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.employee_name || '').toLowerCase().includes(q) ||
      (item.position || '').toLowerCase().includes(q) ||
      (item.training_type || '').toLowerCase().includes(q) ||
      (item.site || '').toLowerCase().includes(q)
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
  useEffect(() => {
    setExpandedId(null);
  }, [searchQuery, page, pageSize]);

  // Navigasi ke edit
  const handleEdit = (item: TrainHoursType) => {
    Alert.alert(
      'Edit Train Hours',
      `Apakah Anda ingin mengedit data untuk ${item.employee_name}?`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Edit',
          onPress: () => {
            navigation.navigate('EditTrainHours', {id: item.id});
          },
        },
      ],
    );
  };

  // Loading Spinner
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
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
        style={[
          {
            flex: 1,
            paddingHorizontal: 8,
            paddingTop: 20,
            paddingBottom: insets.bottom,
          },
        ]}>
        {/* Header & Sync */}
        <View style={{marginBottom: 10, marginTop: 2}}>
          {/* Judul */}
          <Text style={[styles.pageTitle, {marginBottom: 2}]}>Train Hours</Text>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Cari Nama, Position, Site..."
          value={searchQuery}
          onChangeText={text => {
            setSearchQuery(text);
            setPage(1);
          }}
          style={styles.searchInput}
          {...(Platform.OS === 'ios' ? {clearButtonMode: 'while-editing'} : {})}
        />

        {/* Picker jumlah item per halaman */}
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

        {/* List data utama */}
        <FlatList
          data={paginatedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => {
            const expanded = item.id === expandedId;
            return (
              <Animatable.View
                animation={expanded ? 'fadeInDown' : 'fadeInUp'}
                duration={320}
                style={styles.cardContainer}>
                {/* HEADER CARD */}
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
                      <Text style={styles.cardTitle}>{item.employee_name}</Text>
                      <Text style={styles.cardSubtitle}>
                        {item.position || item.site}
                      </Text>
                    </View>
                  </View>
                  <View style={{alignItems: 'flex-end', minWidth: 70}}>
                    <Text style={styles.cardSite}>{item.site}</Text>
                    <Text
                      style={{fontSize: 12, color: '#888', marginBottom: 3}}>
                      {(item.date_activity || '').split(' ')[0]}
                    </Text>
                    <Icon
                      name={
                        expanded ? 'chevron-up-outline' : 'chevron-down-outline'
                      }
                      size={18}
                      color="#bbb"
                    />
                  </View>
                </TouchableOpacity>

                {/* DETAIL CARD */}
                {expanded && (
                  <View style={styles.cardDetail}>
                    <Text style={styles.cardDetailText}>
                      Training:{' '}
                      <Text style={{fontWeight: 'bold'}}>
                        {item.training_type || '-'}
                      </Text>
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Unit:{' '}
                      <Text style={{fontWeight: 'bold'}}>
                        {item.unit_class || '-'}
                      </Text>
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Type Class:{' '}
                      <Text style={{fontWeight: 'bold'}}>
                        {(item.unit_type || '').split(' ')[0]}
                      </Text>
                    </Text>
                    <Text style={styles.cardDetailText}>
                      HM Start:{' '}
                      <Text style={{fontWeight: 'bold'}}>{item.hm_start}</Text>{' '}
                      - HM End:{' '}
                      <Text style={{fontWeight: 'bold'}}>{item.hm_end}</Text>
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Plan Total HM: {item.plan_total_hm} | Total HM:{' '}
                      {item.total_hm}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Progres: {item.progres}
                    </Text>
                    <Text style={styles.cardDetailText}>
                      Persentase Progres:{' '}
                      {item.plan_total_hm > 0
                        ? Math.round((item.progres / item.plan_total_hm) * 100)
                        : 0}
                      %
                    </Text>
                    {/* Tombol Edit */}
                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(item)}>
                        <Text style={styles.actionButtonText}>Edit</Text>
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
              style={{textAlign: 'center', marginVertical: 16, color: 'gray'}}>
              Tidak ada data ditemukan.
            </Text>
          }
          contentContainerStyle={{paddingBottom: 22}}
        />

        {/* Navigasi halaman (pagination) */}
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
