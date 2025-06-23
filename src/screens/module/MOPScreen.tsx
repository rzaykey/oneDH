import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
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

const mentoringForms = [
  {label: 'Form Digger', unitType: 'DIGGER', icon: 'cog', unitTypeId: 3},
  {label: 'Form Hauler', unitType: 'HAULER', icon: 'cog', unitTypeId: 4},
  {label: 'Form Bulldozer', unitType: 'BULLDOZER', icon: 'cog', unitTypeId: 2},
  {label: 'Form Grader', unitType: 'GRADER', icon: 'cog', unitTypeId: 5},
];

const sectionConfig = [
  {
    section: 'Mentoring',
    items: [
      {
        icon: 'folder-open-outline',
        label: 'Lihat Data Mentoring',
        screen: 'Data',
        action: 'read',
        module: 'MOP',
      },
      {
        icon: 'add-circle-outline',
        label: 'Tambah Data Mentoring',
        screen: '', // akan pakai custom handler
        action: 'add',
        module: 'MOP',
        customAction: 'openMentoringFormPicker',
      },
    ],
  },
  // ...section lain tetap
  {
    section: 'Daily Activity',
    items: [
      {
        icon: 'calendar-outline',
        label: 'Lihat Daily Activity',
        screen: 'DailyActivity',
        action: 'read',
        module: 'MOP',
      },
      {
        icon: 'add-circle-outline',
        label: 'Tambah Daily Activity',
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
        screen: 'TrainHours',
        action: 'read',
        module: 'MOP',
      },
      {
        icon: 'add-circle-outline',
        label: 'Tambah Train Hours',
        screen: 'AddTrainHours',
        action: 'add',
        module: 'MOP',
      },
      {
        icon: 'create-outline',
        label: 'Edit Train Hours',
        screen: 'EditTrainHours',
        action: 'edit',
        module: 'MOP',
      },
      {
        icon: 'trash-outline',
        label: 'Hapus Train Hours',
        screen: '', // butuh onPress custom delete
        action: 'delete',
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

  // Ambil permit dari context
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

  return (
    <SafeAreaView style={mopStyles.safeArea}>
      <ScrollView
        contentContainerStyle={mopStyles.container}
        showsVerticalScrollIndicator={false}>
        <Text style={mopStyles.title}>Mine Operator Performance</Text>
        {sectionConfig.map(section => (
          <View key={section.section}>
            <Text style={mopStyles.section}>{section.section}</Text>
            {section.items
              .filter(item => actionChecker[item.action](permit))
              .map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={mopStyles.button}
                  activeOpacity={0.85}
                  onPress={() =>
                    item.customAction === 'openMentoringFormPicker'
                      ? handleMentoringFormPress()
                      : item.screen && navigation.navigate(item.screen)
                  }>
                  <Icon
                    name={item.icon}
                    size={24}
                    color="#1E90FF"
                    style={{marginRight: 10}}
                  />
                  <Text style={mopStyles.buttonText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>

      {/* Modal Pilihan Form Mentoring */}
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
            <TouchableOpacity onPress={() => setShowMentoringFormPicker(false)}>
              <Text style={{color: '#e74c3c', marginTop: 14}}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MOPScreen;
