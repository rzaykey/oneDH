import React, {useEffect, useState} from 'react';
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
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import API_BASE_URL from '../../../config';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';

// Aktifkan LayoutAnimation Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const EditDailyActivity = ({route}) => {
  const {id} = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // State
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
  const [kpiOptions, setKpiOptions] = useState([]);
  const [activityOptions, setActivityOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitValue, setUnitValue] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // Online/offline
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state =>
      setIsConnected(state.isConnected === true),
    );
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsub();
  }, []);

  // Load Master Dropdown (cached only, supaya ringan)
  useEffect(() => {
    (async () => {
      // KPI
      const kpiCache = await AsyncStorage.getItem('dropdown_kpi');
      if (kpiCache) setKpiOptions(JSON.parse(kpiCache));
      // Unit
      const unitCache = await AsyncStorage.getItem('dropdown_unit');
      if (unitCache) setUnitOptions(JSON.parse(unitCache));
      // Activity master (all)
      const actCache = await AsyncStorage.getItem('cached_all_activity');
      if (actCache) {
        // Tidak setActivityOptions di sini, baru setelah user pilih KPI/site di bawah
      }
    })();
  }, []);

  // Ambil detail data untuk edit (prioritas dari server jika online, cache jika offline)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (isConnected) {
        try {
          const res = await axios.get(
            `${API_BASE_URL.mop}/dayActivities/${id}/edit`,
          );
          const rawData = res.data?.data;
          if (!rawData) return Alert.alert('Error', 'Data tidak ditemukan');
          setFormData({
            jde_no: rawData.jde_no || '',
            employee_name: rawData.employee_name || '',
            site: rawData.site || '',
            date_activity: rawData.date_activity || '',
            kpi_type: rawData.kpi_type || '',
            activity: rawData.activity || '',
            unit_detail: rawData.unit_detail || '',
            total_participant: String(rawData.total_participant || ''),
            total_hour: String(rawData.total_hour || ''),
          });
          setUnitValue(rawData.unit_detail || '');
          if (rawData.date_activity)
            setSelectedDate(new Date(rawData.date_activity));
        } catch {
          Alert.alert('Error', 'Gagal mengambil data detail dari server.');
        }
      } else {
        // OFFLINE: ambil dari cache index
        const cache = await AsyncStorage.getItem('cached_daily_activity_list');
        if (cache) {
          const arr = JSON.parse(cache);
          const rawData = arr.find(item => String(item.id) === String(id));
          if (rawData) {
            setFormData({
              jde_no: rawData.jde_no || '',
              employee_name: rawData.employee_name || '',
              site: rawData.site || '',
              date_activity: rawData.date_activity || '',
              kpi_type: rawData.kpi_type || '',
              activity: rawData.activity || '',
              unit_detail: rawData.unit_detail || '',
              total_participant: String(rawData.total_participant || ''),
              total_hour: String(rawData.total_hour || ''),
            });
            setUnitValue(rawData.unit_detail || '');
            if (rawData.date_activity)
              setSelectedDate(new Date(rawData.date_activity));
          } else {
            Alert.alert(
              'Offline',
              'Data tidak ditemukan di cache. Silakan online dulu.',
            );
          }
        } else {
          Alert.alert(
            'Offline',
            'Cache kosong. Silakan online untuk ambil data.',
          );
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id, isConnected]);

  // Filter Activity by KPI/site (baru setelah user pilih KPI)
  useEffect(() => {
    (async () => {
      if (!formData.kpi_type) return setActivityOptions([]);
      // Ambil semua activity master (dari cache)
      const actCache = await AsyncStorage.getItem('cached_all_activity');
      const allActivity = actCache ? JSON.parse(actCache) : [];
      // Filter by KPI + site (jika ada)
      const filtered = allActivity.filter(
        act =>
          String(act.kpi) === String(formData.kpi_type) &&
          (!act.site || act.site === formData.site),
      );
      setActivityOptions(
        filtered.map(act => ({
          label: act.activity,
          value: act.id,
        })),
      );
    })();
  }, [formData.kpi_type, formData.site]);

  // Handle KPI Change
  const onKpiChange = selectedKpi => {
    setFormData(prev => ({...prev, kpi_type: selectedKpi, activity: ''}));
  };
  const handleChange = (name, value) =>
    setFormData(prev => ({...prev, [name]: value}));

  // Date picker
  const handleDateChange = (_event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    const formatted = currentDate.toISOString().split('T')[0];
    handleChange('date_activity', formatted);
  };

  // Submit update (PUT)
  const handleSubmit = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'Edit hanya bisa disimpan ketika online.');
      return;
    }
    // Validasi
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
        return;
      }
    }
    if (!Number.isInteger(Number(formData.activity))) {
      Alert.alert('Validasi Gagal', 'Activity ID tidak valid.');
      return;
    }
    const payload = {
      edit_id: Number(id),
      edit_jde: formData.jde_no,
      edit_name: formData.employee_name,
      edit_site: formData.site,
      edit_date: formData.date_activity,
      edit_kpi: formData.kpi_type,
      edit_activity: Number(formData.activity),
      edit_unit_detail: Number(formData.unit_detail),
      edit_jml_peserta: Number(formData.total_participant),
      edit_total_hour: Number(formData.total_hour),
    };
    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      const token = loginCache ? JSON.parse(loginCache).token : null;
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login ulang.');
        return;
      }
      const response = await axios.put(
        `${API_BASE_URL.mop}/dayActivities/${id}/update`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.data.success) {
        Alert.alert(
          'Sukses',
          response.data.message || 'Data berhasil disimpan',
        );
        navigation.navigate('DailyActivity');
      } else {
        Alert.alert('Gagal', response.data.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors)
          .flat()
          .join('\n');
        Alert.alert('Validasi Gagal', messages);
      } else {
        Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
        }}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={{marginTop: 14}}>Loading data ...</Text>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 2, y: 2}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={{flex: 1}}>
        <KeyboardAwareScrollView
          contentContainerStyle={[
            addDailyAct.container,
            {paddingBottom: 24 + insets.bottom}, // Aman tombol simpan!
          ]}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={120}>
          {/* Status Online/Offline */}
          <View style={{alignItems: 'flex-end', marginBottom: 8, marginTop: 8}}>
            <Text
              style={{
                backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
                color: isConnected ? '#155724' : '#721c24',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 16,
                fontWeight: 'bold',
                fontSize: 13,
                alignSelf: 'flex-end',
              }}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </Text>
          </View>
          <Text
            style={[addDailyAct.header, {textAlign: 'center', marginTop: 6}]}>
            EDIT DAILY ACTIVITY
          </Text>

          {/* User Info */}
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
          {/* Activity Info */}
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
          {/* Unit Info */}
          <CollapsibleCard title="Unit Info">
            <Text style={addDailyAct.label}>Detail Unit</Text>
            <DropDownPicker
              open={unitOpen}
              value={unitValue}
              items={unitOptions}
              setOpen={setUnitOpen}
              setValue={setUnitValue}
              onChangeValue={val => {
                setUnitValue(val);
                handleChange('unit_detail', val);
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
          {/* Participant Info */}
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
          {/* Simpan */}
          <View style={{marginTop: 24}}>
            <Button title="Simpan" onPress={handleSubmit} />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EditDailyActivity;
