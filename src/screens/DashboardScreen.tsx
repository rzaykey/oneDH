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
import LinearGradient from 'react-native-linear-gradient';
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
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          {/* HEADER */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 14,
            }}>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.title,
                  {fontSize: 24, fontWeight: 'bold', color: '#183153'},
                ]}>
                Home
              </Text>
            </View>
            <TouchableOpacity
              style={{padding: 8}}
              onPress={() => setDropdownVisible(true)}>
              <Icon name="ellipsis-vertical" size={28} color="#1E90FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Icon name="person-circle" size={56} color="#1E90FF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
              {/* Info Baris 1: JDE No */}
              {user?.jdeno ? (
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileId}>JDE No: {user.jdeno}</Text>
                </View>
              ) : null}
              {/* Info Baris 2: Dept & Posisi */}
              <View style={styles.profileInfoRow}>
                {user?.dept && (
                  <Text style={styles.profileDept}>{user.dept}</Text>
                )}
              </View>
              <View style={styles.profileInfoRow}>
                {user?.position && (
                  <Text style={styles.profilePosition}>{user.position}</Text>
                )}
              </View>
              {/* Site */}
              <View style={styles.siteListRow}>
                <Text style={styles.siteListLabel}>Site:</Text>
                {sites.length > 0 ? (
                  <FlatList
                    data={sites}
                    keyExtractor={s => s}
                    renderItem={({item}) => <SiteChip site={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{alignItems: 'center'}}
                  />
                ) : (
                  <Text
                    style={{color: 'red', fontSize: 13, fontWeight: 'bold'}}>
                    Tidak ada site yang bisa dipilih.
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.notifCard}>
            <Icon
              name="notifications"
              size={20}
              color="#ff9800"
              style={{marginRight: 8}}
            />
            <Text style={styles.notifText}>Notification</Text>
          </View>

          {/* <TouchableOpacity
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
          </TouchableOpacity> */}
          {/* Dropdown Modal */}
          <Modal
            visible={dropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => {
                if (!refreshingMaster) setDropdownVisible(false);
              }}
              disabled={refreshingMaster} // ini juga bisa
            >
              <View style={styles.dropdownMenu}>
                {refreshingMaster ? (
                  <View style={{alignItems: 'center', padding: 16}}>
                    <ActivityIndicator size="large" color="#1E90FF" />
                    <Text style={{marginTop: 12}}>Memuat master data...</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={async () => {
                        // Modal tetap dibuka saat loading
                        await handleRefreshMaster();
                        setDropdownVisible(false); // Tutup setelah loading selesai
                      }}>
                      <Icon name="refresh-outline" size={20} color="#1E90FF" />
                      <Text style={styles.dropdownText}>
                        Refresh Master Data
                      </Text>
                    </TouchableOpacity>
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
                  </>
                )}
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
    </LinearGradient>
  );
};

export default DashboardScreen;
