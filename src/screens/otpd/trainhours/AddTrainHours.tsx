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
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useNavigation} from '@react-navigation/native';
import {addDailyAct} from '../../../styles/addDailyAct';
import NetInfo from '@react-native-community/netinfo';
import {OfflineQueueContext} from '../../../utils/OfflineQueueContext';
import {addQueueOffline} from '../../../utils/offlineQueueHelper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import axios from 'axios';
import API_BASE_URL from '../../../config';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRAINHOURS_QUEUE_KEY = 'trainhours_queue_offline';

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

const AddTrainHours = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {trainHoursQueueCount, pushTrainHoursQueue, syncing} =
    useContext(OfflineQueueContext);

  const [formData, setFormData] = useState({
    jde_no: '',
    employee_name: '',
    position: '',
    training_type: '',
    unit_class: '',
    unit_type: '',
    code: '',
    batch: '',
    plan_total_hm: '',
    hm_start: '',
    hm_end: '',
    total_hm: '',
    progres: '',
    site: '',
    date_activity: '',
  });

  const [trainingTypeOptions, setTrainingTypeOptions] = useState([]);
  const [trainingTypeOpen, setTrainingTypeOpen] = useState(false);
  const [trainingTypeValue, setTrainingTypeValue] = useState(null);

  const [filteredClassUnitOptions, setFilteredClassUnitOptions] = useState([]);
  const [classUnitArr, setClassUnitArr] = useState([]);
  const [allCodeUnitArr, setAllCodeUnitArr] = useState([]);

  const [unitClassOpen, setUnitClassOpen] = useState(false);
  const [unitTypeOptions, setUnitTypeOptions] = useState([]);
  const [unitTypeOpen, setUnitTypeOpen] = useState(false);
  const [codeOptions, setCodeOptions] = useState([]);
  const [codeOpen, setCodeOpen] = useState(false);
  const [batchOptions, setBatchOptions] = useState(
    [...Array(10)].map((_, i) => ({
      label: `Batch ${i + 1}`,
      value: `Batch ${i + 1}`,
    })),
  );
  const [batchOpen, setBatchOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // === Ambil master data, dropdown, dan prefill user ===
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoading(true);
      try {
        // 1. Pastikan user online
        const net = await NetInfo.fetch();
        setIsConnected(net.isConnected === true);
        if (!net.isConnected) {
          Alert.alert('Offline', 'Fitur ini hanya bisa digunakan saat online.');
          setIsLoading(false);
          return;
        }

        // 2. Ambil loginCache dari AsyncStorage
        let token = '';
        let username = '';
        try {
          const loginCacheStr = await AsyncStorage.getItem('loginCache');
          console.log('LoginCache:', loginCacheStr);
          if (loginCacheStr) {
            const loginCache = JSON.parse(loginCacheStr);
            token = loginCache.token || '';
            username = loginCache.dataEmp?.jdeno || '';
          }
        } catch (err) {
          console.log('[ERROR ambil loginCache]', err);
        }

        if (!token) {
          Alert.alert('Session Habis', 'Silakan login ulang.');
          setIsLoading(false);
          return;
        }

        // 3. Request master data pakai token & param JDE
        let url = `${API_BASE_URL.mop}/trainHours/create`;
        if (username) url += `?username=${username}`;

        console.log('[REQ] GET:', url, token);

        const response = await axios.get(url, {
          headers: {Authorization: `Bearer ${token}`},
        });

        const master = response.data?.data || {};

        if (!master) {
          Alert.alert('Error', 'Gagal load master data dari server.');
          setIsLoading(false);
          return;
        }

        // 4. Prefill user info (dari master.employeeAuth)
        if (master.employeeAuth) {
          setFormData(prev => ({
            ...prev,
            jde_no: master.employeeAuth.EmployeeId || '',
            employee_name: master.employeeAuth.EmployeeName || '',
            position:
              master.employeeAuth.JobTtlName ||
              master.employeeAuth.PositionName ||
              '',
            site: master.employeeAuth.LocationGroupName || '',
          }));
        } else {
          Alert.alert('Error', 'Gagal prefill user dari API.');
        }

        // 5. Set semua dropdown dari response master
        setTrainingTypeOptions(
          (master.trainingType || master.kpi || []).map(item => ({
            label: item.kpi || item.training_type || item.class,
            value: item.id,
          })),
        );
        setUnitTypeOptions(
          (master.typeUnit || []).map(item => ({
            label: item.class,
            value: item.id,
          })),
        );
        setClassUnitArr(
          (master.classUnit || []).map(item => ({
            label: item.model,
            value: item.id,
            type: item.type,
            class: item.class,
          })),
        );
        setAllCodeUnitArr(
          (master.codeUnit || []).map(item => ({
            label: item.no_unit || item.NO_UNIT || item.code || '',
            value: item.id,
            fid_model: item.fid_model,
          })),
        );
      } catch (err) {
        // --- DEBUG LOG ---
        console.log(
          '[ERROR fetchMasterData]',
          err?.response?.data,
          err?.message,
          err,
        );
        Alert.alert(
          'Error',
          'Gagal load master train hours (pastikan online): ' +
            (err?.response?.data?.message || err?.message || ''),
        );
      }
      setIsLoading(false);
    };
    fetchMasterData();
  }, []);

  // === Handler Dropdown bertingkat ===
  const onChangeUnitType = val => {
    setFormData(prev => ({...prev, unit_type: val, unit_class: '', code: ''}));
    const filtered = classUnitArr.filter(
      item => String(item.class) === String(val),
    );
    setFilteredClassUnitOptions(filtered);
    setCodeOptions([]);
  };

  const onChangeUnitClass = val => {
    setFormData(prev => ({...prev, unit_class: val, code: ''}));
    const filteredCode = allCodeUnitArr.filter(
      code => String(code.fid_model) === String(val),
    );
    setCodeOptions(filteredCode);
  };

  const onChangeTrainingType = val => {
    setTrainingTypeValue(val);
    setFormData(prev => ({...prev, training_type: val}));
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  // === Date Picker ===
  const handleDateChange = (_event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    handleChange('date_activity', currentDate.toISOString().split('T')[0]);
  };

  // === Otomatis hitung total_hm & progres ===
  useEffect(() => {
    const start = Number(formData.hm_start) || 0;
    const end = Number(formData.hm_end) || 0;
    const plan = Number(formData.plan_total_hm) || 0;
    const total = end - start;
    setFormData(prev => ({
      ...prev,
      total_hm: total ? String(total) : '',
      progres: plan > 0 ? String(total) : '',
    }));
  }, [formData.hm_start, formData.hm_end, formData.plan_total_hm]);

  // === Submit (Tetap Offline First!) ===
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const requiredFields = [
      'jde_no',
      'employee_name',
      'position',
      'training_type',
      'unit_class',
      'unit_type',
      'code',
      'batch',
      'plan_total_hm',
      'hm_start',
      'hm_end',
      'total_hm',
      'progres',
      'site',
      'date_activity',
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert(
          'Validasi Gagal',
          `Field "${field.replace('_', ' ')}" wajib diisi.`,
        );
        setIsSubmitting(false);
        return;
      }
    }
    try {
      const payload = {...formData};
      payload.id_local =
        Date.now() + '_' + Math.random().toString(36).slice(2, 10);

      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        await addQueueOffline(TRAINHOURS_QUEUE_KEY, payload);
        Alert.alert(
          'Offline',
          'Data disimpan offline. Akan otomatis dikirim ke server saat online.',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({
                  jde_no: '',
                  employee_name: '',
                  position: '',
                  training_type: '',
                  unit_class: '',
                  unit_type: '',
                  code: '',
                  batch: '',
                  plan_total_hm: '',
                  hm_start: '',
                  hm_end: '',
                  total_hm: '',
                  progres: '',
                  site: '',
                  date_activity: '',
                });
                navigation.navigate('TrainHours');
              },
            },
          ],
        );
        setIsSubmitting(false);
        return;
      }

      // If online langsung POST
      try {
        const loginCache = await AsyncStorage.getItem('loginCache');
        const token = loginCache ? JSON.parse(loginCache).token : null;

        if (!token) {
          Alert.alert('Gagal', 'Token tidak ditemukan. Silakan login ulang.');
          return;
        }

        const response = await axios.post(
          `${API_BASE_URL.mop}/trainHours/store`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );

        console.log('Store success:', response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.warn('API Error:', error.response?.data || error.message);
        } else {
          console.warn('Unexpected Error:', error);
        }

        Alert.alert('Gagal', 'Terjadi kesalahan saat mengirim data.');
      }

      if (response.data.status || response.data.success) {
        Alert.alert(
          'Sukses',
          response.data.message || 'Data berhasil disimpan',
        );
        setFormData({
          jde_no: '',
          employee_name: '',
          position: '',
          training_type: '',
          unit_class: '',
          unit_type: '',
          code: '',
          batch: '',
          plan_total_hm: '',
          hm_start: '',
          hm_end: '',
          total_hm: '',
          progres: '',
          site: '',
          date_activity: '',
        });
        navigation.navigate('TrainHours');
      } else {
        Alert.alert('Gagal', response.data.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data');
    }
    setIsSubmitting(false);
  };

  // === UI ===
  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{marginTop: 10}}>Mengambil master data online...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <View style={{flex: 1, paddingBottom: insets.bottom}}>
        <KeyboardAwareScrollView
          contentContainerStyle={addDailyAct.container}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={120}>
          <Text style={addDailyAct.header}>INPUT TRAIN HOURS</Text>

          {/* Offline Badge & Push Button */}
          {trainHoursQueueCount > 0 && (
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
                {trainHoursQueueCount} data offline menunggu jaringan!
              </Text>
              <TouchableOpacity
                onPress={pushTrainHoursQueue}
                style={{
                  marginTop: 6,
                  backgroundColor: '#27ae60',
                  paddingVertical: 6,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: syncing ? 0.6 : 1,
                }}
                disabled={syncing}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>
                  {syncing ? 'Mengirim...' : 'Push Sekarang ke Server'}
                </Text>
                {syncing && (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={{marginLeft: 8}}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Employee Info Section */}
          <CollapsibleCard title="Employee Info">
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
            <Text style={addDailyAct.label}>Position</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.position}
              editable={false}
            />
          </CollapsibleCard>

          {/* Training Info Section */}
          <CollapsibleCard title="Training Info">
            <Text style={addDailyAct.label}>Training Type</Text>
            <DropDownPicker
              listMode="MODAL"
              open={trainingTypeOpen}
              value={trainingTypeValue}
              items={trainingTypeOptions}
              setOpen={setTrainingTypeOpen}
              setValue={val => onChangeTrainingType(val())}
              setItems={setTrainingTypeOptions}
              placeholder="Pilih Training Type"
              searchable
              zIndex={3500}
              zIndexInverse={3000}
            />
            <Text style={addDailyAct.label}>Batch</Text>
            <DropDownPicker
              listMode="MODAL"
              open={batchOpen}
              value={formData.batch}
              items={batchOptions}
              setOpen={setBatchOpen}
              setValue={val => {
                setBatchOpen(false);
                handleChange('batch', val());
              }}
              setItems={setBatchOptions}
              placeholder="Pilih Batch"
              searchable
              zIndex={3000}
              zIndexInverse={1000}
            />
          </CollapsibleCard>

          {/* Unit Info Section */}
          <CollapsibleCard title="Unit Info">
            <Text style={addDailyAct.label}>Unit Type</Text>
            <DropDownPicker
              listMode="MODAL"
              open={unitTypeOpen}
              value={formData.unit_type}
              items={unitTypeOptions}
              setOpen={setUnitTypeOpen}
              setValue={val => onChangeUnitType(val())}
              setItems={setUnitTypeOptions}
              placeholder="Pilih Unit Type"
              searchable
              zIndex={2000}
              zIndexInverse={2500}
            />
            <Text style={addDailyAct.label}>Unit Class</Text>
            <DropDownPicker
              listMode="MODAL"
              open={unitClassOpen}
              value={formData.unit_class}
              items={filteredClassUnitOptions}
              setOpen={setUnitClassOpen}
              setValue={val => onChangeUnitClass(val())}
              setItems={setFilteredClassUnitOptions}
              placeholder={
                !formData.unit_type
                  ? 'Pilih Unit Type dahulu'
                  : 'Pilih Unit Class'
              }
              searchable
              disabled={!formData.unit_type}
              zIndex={2500}
              zIndexInverse={2000}
            />
            <Text style={addDailyAct.label}>Code</Text>
            <DropDownPicker
              listMode="MODAL"
              open={codeOpen}
              value={formData.code}
              items={codeOptions}
              setOpen={setCodeOpen}
              setValue={val => {
                setCodeOpen(false);
                handleChange('code', val());
              }}
              setItems={setCodeOptions}
              placeholder={
                !formData.unit_class ? 'Pilih Unit Class dahulu' : 'Pilih Code'
              }
              searchable
              disabled={!formData.unit_class}
              zIndex={1500}
              zIndexInverse={1000}
            />
          </CollapsibleCard>

          {/* Hour Info Section */}
          <CollapsibleCard title="Hour Info">
            <Text style={addDailyAct.label}>Plan Total HM</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.plan_total_hm}
              onChangeText={text => handleChange('plan_total_hm', text)}
              keyboardType="numeric"
            />
            <Text style={addDailyAct.label}>HM Start</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.hm_start}
              onChangeText={text => handleChange('hm_start', text)}
              keyboardType="numeric"
            />
            <Text style={addDailyAct.label}>HM End</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.hm_end}
              onChangeText={text => handleChange('hm_end', text)}
              keyboardType="numeric"
            />
            <Text style={addDailyAct.label}>Total HM</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.total_hm}
              onChangeText={text => handleChange('total_hm', text)}
              keyboardType="numeric"
              editable={false}
            />
            <Text style={addDailyAct.label}>Progres</Text>
            <TextInput
              style={addDailyAct.input}
              value={formData.progres}
              onChangeText={text => handleChange('progres', text)}
              keyboardType="numeric"
              editable={false}
            />
          </CollapsibleCard>

          {/* Tanggal Section */}
          <CollapsibleCard title="Tanggal">
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
          </CollapsibleCard>

          {/* Tombol Simpan */}
          <Button
            title={isSubmitting ? 'Menyimpan...' : 'Simpan'}
            onPress={handleSubmit}
            disabled={isSubmitting}
          />
        </KeyboardAwareScrollView>
      </View>
    </LinearGradient>
  );
};

export default AddTrainHours;
