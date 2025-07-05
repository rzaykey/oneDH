import React, {useEffect, useState, useContext} from 'react';
import {
  Text,
  TextInput,
  Button,
  Alert,
  View,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import {addDailyAct} from '../../../styles/addDailyAct';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation} from '@react-navigation/native';
import API_BASE_URL from '../../../config';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';

import {addQueueOffline} from '../../../utils/offlineQueueHelper';
import {OfflineQueueContext} from '../../../utils/OfflineQueueContext';

// Enable layout animation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DAILY_QUEUE_KEY = 'daily_queue_offline';

const CollapsibleCard = ({title, children}) => {
  const [expanded, setExpanded] = useState(true);
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  return (
    <View style={addDailyAct.card}>
      <TouchableOpacity onPress={toggleExpand} style={addDailyAct.cardHeader}>
        <Text style={addDailyAct.cardTitle}>{title}</Text>
      </TouchableOpacity>
      {expanded && <View style={addDailyAct.cardBody}>{children}</View>}
    </View>
  );
};

const AddDailyActivity = () => {
  const navigation = useNavigation();
  const {dailyQueueCount, syncing, pushDailyQueue} =
    useContext(OfflineQueueContext);

  const [formData, setFormData] = useState({
    jde_no: '',
    employee_name: '',
    site: '',
    date_activity: '',
    kpi_type: '',
    activity: '',
    unit_detail: '',
    total_participant: '',
    total_hour: '',
  });

  const [role, setRole] = useState('');
  const [kpiOptions, setKpiOptions] = useState([]);
  const [activityOptions, setActivityOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitValue, setUnitValue] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  // ==== Pantau koneksi ====
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, []);

  // ==== Fetch master data, prefill, & cache ====
  // ... (import dan deklarasi lainnya tetap sama)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // ===== Ambil loginCache dari AsyncStorage =====
        const empString = await AsyncStorage.getItem('loginCache');
        const loginCache = empString ? JSON.parse(empString) : null;
        const emp = loginCache?.dataEmp || null;
        const userRole =
          loginCache && loginCache.role && loginCache.role[0]
            ? loginCache.role[0]
            : '';

        if (!emp) {
          Alert.alert(
            'Error',
            'User data tidak ditemukan di cache. Silakan login ulang.',
          );
          return;
        }

        // ===== Prefill user info (JDE, Name, Site, Role) =====
        setRole(userRole);
        setFormData(prev => ({
          ...prev,
          site: emp.site || '',
          jde_no: emp.jdeno || '',
          employee_name: emp.name || '',
        }));

        // ...lanjut ambil KPI, Activity, Unit, dsb.
        const kpiCache = await AsyncStorage.getItem('dropdown_kpi');
        const kpiData = kpiCache ? JSON.parse(kpiCache) : [];
        setKpiOptions(kpiData);

        // Activity
        const actCache = await AsyncStorage.getItem('cached_all_activity');
        const allAct = actCache ? JSON.parse(actCache) : [];

        // Unit
        const unitCache = await AsyncStorage.getItem('dropdown_unit');
        const unitData = unitCache ? JSON.parse(unitCache) : [];
        setUnitOptions(unitData);

        // Prefill KPI dan activity
        if (kpiData.length > 0) {
          const selectedKpiId = kpiData[0].value;
          setFormData(prev => ({...prev, kpi_type: selectedKpiId}));
          filterActivityByKpi(selectedKpiId, allAct, emp.site);
        }
      } catch (err) {
        Alert.alert('Error', 'Terjadi kesalahan saat mengambil data awal');
      }
    };
    fetchInitialData();
  }, []);

  // ==== Filter activity by KPI & site ====
  const filterActivityByKpi = async (kpiId, allActParam = null, site = '') => {
    let allAct = allActParam;
    if (!allAct) {
      const cache = await AsyncStorage.getItem('cached_all_activity');
      allAct = cache ? JSON.parse(cache) : [];
    }
    let filterSite = site;
    if (!filterSite) {
      const userString = await AsyncStorage.getItem('userData');
      const user = userString ? JSON.parse(userString) : null;
      filterSite = user?.site || '';
    }
    const filtered = allAct
      .filter(
        act =>
          String(act.kpi) === String(kpiId) &&
          (!filterSite ||
            String(act.site).toLowerCase() ===
              String(filterSite).toLowerCase()),
      )
      .map(act => ({
        label: act.activity,
        value: act.id,
      }));
    setActivityOptions(filtered);
  };

  // ==== Handler ganti KPI (dropdown) ====
  const onKpiChange = async selectedKpiId => {
    setFormData(prev => ({...prev, kpi_type: selectedKpiId, activity: ''}));
    const userString = await AsyncStorage.getItem('userData');
    const user = userString ? JSON.parse(userString) : null;
    filterActivityByKpi(selectedKpiId, null, user?.site || '');
  };

  // ==== Input handler universal ====
  const handleChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  // ==== Date picker handler ====
  const handleDateChange = (_event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    handleChange('date_activity', currentDate.toISOString().split('T')[0]);
  };

  // ==== Submit handler (Offline Queue) ====
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const requiredFields = [
      'jde_no',
      'employee_name',
      'site',
      'date_activity',
      'kpi_type',
      'activity',
      'unit_detail',
      'total_participant',
      'total_hour',
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert('Validasi Gagal', `Field "${field}" wajib diisi.`);
        setIsSubmitting(false);
        return;
      }
    }

    const loginCache = await AsyncStorage.getItem('loginCache');
    const token = loginCache ? JSON.parse(loginCache).token : null;
    if (!token) {
      Alert.alert('Error', 'Token tidak ditemukan. Silakan login ulang.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      id_local: Date.now() + '_' + Math.random().toString(36).slice(2, 10),
    };

    NetInfo.fetch().then(async state => {
      if (!state.isConnected) {
        await addQueueOffline(DAILY_QUEUE_KEY, payload);
        Alert.alert(
          'Offline',
          'Data disimpan ke antrian offline. Akan otomatis dikirim ke server saat online!',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({
                  ...formData,
                  date_activity: '',
                  kpi_type: '',
                  activity: '',
                  unit_detail: '',
                  total_participant: '',
                  total_hour: '',
                });
                setUnitValue(null);
                navigation.navigate('DailyActivity');
              },
            },
          ],
        );
        setIsSubmitting(false);
        return;
      }
      try {
        const res = await axios.post(
          `${API_BASE_URL.mop}/dayActivities`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );
        if (res.data.success) {
          Alert.alert('Sukses', res.data.message || 'Data berhasil disimpan');
          setFormData({
            ...formData,
            date_activity: '',
            kpi_type: '',
            activity: '',
            unit_detail: '',
            total_participant: '',
            total_hour: '',
          });
          setUnitValue(null);
          navigation.navigate('DailyActivity');
        } else {
          Alert.alert('Gagal', res.data.message || 'Gagal menyimpan data');
        }
      } catch (error) {
        Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data');
      }
      setIsSubmitting(false);
    });
  };

  // ==== UI ====
  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <View style={{flex: 1}}>
        <KeyboardAwareScrollView
          contentContainerStyle={addDailyAct.container}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={120}>
          <Text style={addDailyAct.header}>INPUT DAILY ACTIVITY</Text>

          {/* Badge/tombol Offline Queue */}
          {dailyQueueCount > 0 && (
            <View
              style={{
                backgroundColor: '#e74c3c',
                alignSelf: 'flex-end',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
                marginBottom: 8,
              }}>
              <Text style={{color: 'white'}}>
                {dailyQueueCount} data offline menunggu jaringan!
              </Text>
              {isConnected && (
                <TouchableOpacity
                  onPress={pushDailyQueue}
                  style={{
                    marginTop: 6,
                    backgroundColor: '#27ae60',
                    paddingVertical: 6,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={syncing}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>
                    {syncing ? 'Mengirim...' : 'Push Sekarang ke Server'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* User Info Card */}
          <CollapsibleCard title="User Info">
            <Text style={addDailyAct.label}>JDE No</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.jde_no}
              editable={false}
            />

            <Text style={addDailyAct.label}>Employee Name</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.employee_name}
              editable={false}
            />

            <Text style={addDailyAct.label}>Site</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.site}
              editable={false}
            />
          </CollapsibleCard>

          {/* Activity Info Card */}
          <CollapsibleCard title="Activity Info">
            <Text style={addDailyAct.label}>Date Activity</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                style={addDailyAct.input}
                value={formData.date_activity}
                placeholder="YYYY-MM-DD"
                editable={false}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <Text style={addDailyAct.label}>KPI Type</Text>
            <RNPickerSelect
              onValueChange={onKpiChange}
              value={formData.kpi_type}
              placeholder={{label: 'Pilih KPI', value: ''}}
              items={kpiOptions}
              style={{
                inputIOS: addDailyAct.pickerSelectIOS,
                inputAndroid: addDailyAct.pickerSelectAndroid,
              }}
            />

            <Text style={addDailyAct.label}>Activity</Text>
            <RNPickerSelect
              onValueChange={val => handleChange('activity', val)}
              value={formData.activity}
              placeholder={{label: 'Pilih Activity', value: ''}}
              items={activityOptions}
              style={{
                inputIOS: addDailyAct.pickerSelectIOS,
                inputAndroid: addDailyAct.pickerSelectAndroid,
              }}
            />
          </CollapsibleCard>

          {/* Unit Info Card */}
          <CollapsibleCard title="Unit Info">
            <Text style={addDailyAct.label}>Detail Unit</Text>
            <DropDownPicker
              open={unitOpen}
              value={unitValue}
              items={unitOptions}
              setOpen={setUnitOpen}
              setValue={val => {
                setUnitValue(val());
                const selected = unitOptions.find(item => item.value === val());
                handleChange('unit_detail', selected?.modelOnly || '');
              }}
              setItems={setUnitOptions}
              placeholder="Pilih Unit"
              searchable
              listMode="MODAL"
              modalTitle="Pilih Unit"
              modalProps={{animationType: 'slide'}}
              dropDownDirection="AUTO"
              zIndex={3000}
              zIndexInverse={1000}
            />
          </CollapsibleCard>

          {/* Participant Info Card */}
          <CollapsibleCard title="Participant Info">
            <Text style={addDailyAct.label}>Total Participant</Text>
            <TextInput
              style={addDailyAct.input}
              keyboardType="numeric"
              value={formData.total_participant}
              onChangeText={text => handleChange('total_participant', text)}
            />

            <Text style={addDailyAct.label}>Total Hour</Text>
            <TextInput
              style={addDailyAct.input}
              keyboardType="numeric"
              value={formData.total_hour}
              onChangeText={text => handleChange('total_hour', text)}
            />
          </CollapsibleCard>

          {/* Submit Button */}
          <Button
            title={isSubmitting || syncing ? 'Menyimpan...' : 'Simpan'}
            onPress={handleSubmit}
            disabled={isSubmitting || syncing}
          />

          {/* Indikator status sinkronisasi */}
          <View style={{marginTop: 12, alignItems: 'center'}}>
            {!isConnected ? (
              <Text style={{color: '#a94442'}}>
                📡 Offline: Data akan dikirim otomatis saat online.
              </Text>
            ) : syncing ? (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ActivityIndicator size="small" color="#555" />
                <Text style={{marginLeft: 8}}>Sinkronisasi...</Text>
              </View>
            ) : null}
          </View>
        </KeyboardAwareScrollView>
      </View>
    </LinearGradient>
  );
};

export default AddDailyActivity;
