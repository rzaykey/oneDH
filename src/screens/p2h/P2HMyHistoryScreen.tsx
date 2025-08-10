import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import API_BASE_URL from '../../config';
import {p2hHistoryStyles as styles} from '../../styles/p2hHistoryStyles';
import {useSiteContext} from '../../context/SiteContext';
import {P2HItem} from '../../navigation/types';
import {isAdminHSE} from '../../utils/role';

interface BadgeProps {
  label: string;
  color: string;
}

interface InfoEmptyProps {
  message?: string;
}

const API_URL = `${API_BASE_URL.onedh}/GetDataP2HPersonal`;

const P2HHistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<P2HItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {roles, user, activeSite} = useSiteContext();

  const canViewAll = isAdminHSE(roles, user, activeSite);

  useEffect(() => {
    fetchHistory();
  }, [activeSite, user?.jdeno, canViewAll]);

  useEffect(() => {
    setPage(1);
    fetchHistory();
  }, [limit]);

  const fetchHistory = async (isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
      setHasMore(true);
    }

    const currentPage = isLoadMore ? page + 1 : 1;

    let token = '';
    let user = null;

    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      if (loginCache) {
        const parsed = JSON.parse(loginCache);
        token = parsed?.token || '';
        user = parsed?.dataEmp || null;
      }

      if (!token || !user) {
        setError('Session habis. Silakan login ulang.');
        setHistory([]);
        return;
      }

      const effectiveSearch = !canViewAll && user?.jdeno ? user.jdeno : search;

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search: effectiveSearch,
      });

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json?.message || 'Gagal mengambil data.');
        setHistory([]);
      } else {
        let data: P2HItem[] = json.data || [];
        const totalPagesFromApi = json?.last_page || 1;

        if (!canViewAll && user?.jdeno) {
          data = data.filter(item => item.jdeno === user.jdeno);
        }

        if (isLoadMore) {
          setHistory(prev => [...prev, ...data]);
          setPage(currentPage);
        } else {
          setHistory(data);
          setPage(1);
        }

        setTotalPages(totalPagesFromApi);
        setHasMore(currentPage < totalPagesFromApi);
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server.');
      if (!isLoadMore) setHistory([]);
    }

    setLoading(false);
    setRefreshing(false);
    setIsLoadingMore(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({item}: {item: P2HItem}) => (
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
      {item.keterangan && (
        <View style={styles.keteranganRow}>
          <Text style={styles.ketLabel}>Keterangan: </Text>
          <Text style={styles.ketValue}>{item.keterangan}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const InfoEmpty: React.FC<InfoEmptyProps> = ({
    message = 'Data kosong/belum ada pemeriksaan P2H.',
  }) => (
    <View style={styles.emptyWrap}>
      <Image
        source={require('../../assets/images/empty.png')} // sesuaikan path jika beda
        style={{
          width: 240,
          height: 240,
          marginBottom: 12,
          resizeMode: 'contain',
        }}
      />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubText}>
        Silakan lakukan pemeriksaan P2H dan data akan muncul di sini.
      </Text>
    </View>
  );

  const Badge: React.FC<BadgeProps> = ({label, color}) => (
    <View
      style={[
        styles.badge,
        {backgroundColor: color + '22', borderColor: color},
      ]}>
      <Text style={[styles.badgeText, {color}]}>{label}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={[styles.container]}>
        <View style={styles.headerWrap}>
          <Icon
            name="clipboard-outline"
            size={22}
            color="#2563eb"
            style={{marginRight: 20}}
          />
          <Text style={styles.title}>Riwayat Pemeriksaan P2H Saya</Text>
        </View>

        <View style={styles.limitPickerWrap}>
          <Text style={styles.limitLabel}>Tampilkan:</Text>
          {[5, 10, 15, 25].map(val => (
            <TouchableOpacity
              key={val}
              onPress={() => setLimit(val)}
              style={[
                styles.limitButton,
                limit === val && styles.limitButtonActive,
              ]}>
              <Text
                style={[
                  styles.limitText,
                  limit === val && styles.limitTextActive,
                ]}>
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color="#888" />
          <TextInput
            placeholder="Cari unit / driver..."
            value={search}
            onChangeText={text => setSearch(text)}
            onSubmitEditing={() => fetchHistory()}
            style={styles.searchInput}
            returnKeyType="search"
            placeholderTextColor="#0f0f0f"
          />
          {search !== '' && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                fetchHistory();
              }}>
              <Icon name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
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
          <>
            <Text
              style={{textAlign: 'center', color: '#666', marginVertical: 6}}>
              Halaman {page} dari {totalPages}
            </Text>

            <FlatList
              data={history}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={<InfoEmpty />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4886E3']}
                />
              }
              onEndReached={() => {
                if (hasMore && !isLoadingMore) fetchHistory(true);
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ? (
                  <ActivityIndicator size="small" color="#4886E3" />
                ) : null
              }
            />
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default P2HHistoryScreen;
