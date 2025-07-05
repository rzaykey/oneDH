import React, {useState} from 'react';
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
import {mopStyles} from '../../styles/mopStyles';
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
import Toast from 'react-native-toast-message';

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
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Data master berhasil di-refresh ✅',
        });
      } else {
        console.warn('⚠️ Token tidak ditemukan untuk refresh manual');
        Toast.show({
          type: 'error',
          text1: 'Token tidak ditemukan',
          text2: 'Gagal melakukan refresh data master.',
        });
      }
    } catch (err) {
      console.error('❌ Gagal refresh data master:', err?.message || err);
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: 'Gagal refresh data master ❌',
      });
    } finally {
      setLoadingMaster(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView
        style={[mopStyles.safeArea, {paddingTop: insets.top}]}
        pointerEvents={loadingMaster ? 'none' : 'auto'}>
        <ScrollView contentContainerStyle={mopStyles.container}>
          <Text style={mopStyles.title}>Mine Operator Performance</Text>

          <TouchableOpacity
            onPress={handleRefreshMaster}
            disabled={loadingMaster}
            style={[
              mopStyles.refreshButton,
              loadingMaster && mopStyles.refreshButtonDisabled,
            ]}>
            {loadingMaster ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFF"
                  style={mopStyles.refreshSpinner}
                />
                <Text style={mopStyles.refreshText}>Merefresh...</Text>
              </>
            ) : (
              <Text style={mopStyles.refreshText}>🔄 Refresh Data Master</Text>
            )}
          </TouchableOpacity>

          {sectionConfig.map(section => (
            <View key={section.section}>
              <Text style={mopStyles.section}>{section.section}</Text>
              {section.items
                .filter(item => actionChecker[item.action](permit))
                .map(item => (
                  <TouchableOpacity
                    key={item.label}
                    style={mopStyles.menuCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      item.customAction === 'openMentoringFormPicker'
                        ? handleMentoringFormPress()
                        : item.screen && navigation.navigate(item.screen)
                    }>
                    <View style={mopStyles.iconCircle}>
                      <Icon name={item.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View style={mopStyles.menuInfo}>
                      <Text style={mopStyles.menuLabel}>{item.label}</Text>
                      <Text style={mopStyles.menuDesc}>{item.desc}</Text>
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
          <View style={mopStyles.modalOverlay}>
            <View style={mopStyles.modalContainer}>
              <Text style={mopStyles.modalTitle}>Pilih Form Mentoring</Text>
              {mentoringForms.map(item => (
                <TouchableOpacity
                  key={item.unitType}
                  style={mopStyles.modalItem}
                  onPress={() => handleFormSelect(item)}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color="#6366f1"
                    style={mopStyles.modalIcon}
                  />
                  <Text style={mopStyles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowMentoringFormPicker(false)}>
                <Text style={mopStyles.modalCancel}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default MOPScreen;
