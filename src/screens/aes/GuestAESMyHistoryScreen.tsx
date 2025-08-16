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
import {EASGuestItem} from '../../navigation/types';
import {isAdminHSE} from '../../utils/role';

interface BadgeProps {
  label: string;
  color: string;
}

interface InfoEmptyProps {
  message?: string;
}

const API_URL = `${API_BASE_URL.onedh}/ShowAgendaGuest`;

interface GuestItemProps {
  item: EASGuestItem;
  navigation: any;
}
const GuestItem: React.FC<GuestItemProps> = ({item, navigation}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.83}
      onPress={() => setExpanded(!expanded)} // toggle expand/collapse
    >
      {/* Kode agenda & nama tamu */}
      <View style={styles.headerRow}>
        <Text style={styles.unitTextCode}>{item.code_agenda}</Text>
        <Text style={styles.unitText}>{item.judul}</Text>
      </View>

      <Text style={styles.modelText}>Pemateri: {item.pemateri}</Text>
      <Text style={styles.modelText}>Kategori: {item.category}</Text>
      <Text style={styles.modelText}>Site: {item.site_code}</Text>
      <View style={styles.rowSpace}>
        <Text style={styles.labelInfo}>
          <Icon name="calendar-outline" size={15} color="#999" />{' '}
          {dayjs(item.start).format('DD MMM YYYY HH:mm')} -{' '}
          {dayjs(item.end).format('DD MMM YYYY HH:mm')}
        </Text>
      </View>
      {/* Detail muncul kalau expanded */}
      {expanded && (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.siteLabel}>{item.company}</Text>
          </View>

          <View style={{marginTop: 4, marginBottom: 4}}>
            <Text
              style={{
                color: item.status === 'Open' ? 'green' : 'red',
                fontWeight: '600',
              }}>
              Status: {item.status}
            </Text>
          </View>

          {item.remark && (
            <View style={styles.keteranganRow}>
              <Text style={styles.ketLabel}>Keterangan: </Text>
              <Text style={styles.ketValue}>{item.remark}</Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const GuestAESMyHistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<EASGuestItem[]>([]);
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

    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      if (loginCache) {
        const parsed = JSON.parse(loginCache);
        token = parsed?.token || '';
      }

      if (!token || !user) {
        setError('Session habis. Silakan login ulang.');
        setHistory([]);
        return;
      }

      const effectiveSearch =
        !canViewAll && user?.fid_guest ? user.fid_guest : search;

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
        let data: EASGuestItem[] = json.data || [];
        const totalPagesFromApi = json?.last_page || 1;

        if (!canViewAll && user?.jdeno) {
          data = data.filter(
            item => String(item.fid_guest) === String(user.jdeno),
          );
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

  // **RENDER ITEM PAKAI GuestItem**
  const renderItem = ({item}: {item: EASGuestItem}) => (
    <GuestItem item={item} navigation={navigation} />
  );

  const InfoEmpty: React.FC<InfoEmptyProps> = ({
    message = 'Data kosong/belum ada event.',
  }) => (
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
        Silakan buat event dan data akan muncul di sini.
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
          <Text style={styles.title}>Riwayat Event Saya</Text>
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
            placeholder="Cari event..."
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

        <Text style={{textAlign: 'center', color: '#888', marginBottom: 4}}>
          Jumlah data: {history.length}
        </Text>

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

export default GuestAESMyHistoryScreen;
