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

const AddDailyActivity = () => {
  const navigation = useNavigation();
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

  const getSession = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const role = await AsyncStorage.getItem('userRole');
    const userString = await AsyncStorage.getItem('userData');
    const user = userString ? JSON.parse(userString) : null;
    const site = user?.site || '';
    return {token, role, site};
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const {token, role, site} = await getSession();
        const userString = await AsyncStorage.getItem('userData');
        const user = userString ? JSON.parse(userString) : null;

        if (!token || !role || !site || !user) {
          Alert.alert(
            'Error',
            'Token, site, atau role tidak ditemukan. Silakan login ulang.',
          );
          return;
        }

        setRole(role);
        setFormData(prev => ({
          ...prev,
          jde_no: user.username || '',
          employee_name: user.name || '',
          site: site,
        }));

        const kpiResp = await axios.get(`${API_BASE_URL.mop}/getKPI`, {
          headers: {Authorization: `Bearer ${token}`},
          params: {role},
        });

        const kpiData = kpiResp.data.map(kpi => ({
          label: kpi.kpi,
          value: kpi.kpi,
        }));
        setKpiOptions(kpiData);

        if (kpiData.length > 0) {
          const selectedKpi = kpiData[0].value;
          setFormData(prev => ({...prev, kpi_type: selectedKpi}));

          const activityResp = await axios.get(`${API_BASE_URL.mop}/getActivity`, {
            headers: {Authorization: `Bearer ${token}`},
            params: {
              kpi: selectedKpi,
              role,
              site,
            },
          });

          const actData = activityResp.data.map(act => ({
            label: act.activity,
            value: act.activity,
          }));
          setActivityOptions(actData);
        }

        const dayActResp = await axios.get(
          `${API_BASE_URL.mop}/dayActivities/createDailyAct`,
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );

        if (dayActResp.data.success) {
          const unitData = dayActResp.data.data.unit.map((item, index) => ({
            label: item.model,
            value: `${item.id}_${index}`,
            modelOnly: item.id,
          }));
          setUnitOptions(unitData);

          const emp = dayActResp.data.data.employee;
          setFormData(prev => ({
            ...prev,
            jde_no: emp.EmployeeId || prev.jde_no,
            employee_name: emp.EmployeeName || prev.employee_name,
          }));
        } else {
          Alert.alert(
            'Error',
            dayActResp.data.message || 'Gagal mengambil data unit & employee',
          );
        }
      } catch (error) {
        console.error('Error fetch initial data:', error);
        Alert.alert('Error', 'Terjadi kesalahan saat mengambil data awal');
      }
    };

    fetchInitialData();
  }, []);

  const onKpiChange = async selectedKpi => {
    setFormData(prev => ({...prev, kpi_type: selectedKpi, activity: ''}));
    try {
      const {token, role, site} = await getSession();
      if (!token || !role || !site) return;

      const activityResp = await axios.get(`${API_BASE_URL.mop}/getActivity`, {
        headers: {Authorization: `Bearer ${token}`},
        params: {kpi: selectedKpi, role, site},
      });

      const actData = activityResp.data.map(act => ({
        label: act.activity,
        value: act.id,
      }));
      setActivityOptions(actData);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil data activity');
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleDateChange = (_event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    const formatted = currentDate.toISOString().split('T')[0];
    handleChange('date_activity', formatted);
  };

  const handleSubmit = async () => {
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

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const response = await axios.post(
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

      if (response.data.success) {
        Alert.alert(
          'Sukses',
          response.data.message || 'Data berhasil disimpan',
        );
        setFormData(prev => ({
          ...prev,
          date_activity: '',
          kpi_type: '',
          activity: '',
          unit_detail: '',
          total_participant: '',
          total_hour: '',
        }));
        setUnitValue(null);
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

  return (
    <View style={{flex: 1}}>
      <KeyboardAwareScrollView
        contentContainerStyle={addDailyAct.container}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}>
        <Text style={addDailyAct.header}>INPUT DAILY ACTIVITY</Text>

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
              const selected = unitOptions.find(item => item.value === val);
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

        <Button title="Simpan" onPress={handleSubmit} />
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddDailyActivity;
