import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {dashboardStyles as styles} from '../styles/dashboardStyles';
import {useSiteContext} from '../context/SiteContext';
import {cacheAllMasterData} from '../utils/cacheAllMasterData'; // path ke fungsi kamu

const carouselData = [
  {id: '1', text: 'Sed viverra nibh eget tincidunt convallis...'},
  {
    id: '2',
    text: 'Pengumuman: Maintenance server 25 Juni 2025 pukul 02:00 - 04:00 WIB.',
  },
  {id: '3', text: 'Promo! Update aplikasi untuk fitur terbaru OTPD.'},
];

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const carouselRef = useRef<FlatList<any>>(null);
  const {width: windowWidth} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [refreshingMaster, setRefreshingMaster] = useState(false);

  useEffect(() => {
    cacheAllMasterData(); // tidak perlu await
  }, []);
  // Ambil semua dari context!
  const {activeSite, setActiveSite, sites, user, setSites, setRoles, setUser} =
    useSiteContext();

  // Carousel auto scroll
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1 >= carouselData.length ? 0 : prev + 1;
        carouselRef.current?.scrollToIndex({index: next, animated: true});
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Ganti site, ambil site list dari AsyncStorage (fresh)
  const handleGantiSite = async () => {
    try {
      const data = await AsyncStorage.getItem('loginCache');
      if (data) {
        const session = JSON.parse(data);
        const siteList = [
          ...new Set(
            (session.role || session.roles || []).map((r: any) => r.code_site),
          ),
        ];
        navigation.replace('SitePicker', {sites: siteList});
      } else {
        alert('Data login tidak ditemukan.');
      }
    } catch {
      alert('Gagal mengambil data site.');
    }
  };

  const handleRefreshMaster = async () => {
    setRefreshingMaster(true);
    try {
      await cacheAllMasterData();
      Alert.alert('Berhasil', 'Master data berhasil diperbarui.');
    } catch (err) {
      Alert.alert('Gagal', 'Gagal refresh master data, cek koneksi.');
    } finally {
      setRefreshingMaster(false);
    }
  };

  // Logout, reset semua context state juga
  const handleLogout = async () => {
    await AsyncStorage.removeItem('loginCache');
    await AsyncStorage.removeItem('activeSite');
    setActiveSite(null);
    setRoles([]);
    setSites([]);
    setUser(null);
    navigation.replace('Login');
  };

  // Site chip (highlight active, bisa tap)
  const SiteChip: React.FC<{site: string}> = ({site}) => (
    <TouchableOpacity
      onPress={() => setActiveSite(site)}
      style={[styles.siteChip, activeSite === site && styles.siteChipActive]}>
      <Text
        style={[
          styles.siteChipText,
          activeSite === site && styles.siteChipTextActive,
        ]}>
        {site}
      </Text>
      {activeSite === site && (
        <Icon
          name="checkmark-circle"
          size={15}
          color="#3498db"
          style={{marginLeft: 3}}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#fff', paddingTop: insets.top}}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={{flex: 1}}>
            <Text style={styles.title}>Home</Text>
            <Icon name="person-circle" style={styles.avatarIcon} />
            <Text style={styles.welcome}>
              Welcome, {user?.name ?? 'user'}
              {user?.jdeno ? ` (${user.jdeno})` : ''} !
            </Text>
            {/* SITE PILIHAN */}
            {sites.length > 0 ? (
              <View style={styles.siteRow}>
                <Text style={styles.siteLabel}>Site: </Text>
                <FlatList
                  data={sites}
                  keyExtractor={s => s}
                  renderItem={({item}) => <SiteChip site={item} />}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{alignItems: 'center'}}
                />
              </View>
            ) : (
              <Text
                style={{
                  color: 'red',
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 'bold',
                }}>
                Tidak ada site yang bisa dipilih.
              </Text>
            )}
            <Text style={styles.notif}>Notification</Text>
          </View>
          {/* Dropdown trigger */}
          <TouchableOpacity
            style={{padding: 10}}
            onPress={() => setDropdownVisible(true)}>
            <Icon name="ellipsis-vertical" size={26} color="#1E90FF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleRefreshMaster}
          style={{
            backgroundColor: '#1E90FF',
            padding: 13,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 16,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
          disabled={refreshingMaster}>
          {refreshingMaster ? (
            <ActivityIndicator color="#fff" style={{marginRight: 7}} />
          ) : (
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>
              Refresh Data Master
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            padding: 8,
            backgroundColor: '#22223b',
            borderRadius: 8,
            alignSelf: 'flex-end',
            margin: 8,
          }}
          onPress={() => navigation.navigate('MasterCacheScreen')}>
          <Text style={{color: 'white', fontWeight: 'bold'}}>
            🔎 Lihat Cache Master
          </Text>
        </TouchableOpacity>
        {/* Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setDropdownVisible(false)}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDropdownVisible(false);
                  handleGantiSite();
                }}>
                <Icon
                  name="swap-horizontal-outline"
                  size={20}
                  color="#1E90FF"
                />
                <Text style={styles.dropdownText}>Ganti Site</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDropdownVisible(false);
                  handleLogout();
                }}>
                <Icon name="log-out-outline" size={20} color="#e74c3c" />
                <Text style={styles.dropdownText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* CAROUSEL */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={carouselRef}
            data={carouselData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <View
                style={[
                  styles.carouselCard,
                  {
                    width: windowWidth * 0.8,
                    marginHorizontal: (windowWidth * 0.1) / 2,
                  },
                ]}>
                <Text
                  style={styles.carouselText}
                  numberOfLines={4}
                  ellipsizeMode="tail">
                  {item.text}
                </Text>
              </View>
            )}
            onMomentumScrollEnd={ev => {
              const idx = Math.round(
                ev.nativeEvent.contentOffset.x / (windowWidth * 0.8),
              );
              setCurrentIndex(idx);
            }}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: (windowWidth * 0.1) / 2,
            }}
            snapToInterval={windowWidth * 0.8}
            decelerationRate="fast"
            extraData={windowWidth}
          />
          <View style={styles.dotsContainer}>
            {carouselData.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : undefined,
                ]}
              />
            ))}
          </View>
        </View>
        {/* --- Tambah menu dashboard lain di sini --- */}
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;
