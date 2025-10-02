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
  Modal,
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
import {EASItem} from '../../navigation/types';
import {isAdminHSE} from '../../utils/role';
import {launchImageLibrary} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
interface BadgeProps {
  label: string;
  color: string;
}

interface InfoEmptyProps {
  message?: string;
}

const API_URL = `${API_BASE_URL.onedh}/GetMyAgenda`;
const API_URL_SG = `${API_BASE_URL.onedh}/ShowGuest`;

const AESMyHistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<EASItem[]>([]);
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showViewGuestModal, setShowViewGuestModal] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [guestList, setGuestList] = useState<any[]>([]);

  // Ambil token dari AsyncStorage untuk header auth
  const getAuthHeader = async () => {
    const cache = await AsyncStorage.getItem('loginCache');
    const token = cache ? JSON.parse(cache)?.token : null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const canViewAll = isAdminHSE(roles, user, activeSite);

  useEffect(() => {
    fetchHistory();
  }, [activeSite, user?.jdeno, canViewAll]);

  useEffect(() => {
    setPage(1);
    fetchHistory();
  }, [limit]);

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        setPhoto(response.assets[0]);
      }
    });
  };

  const fetchHistory = async (isLoadMore = false, resetSearch = false) => {
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

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
      });

      if (!resetSearch) {
        const effectiveSearch =
          !canViewAll && user?.fid_presenter ? user.fid_presenter : search;

        if (effectiveSearch && String(effectiveSearch).trim() !== '') {
          params.append('search', String(effectiveSearch).trim());
        }
      }

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json?.message || 'Gagal mengambil data.');
        setHistory([]);
      } else {
        let data: EASItem[] = json.data || [];
        const totalPagesFromApi = json?.last_page || 1;

        if (!canViewAll && user?.jdeno) {
          data = data.filter(
            item => String(item.fid_presenter) === String(user.jdeno),
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
      console.error('Fetch error:', err);
      setError('Tidak dapat terhubung ke server.');
      if (!isLoadMore) setHistory([]);
    }

    setLoading(false);
    setRefreshing(false);
    setIsLoadingMore(false);
  };

  const uploadCloseAgenda = async () => {
    try {
      const headers = await getAuthHeader();

      const formData = new FormData();
      formData.append('fid_agenda', selectedItem?.id);

      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'close_agenda.jpg',
        });
      }
      console.log(formData);
      const res = await fetch(`${API_BASE_URL.onedh}/CloseAgenda`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: `${
            data.notif || data.message || 'Event berhasil disimpan!'
          } (Kode: ${data.code || '-'})`,
          position: 'top',
          visibilityTime: 3000,
          topOffset: 40,
        });

        // Tutup modal dan reset photo
        setShowCloseModal(false);
        setPhoto(null);

        // Delay sedikit biar toast muncul
        setTimeout(() => {
          navigation.replace('AESMyHistory');
        }, 500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Gagal',
          text2: data.message || 'Gagal menyimpan event!',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 40,
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Terjadi kesalahan saat mengirim data!',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 40,
      });
    }
  };

  const fetchGuest = async (code_agenda: string) => {
    try {
      const headers = await getAuthHeader();

      const response = await fetch(`${API_URL_SG}?code_agenda=${code_agenda}`, {
        method: 'GET',
        headers,
      });
      const text = await response.text();

      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error('Response bukan JSON. Cek API backend.');
      }

      if (!response.ok) {
        console.error('Fetch Guest Gagal:', json);
        return;
      }
      setGuestList(json.data || []);
    } catch (err) {
      console.error('Fetch Guest Error:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({item}: {item: EASItem}) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.83}
      onPress={() =>
        navigation.navigate('EditPresentAESScreen', {
          agendaId: item.id,
          code: item.code,
        })
      }>
      <View style={styles.headerRow}>
        <Text style={styles.unitTextCode}>{item.code}</Text>
      </View>
      <View style={styles.headerRow}>
        <Text style={styles.unitText}>{item.judul}</Text>
        <Text style={styles.siteLabel}>{item.site}</Text>
      </View>
      <Text style={styles.modelText}>{item.category}</Text>
      <View style={styles.row}>
        <Icon name="person-circle-outline" size={17} color="#4886E3" />
        <Text style={styles.driverName}>{item.pemateri} (Pemateri)</Text>
      </View>
      <View style={styles.rowSpace}>
        <Text style={styles.labelInfo}>
          <Icon name="calendar-outline" size={15} color="#999" />{' '}
          {dayjs(item.start).format('DD MMM YYYY HH:mm')} -{' '}
          {dayjs(item.end).format('HH:mm')}
        </Text>
        <Text style={styles.hmkm}>{item.status}</Text>
      </View>
      {item.remark && (
        <View style={styles.keteranganRow}>
          <Text style={styles.ketLabel}>Deskripsi: </Text>
          <Text style={styles.ketValue}>{item.remark}</Text>
        </View>
      )}

      {item.status == 'Open' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setSelectedItem(item);
              setShowCloseModal(true);
            }}>
            <Text style={styles.closeButtonText}>Close Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewGuestButton}
            onPress={() => {
              setSelectedItem(item);
              fetchGuest(item.code); // ambil data berdasarkan code agenda
              setShowViewGuestModal(true);
            }}>
            <Text style={styles.buttonText}>View Guest</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.status == 'Close' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.viewGuestButton}
            onPress={() => {
              setSelectedItem(item);
              fetchGuest(item.code); // ambil data berdasarkan code agenda
              setShowViewGuestModal(true);
            }}>
            <Text style={styles.buttonText}>View Guest</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
                fetchHistory(false, true); // param kedua tanda reset search
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
      <Modal visible={showCloseModal} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Close Agenda</Text>
            <Text style={styles.modalSubtitle}>{selectedItem?.tittle}</Text>

            {photo && (
              <Image source={{uri: photo.uri}} style={styles.modalImage} />
            )}

            <TouchableOpacity
              onPress={pickImage}
              style={styles.modalButtonBlue}>
              <Text style={styles.modalButtonText}>Pilih Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={uploadCloseAgenda}
              disabled={loading}
              style={[
                styles.modalButtonGreen,
                loading && styles.modalButtonDisabled,
              ]}>
              <Text style={styles.modalButtonText}>
                {loading ? 'Mengirim...' : 'Kirim'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCloseModal(false)}
              style={styles.modalButtonRed}>
              <Text style={styles.modalButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showViewGuestModal}
        animationType="fade"
        transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Daftar Peserta</Text>

            {/* Header Tabel */}
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                paddingBottom: 5,
                marginBottom: 5,
              }}>
              <Text style={{flex: 2, fontWeight: 'bold'}}>Nama</Text>
              <Text style={{flex: 2, fontWeight: 'bold'}}>Perusahaan</Text>
              <Text style={{flex: 2, fontWeight: 'bold'}}>Posisi</Text>
            </View>

            {/* Isi Tabel */}
            <FlatList
              style={{maxHeight: 300}} // supaya bisa scroll
              data={guestList}
              keyExtractor={(item, index) => item.id ?? index.toString()}
              renderItem={({item}) => (
                <View
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 4,
                    borderBottomWidth: 0.5,
                  }}>
                  <Text style={{flex: 2}}>{item.name_guest}</Text>
                  <Text style={{flex: 2}}>{item.company}</Text>
                  <Text style={{flex: 2}}>{item.position}</Text>
                </View>
              )}
            />

            <TouchableOpacity
              onPress={() => setShowViewGuestModal(false)}
              style={styles.modalButtonRed}>
              <Text style={styles.modalButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default AESMyHistoryScreen;
