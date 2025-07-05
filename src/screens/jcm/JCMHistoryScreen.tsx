import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Image,
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
import DateTimePicker from '@react-native-community/datetimepicker'; // pastikan paket ini sudah diinstall
import {getAuthHeader} from '../../utils/auth'; // sesuaikan path-nya
import Toast from 'react-native-toast-message';

interface BadgeProps {
  label: string;
  color: string;
}

interface InfoEmptyProps {
  message?: string;
}

const API_URL = `${API_BASE_URL.onedh}/ShowDataTaskAssignement`;
const API_URL_CT = `${API_BASE_URL.onedh}/CloseTaskAssignement`;

const JCMHistoryScreen: React.FC = () => {
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
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {user, activeSite} = useSiteContext();
  const [ddlStatus, setDdlStatus] = useState('RFU');
  const [remark, setRemark] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    fetchHistory(false, 1); // awal muat
  }, [activeSite, user?.jdeno]);

  useEffect(() => {
    fetchHistory(false, 1); // saat limit berubah
  }, [limit]);

  const fetchHistory = async (isLoadMore = false, forcedPage = 1) => {
    if (isLoadMore) {
      if (isLoadingMore || !hasMore) return;
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setHasMore(true);
    }

    const currentPage = isLoadMore ? page + 1 : forcedPage;

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
        if (!isLoadMore) {
          Toast.show({
            type: 'success',
            text1: 'Data Diperbarui',
            text2: `Menampilkan halaman ${totalPagesFromApi}`,
          });
        }
      }
    } catch (err) {
      setError('Tidak dapat terhubung ke server.');
      if (!isLoadMore) setHistory([]);
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory(false, 1);
  };

  useEffect(() => {
    if (showCloseModal && selectedItem) {
      // Set nilai default jika belum ada
      setDdlStatus(selectedItem?.status || 'Open');
      setSelectedDate(new Date(selectedItem?.tanggal || Date.now()));
      setRemark(selectedItem?.remark || '');

      const tanggal = selectedItem.tanggal_selesai; // e.g. "2025-07-03"
      const jam = selectedItem.waktu_selesai; // e.g. "14:30:00"

      if (tanggal && jam) {
        const combined = new Date(`${tanggal}T${jam}`);
        if (!isNaN(combined.getTime())) {
          setSelectedDate(combined);
        }
      } else {
        setSelectedDate(new Date()); // fallback ke waktu sekarang
      }
    }
  }, [showCloseModal, selectedItem]);

  const handleSubmitCloseJCM = async ({
    id,
    jde,
    wono,
    wotaskno,
    ddlstatus,
    tanggal,
    jam,
    remark,
  }: {
    id: string;
    jde: string;
    wono: string;
    wotaskno: string;
    ddlstatus: string;
    tanggal: string;
    jam: string;
    remark: string;
  }) => {
    try {
      const headers = await getAuthHeader();

      const body = {
        id,
        jde,
        wono,
        wotaskno,
        ddlstatus,
        tanggal,
        jam,
        remark,
      };

      const response = await fetch(`${API_URL_CT}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const text = await response.text();
      let res;

      try {
        res = JSON.parse(text);
      } catch (e) {
        console.error('Bukan JSON, ini HTML:', text);
        Toast.show({
          type: 'error',
          text1: 'Server Error',
          text2: 'Terjadi kesalahan di server. Coba lagi nanti.',
        });
        return;
      }

      if (response.ok && res?.status !== false) {
        Toast.show({
          type: 'success',
          text1: 'Berhasil Menutup JCM',
          text2: res.pesan || 'JCM berhasil ditutup.',
        });

        setShowCloseModal(false);
        fetchHistory(false, 1); // Refresh
      } else {
        if (res?.message === 'JDE Tidak Sama Dengan Job Card') {
          Toast.show({
            type: 'error',
            text1: 'Validasi Gagal',
            text2: 'JDE yang Anda kirim tidak sesuai dengan job card.',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Gagal Menutup JCM',
            text2: res?.message || 'Terjadi kesalahan.',
          });
        }
      }
    } catch (err) {
      console.error('Submit Close JCM error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Gagal mengirim data.',
      });
    }
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
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            setSelectedItem(item);
            setShowCloseModal(true);
          }}>
          <Text style={styles.closeButtonText}>Close JCM</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const InfoEmpty: React.FC<InfoEmptyProps> = ({
    message = 'Data kosong/belum ada melakukan pekerjaan.',
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
        Silakan pastikan input pekerjaan dan data akan muncul di sini.
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
          <Text style={styles.title}>Data JCM Saya</Text>
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
        <Modal
          visible={showCloseModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCloseModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Konfirmasi Close JCM {selectedItem?.wono}?
              </Text>

              {/* Informasi Unit dan Task */}
              <Text style={styles.modalLabel}>
                Unit: {selectedItem?.unitno}
              </Text>
              <Text style={styles.modalLabel}>
                WO Task No: {selectedItem?.wo_task_no}
              </Text>
              <Text style={styles.modalLabel}>
                WO Task Desc: {selectedItem?.task_desc}
              </Text>

              {/* Dropdown Status */}
              <Text style={styles.modalLabel}>Status:</Text>
              <View style={styles.statusOptions}>
                {['RFU', 'Pending Job', 'Pending Unit'].map(status => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setDdlStatus(status)}
                    style={[
                      styles.statusOption,
                      ddlStatus === status && styles.statusOptionSelected,
                    ]}>
                    <Text
                      style={[
                        styles.statusOptionText,
                        ddlStatus === status && styles.statusOptionTextSelected,
                      ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tanggal & Jam dalam Satu Row */}
              <Text style={styles.modalLabel}>Tanggal & Jam:</Text>
              <View style={styles.dateTimeRow}>
                {/* Tanggal */}
                <TouchableOpacity
                  style={styles.dateTimeBox}
                  onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.modalDateText}>
                    {selectedDate.toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </TouchableOpacity>

                {/* Jam */}
                <TouchableOpacity
                  style={styles.dateTimeBox}
                  onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.modalDateText}>
                    {selectedDate.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pickers */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const updated = new Date(selectedDate);
                      updated.setFullYear(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                      );
                      setSelectedDate(updated);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  is24Hour
                  display="default"
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) {
                      const updated = new Date(selectedDate);
                      updated.setHours(date.getHours());
                      updated.setMinutes(date.getMinutes());
                      setSelectedDate(updated);
                    }
                  }}
                />
              )}

              {/* Remark */}
              <Text style={styles.modalLabel}>Remark:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan keterangan"
                multiline
                value={remark}
                onChangeText={setRemark}
              />

              {/* Tombol Aksi */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    if (
                      selectedItem?.status !== 'Open' &&
                      selectedItem?.status !== null &&
                      selectedItem?.status !== ''
                    ) {
                      Alert.alert(
                        'Tidak bisa menutup JCM',
                        `Status saat ini adalah "${selectedItem.status}". Hanya JCM dengan status "Open" yang bisa ditutup.`,
                      );
                      return;
                    }

                    handleSubmitCloseJCM({
                      id: selectedItem?.id,
                      jde: selectedItem?.jde_mekanik,
                      wono: selectedItem?.wono,
                      wotaskno: selectedItem?.wo_task_no,
                      ddlstatus: ddlStatus,
                      tanggal: selectedDate.toISOString().split('T')[0],
                      jam: selectedDate.toTimeString().split(' ')[0],
                      remark,
                    });
                  }}>
                  <Text style={styles.modalButtonText}>Submit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, {backgroundColor: '#999'}]}
                  onPress={() => setShowCloseModal(false)}>
                  <Text style={styles.modalButtonText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default JCMHistoryScreen;
