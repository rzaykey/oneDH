import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import {JCMItem} from '../../navigation/types';
import API_BASE_URL from '../../config';
import {p2hHistoryStyles as styles} from '../../styles/p2hHistoryStyles';
import {useSiteContext} from '../../context/SiteContext';

interface BadgeProps {
  label: string;
  color: string;
}

interface InfoEmptyProps {
  message?: string;
}

const API_URL = `${API_BASE_URL.onedh}/GetJCMDataOpen`;

const JCMOpenScreen: React.FC = () => {
  const [history, setHistory] = useState<JCMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();

  useEffect(() => {
    fetchHistory(false, 1); // awal muat
  }, [activeSite, user?.jdeno]);

  useEffect(() => {
    fetchHistory(false, 1); // saat limit berubah
  }, [limit]);

  const fetchHistory = async (isLoadMore = false, forcedPage?: number) => {
    if (isLoadMore) {
      if (isLoadingMore || !hasMore) return;
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setHasMore(true);
    }

    const currentPage = isLoadMore ? page + 1 : forcedPage ?? 1;

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      search,
    });

    try {
      const cache = await AsyncStorage.getItem('loginCache');
      const token = cache && JSON.parse(cache)?.token;

      if (!token) {
        setError('Session habis. Silakan login ulang.');
        setHistory([]);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json?.message || 'Gagal mengambil data.');
        setHistory([]);
      } else {
        const data: JCMItem[] = json.data || [];
        const totalPagesFromApi = json?.last_page || 1;

        if (isLoadMore) {
          setHistory(prev => [...prev, ...data]);
          setPage(currentPage);
        } else {
          setHistory(data);
          setPage(currentPage);
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
    fetchHistory(false, 1);
  };

  const renderItem = ({item}: {item: JCMItem}) => {
    const isExpanded = expandedId === Number(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.83}
        onPress={() => setExpandedId(isExpanded ? null : Number(item.id))}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          <Text style={styles.unitText}>{item.unitno}</Text>
          <Text style={styles.siteLabel}>
            {item.wono} - {item.wo_task_no}
          </Text>
        </View>

        {/* Task Description */}
        <Text style={styles.modelText}>{item.task_desc}</Text>

        {/* Mekanik Info */}
        <View style={styles.row}>
          <Icon name="person-circle-outline" size={17} color="#4886E3" />
          <Text style={styles.driverName}>
            {item.nama_mekanik} - {item.jde_mekanik}
          </Text>
        </View>

        {/* Tanggal & Waktu */}
        <View style={styles.rowSpace}>
          <Text style={styles.labelInfo}>
            Mulai: {item.tanggal_mulai} {item.waktu_mulai}
          </Text>
          <Text style={styles.labelInfo}>
            Selesai: {item.tanggal_selesai} {item.waktu_selesai}
          </Text>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <Badge label={`Durasi: ${item.durasi}`} color="#2196F3" />
          <Badge label={`Status: ${item.status}`} color="#4CAF50" />
        </View>
        {/* Extra Info */}
        <Text style={styles.ketValue}>
          Pengawas: {item.nama_pengawas}- {item.jde_pengawas}
        </Text>
        {/* Expanded Details */}
        {isExpanded && (
          <>
            {/* Remark Section */}
            <View style={styles.keteranganRow}>
              <Text style={styles.ketLabel}>Remark:</Text>
              <Text style={styles.ketValue} numberOfLines={0}>
                {item.remark || '-'}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const InfoEmpty: React.FC<InfoEmptyProps> = ({
    message = 'Data kosong/belum ada pengerjaan dari mekanik.',
  }) => (
    <View style={styles.emptyWrap}>
      <Icon
        name="file-tray-outline"
        size={56}
        color="#c9c9c9"
        style={{marginBottom: 6}}
      />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubText}>
        Silakan pastikan mekanik input pekerjaan dan data akan muncul di sini.
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
      start={{x: 2, y: 2}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={[styles.container]}>
        <View style={styles.headerWrap}>
          <Icon
            name="clipboard-outline"
            size={22}
            color="#2563eb"
            style={{marginRight: 20}}
          />
          <Text style={styles.title}>Data JCM Open</Text>
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
            placeholder="Cari wo / mekanik..."
            placeholderTextColor="#0f0f0f"
            value={search}
            onChangeText={text => setSearch(text)}
            onSubmitEditing={() => fetchHistory(false, 1)}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search !== '' && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                fetchHistory(false, 1);
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
              onEndReached={() => fetchHistory(true)}
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

export default JCMOpenScreen;
