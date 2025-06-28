import React, {useEffect, useState} from 'react';
import {
  Text,
  TextInput,
  Button,
  Alert,
  View,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import axios from 'axios';
import {addDailyAct} from '../../../styles/addDailyAct';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useNavigation, useRoute} from '@react-navigation/native';
import API_BASE_URL from '../../../config';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

// Aktifkan animasi layout di Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Komponen kartu collapsible, untuk grouping section form
 */
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

/**
 * Halaman EditTrainHours
 */
const EditTrainHours = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {id} = route.params;

  // Untuk safe area bawah
  const insets = useSafeAreaInsets();

  // STATE: data form utama
  const [formData, setFormData] = useState({
    jde_no: '',
    employee_name: '',
    position: '',
    training_type: '', // gunakan ID
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

  // STATE: Dropdown & opsinya
  const [trainingTypeOptions, setTrainingTypeOptions] = useState([]);
  const [trainingTypeOpen, setTrainingTypeOpen] = useState(false);
  const [trainingTypeValue, setTrainingTypeValue] = useState(null);

  const [unitTypeOptions, setUnitTypeOptions] = useState([]);
  const [unitTypeOpen, setUnitTypeOpen] = useState(false);

  const [classUnitArr, setClassUnitArr] = useState([]);
  const [filteredClassUnitOptions, setFilteredClassUnitOptions] = useState([]);
  const [unitClassOpen, setUnitClassOpen] = useState(false);

  const [allCodeUnitArr, setAllCodeUnitArr] = useState([]);
  const [codeOptions, setCodeOptions] = useState([]);
  const [codeOpen, setCodeOpen] = useState(false);

  const [batchOptions, setBatchOptions] = useState([
    {label: 'Batch 1', value: 'Batch 1'},
    {label: 'Batch 2', value: 'Batch 2'},
    {label: 'Batch 3', value: 'Batch 3'},
    {label: 'Batch 4', value: 'Batch 4'},
    {label: 'Batch 5', value: 'Batch 5'},
    {label: 'Batch 6', value: 'Batch 6'},
    {label: 'Batch 7', value: 'Batch 7'},
    {label: 'Batch 8', value: 'Batch 8'},
    {label: 'Batch 9', value: 'Batch 9'},
    {label: 'Batch 10', value: 'Batch 10'},
  ]);
  const [batchOpen, setBatchOpen] = useState(false);

  // STATE: Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  /**
   * Helper untuk ambil session/token dari async storage
   */
  const getSession = async () => {
    let token = null;
    let user = null;
    let site = '';

    try {
      const loginCacheString = await AsyncStorage.getItem('loginCache');
      if (loginCacheString) {
        const loginCache = JSON.parse(loginCacheString);
        token = loginCache.token || null;
        user = loginCache || null;
        site = loginCache?.dataEmp?.site || '';
      }
    } catch (e) {
      console.warn('Gagal parsing loginCache:', e);
    }

    return {token, user, site};
  };

  /**
   * Ambil data master (dropdown) & detail edit (by id)
   */
  useEffect(() => {
    let cancel = false;
    const fetchData = async () => {
      try {
        const {token, user, site} = await getSession();
        if (!token || !user) {
          Alert.alert('Error', 'Session habis. Silakan login ulang.');
          return;
        }
        // Ambil master data
        const master = await axios.get(
          `${API_BASE_URL.mop}/trainHours/create`,
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );
        // Ambil data detail
        const detail = await axios.get(`${API_BASE_URL.mop}/trainHours/${id}`, {
          headers: {Authorization: `Bearer ${token}`},
        });

        if (cancel) return;

        // Mapping dropdown options
        const typeUnitArr = (master.data.data.typeUnit || []).map(item => ({
          label: item.class,
          value: String(item.id),
        }));
        setUnitTypeOptions(typeUnitArr);

        const classUnitArr = (master.data.data.classUnit || []).map(item => ({
          label: item.model,
          value: String(item.id),
          type: item.type,
          class: String(item.class),
        }));
        setClassUnitArr(classUnitArr);

        const codeUnitArr = (master.data.data.codeUnit || []).map(item => ({
          label: item.no_unit || item.NO_UNIT || item.code,
          value: String(item.id),
          fid_model: String(item.fid_model),
        }));
        setAllCodeUnitArr(codeUnitArr);

        const kpiArr = (master.data.data.kpi || []).map(item => ({
          label: item.kpi,
          value: String(item.id),
        }));
        setTrainingTypeOptions(kpiArr);

        // Set data edit
        if (detail.data.status) {
          const d = detail.data.data;
          // Cari value training_type berdasar ID
          const selectedTraining = kpiArr.find(
            item => String(item.value) === String(d.training_type),
          );
          setTrainingTypeValue(
            selectedTraining ? selectedTraining.value : null,
          );

          setFormData({
            jde_no: d.jde_no || '',
            employee_name: d.employee_name || '',
            position: d.position || '',
            training_type: selectedTraining ? selectedTraining.value : '', // (ID)
            unit_class: d.unit_class ? String(d.unit_class) : '',
            unit_type: d.unit_type ? String(d.unit_type) : '',
            code: d.code ? String(d.code) : '',
            batch: d.batch || '',
            plan_total_hm: d.plan_total_hm ? String(d.plan_total_hm) : '',
            hm_start: d.hm_start ? String(d.hm_start) : '',
            hm_end: d.hm_end ? String(d.hm_end) : '',
            total_hm: d.total_hm ? String(d.total_hm) : '',
            progres: d.progres ? String(d.progres) : '',
            site: d.site || '',
            date_activity: d.date_activity ? d.date_activity.split(' ')[0] : '',
          });

          // Filter dropdown sesuai data edit
          setFilteredClassUnitOptions(
            classUnitArr.filter(
              item => String(item.class) === String(d.unit_type),
            ),
          );
          setCodeOptions(
            codeUnitArr.filter(
              code => String(code.fid_model) === String(d.unit_class),
            ),
          );
        } else {
          Alert.alert('Error', detail.data.message || 'Gagal ambil data.');
        }
      } catch (error) {
        Alert.alert('Error', 'Terjadi kesalahan saat ambil data awal');
      }
    };
    fetchData();
    return () => {
      cancel = true;
    };
  }, [id]);

  // Sync cascading dropdown: classUnit sesuai unit_type
  useEffect(() => {
    if (formData.unit_type && classUnitArr.length > 0) {
      setFilteredClassUnitOptions(
        classUnitArr.filter(
          item => String(item.class) === String(formData.unit_type),
        ),
      );
    }
  }, [formData.unit_type, classUnitArr]);

  // Sync cascading dropdown: code sesuai unit_class
  useEffect(() => {
    if (formData.unit_class && allCodeUnitArr.length > 0) {
      setCodeOptions(
        allCodeUnitArr.filter(
          code => String(code.fid_model) === String(formData.unit_class),
        ),
      );
    }
  }, [formData.unit_class, allCodeUnitArr]);

  // Handle perubahan field
  const handleChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  };

  // Handle tanggal DateTimePicker
  const handleDateChange = (_event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    const formatted = currentDate.toISOString().split('T')[0];
    handleChange('date_activity', formatted);
  };

  // Hitung otomatis total_hm & progres saat hm_start/hm_end berubah
  useEffect(() => {
    const start = Number(formData.hm_start) || 0;
    const end = Number(formData.hm_end) || 0;
    const total = end - start;
    setFormData(prev => ({
      ...prev,
      total_hm: total ? String(total) : '',
      progres: total ? String(total) : '',
    }));
  }, [formData.hm_start, formData.hm_end, formData.plan_total_hm]);

  // Handler cascading dropdown
  const onChangeUnitType = val => {
    handleChange('unit_type', val);
    handleChange('unit_class', '');
    handleChange('code', '');
  };
  const onChangeUnitClass = val => {
    handleChange('unit_class', val);
    handleChange('code', '');
  };

  // Handler dropdown KPI/training_type
  const onChangeTrainingType = val => {
    setTrainingTypeValue(val);
    handleChange('training_type', val);
  };

  // Validasi dan submit update ke backend
  const handleSubmit = async () => {
    const requiredFields = [
      'jde_no',
      'employee_name',
      'position',
      'training_type', // wajib id KPI
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
        return;
      }
    }
    try {
      const loginCache = await AsyncStorage.getItem('loginCache');
      const token = loginCache ? JSON.parse(loginCache).token : null;
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL.mop}/trainHours/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.data.status) {
        Alert.alert(
          'Sukses',
          response.data.message || 'Data berhasil diupdate',
        );
        navigation.navigate('TrainHours');
      } else {
        Alert.alert('Gagal', response.data.message || 'Gagal update data');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const messages = Object.values(error.response.data.errors)
          .flat()
          .join('\n');
        Alert.alert('Validasi Gagal', messages);
      } else {
        Alert.alert('Error', 'Terjadi kesalahan saat update data');
      }
    }
  };

  // --- UI ---
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
          <Text style={addDailyAct.header}>EDIT TRAIN HOURS</Text>

          {/* Section: Employee */}
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

          {/* Section: Training */}
          <CollapsibleCard title="Training Info">
            <Text style={addDailyAct.label}>Training Type</Text>
            <DropDownPicker
              listMode="MODAL"
              open={trainingTypeOpen}
              value={trainingTypeValue}
              items={trainingTypeOptions}
              setOpen={setTrainingTypeOpen}
              setValue={val => {
                setTrainingTypeValue(val());
                handleChange('training_type', val());
              }}
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

          {/* Section: Unit */}
          <CollapsibleCard title="Unit Info">
            <Text style={addDailyAct.label}>Unit Type</Text>
            <DropDownPicker
              listMode="MODAL"
              open={unitTypeOpen}
              value={formData.unit_type}
              items={unitTypeOptions}
              setOpen={setUnitTypeOpen}
              setValue={val => {
                setUnitTypeOpen(false);
                onChangeUnitType(val());
              }}
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
              setValue={val => {
                setUnitClassOpen(false);
                onChangeUnitClass(val());
              }}
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

          {/* Section: Hours */}
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

          {/* Section: Tanggal */}
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

          {/* Tombol submit update */}
          <Button title="Update" onPress={handleSubmit} />
        </KeyboardAwareScrollView>
      </View>
    </LinearGradient>
  );
};

export default EditTrainHours;
