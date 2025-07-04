import React, {useState, useCallback} from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {mopStyles as styles} from '../../styles/mopStyles';
import {
  getModulePermit,
  canAdd,
  canEdit,
  canDelete,
  canRead,
  PermitType,
} from '../../utils/permit';
import {useSiteContext} from '../../context/SiteContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {cacheMopMasters} from '../../utils/cacheMopMasters'; // path disesuaikan
import {getSession} from '../../utils/auth';
import {useFocusEffect} from '@react-navigation/native';

const mentoringForms = [
  {
    label: 'Form Digger',
    unitType: 'DIGGER',
    icon: 'construct-outline',
    unitTypeId: 3,
  },
  {
    label: 'Form Hauler',
    unitType: 'HAULER',
    icon: 'construct-outline',
    unitTypeId: 4,
  },
  {
    label: 'Form Bulldozer',
    unitType: 'BULLDOZER',
    icon: 'construct-outline',
    unitTypeId: 2,
  },
  {
    label: 'Form Grader',
    unitType: 'GRADER',
    icon: 'construct-outline',
    unitTypeId: 5,
  },
];

const sectionConfig = [
  {
    section: 'Mentoring',
    items: [
      {
        icon: 'folder-open-outline',
        label: 'Lihat Data Mentoring',
        desc: 'Melihat daftar mentoring yang telah diinput',
        screen: 'Data',
        action: 'read',
        module: 'MOP',
      },
      {
        icon: 'add-circle-outline',
        label: 'Tambah Data Mentoring',
        desc: 'Menambahkan data baru berdasarkan tipe unit',
        screen: '',
        action: 'add',
        module: 'MOP',
        customAction: 'openMentoringFormPicker',
      },
    ],
  },
  {
    section: 'Daily Activity',
    items: [
      {
        icon: 'calendar-outline',
        label: 'Lihat Daily Activity',
        desc: 'Lihat riwayat aktivitas harian operator',
        screen: 'DailyActivity',
        action: 'read',
        module: 'MOP',
      },
      {
        icon: 'add-circle-outline',
        label: 'Tambah Daily Activity',
        desc: 'Input aktivitas operator per hari',
        screen: 'AddDailyActivity',
        action: 'add',
        module: 'MOP',
      },
    ],
  },
  {
    section: 'Train Hours',
    items: [
      {
        icon: 'timer-outline',
        label: 'Lihat Train Hours',
        desc: 'Lihat jam pelatihan operator',
        screen: 'TrainHours',
        action: 'read',
        module: 'MOP',
      },
      {
        icon: 'add-circle-outline',
        label: 'Tambah Train Hours',
        desc: 'Input jam pelatihan operator',
        screen: 'AddTrainHours',
        action: 'add',
        module: 'MOP',
      },
    ],
  },
  {
    section: 'MOP',
    items: [
      {
        icon: 'construct-outline',
        label: 'Data MOP',
        desc: 'Lihat data performa operator',
        screen: 'Mop',
        action: 'read',
        module: 'MOP',
      },
    ],
  },
];

const actionChecker = {
  add: canAdd,
  edit: canEdit,
  delete: canDelete,
  read: canRead,
};

const MOPScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {activeSite, roles} = useSiteContext();
  const [showMentoringFormPicker, setShowMentoringFormPicker] = useState(false);
  const insets = useSafeAreaInsets();
  const [loadingMaster, setLoadingMaster] = useState(false);

  const permit: PermitType = getModulePermit(roles, activeSite ?? '', 'MOP');

  const handleMentoringFormPress = () => setShowMentoringFormPicker(true);

  const handleFormSelect = (item: (typeof mentoringForms)[0]) => {
    setShowMentoringFormPicker(false);
    navigation.navigate('AddDataMentoring', {
      data: {
        unitType: item.unitType,
        unitTypeId: item.unitTypeId,
      },
    });
  };

  const handleRefreshMaster = async () => {
    setLoadingMaster(true);
    try {
      const session = await getSession();
      const token = session?.token;

      if (token) {
        await cacheMopMasters(token);
        console.log('🔄 Master MOP berhasil di-refresh manual');
        alert('Data master berhasil di-refresh ✅');
      } else {
        console.warn('⚠️ Token tidak ditemukan untuk refresh manual');
      }
    } catch (err) {
      console.error('❌ Gagal refresh data master:', err?.message || err);
      alert('Gagal refresh data master ❌');
    } finally {
      setLoadingMaster(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 2, y: 2}}
      end={{x: 1, y: 0}}>
      <SafeAreaView
        style={[styles.safeArea, {paddingTop: insets.top}]}
        pointerEvents={loadingMaster ? 'none' : 'auto'}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Mine Operator Performance</Text>
          <TouchableOpacity
            onPress={handleRefreshMaster}
            disabled={loadingMaster}
            style={[
              styles.refreshButton,
              loadingMaster && styles.refreshButtonDisabled,
            ]}>
            {loadingMaster ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFF"
                  style={styles.refreshSpinner}
                />
                <Text style={styles.refreshText}>Merefresh...</Text>
              </>
            ) : (
              <Text style={styles.refreshText}>🔄 Refresh Data Master</Text>
            )}
          </TouchableOpacity>

          {sectionConfig.map(section => (
            <View key={section.section}>
              <Text style={styles.section}>{section.section}</Text>
              {section.items
                .filter(item => actionChecker[item.action](permit))
                .map(item => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.menuCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      item.customAction === 'openMentoringFormPicker'
                        ? handleMentoringFormPress()
                        : item.screen && navigation.navigate(item.screen)
                    }>
                    <View style={styles.iconCircle}>
                      <Icon name={item.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuDesc}>{item.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          ))}
        </ScrollView>

        <Modal
          visible={showMentoringFormPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMentoringFormPicker(false)}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 24,
                width: 300,
                elevation: 3,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 18,
                  marginBottom: 12,
                  color: '#2d3748',
                }}>
                Pilih Form Mentoring
              </Text>
              {mentoringForms.map(item => (
                <TouchableOpacity
                  key={item.unitType}
                  style={{
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: 4,
                  }}
                  onPress={() => handleFormSelect(item)}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color="#6366f1"
                    style={{marginRight: 10}}
                  />
                  <Text style={{fontSize: 16, color: '#1a202c'}}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowMentoringFormPicker(false)}>
                <Text style={{color: '#e74c3c', marginTop: 14}}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default MOPScreen;
