import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  UIManager,
  Platform,
  Button,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';
import LinearGradient from 'react-native-linear-gradient';
import {editDataStyles as styles} from '../../../styles/editDataStyles';
import {pickerSelectStyles} from '../../../styles/pickerSelectStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import API_BASE_URL from '../../../config';

// Enable LayoutAnimation untuk Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * ToggleCard - Card expandable untuk setiap blok
 */
const ToggleCard = ({title, children, defaultExpanded = true}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setExpanded(!expanded)}>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#007AFF"
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

/**
 * Halaman EditDataMentoring - Edit data mentoring (semua form & indikator)
 */
const EditDataMentoring = ({route}) => {
  const {id} = route.params;

  // ==== STATE ====
  const [loading, setLoading] = useState(true);
  const [headerData, setHeaderData] = useState(null);
  const [operatorJDE, setOperatorJDE] = useState(null);
  const [operatorName, setOperatorName] = useState(null);
  const [site, setSite] = useState(null);
  const [operatorQuery, setOperatorQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [area, setArea] = useState(null);
  const [modelUnitRaw, setModelUnitRaw] = useState([]);
  const [unitRaw, setUnitRaw] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [modelUnits, setModelUnits] = useState([]);
  const [unitNumbers, setUnitNumbers] = useState([]);
  const [unitType, setUnitType] = useState(null);
  const [unitModel, setUnitModel] = useState(null);
  const [unitNumber, setUnitNumber] = useState(null);
  const [dateMentoring, setDateMentoring] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [indicators, setIndicators] = useState({});
  const [visibleCategories, setVisibleCategories] = useState({});
  const [editableDetails, setEditableDetails] = useState([]);
  const [points, setPoints] = useState({});
  const navigation = useNavigation();

  // === Fetch detail data edit mentoring dari API ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL.mop}/mentoring/${id}/edit`);
        const {header, model_unit, unit, indicators, details} =
          res.data?.data || {};
        setModelUnitRaw(model_unit || []);
        setUnitRaw(unit || []);
        setIndicators(indicators || {});
        setEditableDetails(details || []);

        if (!header) {
          alert('Data header tidak ditemukan');
          setLoading(false);
          return;
        }
        setHeaderData(header);
        setOperatorJDE(header.operator_jde);
        setOperatorName(header.operator_name);
        setSite(header.header_site || header.site || '');
        setOperatorQuery(`${header.operator_jde} - ${header.operator_name}`);

        if (header.date_mentoring)
          setDateMentoring(new Date(header.date_mentoring.split(' ')[0]));
        if (header.start_time) {
          const [sh, sm] = header.start_time.split(':').map(Number);
          const now = new Date();
          setStartTime(new Date(now.setHours(sh, sm, 0, 0)));
        }
        if (header.end_time) {
          const [eh, em] = header.end_time.split(':').map(Number);
          const now = new Date();
          setEndTime(new Date(now.setHours(eh, em, 0, 0)));
        }

        // Unit Type options
        const uniqueClasses = {};
        (model_unit || []).forEach(item => {
          uniqueClasses[String(item.class_id)] = item.class;
        });
        const classOptions = Object.entries(uniqueClasses).map(
          ([value, label]) => ({label, value: String(value)}),
        );
        const headerClassId = header.class_id || header.unit_type;
        setUnitType(headerClassId ? String(headerClassId) : null);
        setUnitTypes(classOptions);

        setArea(header.area || '');
      } catch (error) {
        console.error('Fetch data error:', error);
        alert('Gagal mengambil data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // === Search Operator Handler ===
  const searchOperator = async text => {
    setOperatorQuery(text);
    setShowResults(true);
    if (text.length >= 2) {
      try {
        const response = await axios.get(
          `${API_BASE_URL.mop}/getEmployeeOperator?q=${text}`,
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error('Gagal mencari operator:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  // === Pilih Operator dari hasil search ===
  const handleSelectOperator = item => {
    setOperatorJDE(item.employeeId);
    setOperatorName(item.EmployeeName);
    setOperatorQuery(`${item.employeeId} - ${item.EmployeeName}`);
    setShowResults(false);
  };

  // === Update Model Unit ketika Unit Type berubah ===
  useEffect(() => {
    if (!unitType || !modelUnitRaw.length) return;
    const filteredModels = modelUnitRaw
      .filter(m => String(m.class_id) === String(unitType))
      .map(m => ({label: m.model, value: String(m.model_id)}));
    setModelUnits(filteredModels);

    let modelId = headerData?.model_id;
    if (!modelId && headerData?.unit_model) {
      const foundModelRaw = modelUnitRaw.find(
        m =>
          String(m.model_id) === String(headerData.unit_model) ||
          String(m.model) === String(headerData.unit_model),
      );
      modelId = foundModelRaw ? String(foundModelRaw.model_id) : null;
    }
    setUnitModel(modelId);
  }, [unitType, modelUnitRaw, headerData]);

  // === Update Unit Number ketika Model berubah ===
  useEffect(() => {
    if (!unitModel || !unitRaw.length) return;
    const filteredUnits = unitRaw
      .filter(u => String(u.fid_model) === String(unitModel))
      .map(u => ({label: u.no_unit, value: String(u.id)}));
    setUnitNumbers(filteredUnits);

    let unitId = headerData?.unit_number_id;
    if (!unitId && headerData?.unit_number) {
      const foundUnitRaw = unitRaw.find(
        u =>
          String(u.id) === String(headerData.unit_number) ||
          String(u.no_unit) === String(headerData.unit_number),
      );
      unitId = foundUnitRaw ? String(foundUnitRaw.id) : null;
    }
    setUnitNumber(unitId);
  }, [unitModel, unitRaw, headerData]);

  // === Handle Edit/Change Note per indikator ===
  const updateNote = (fid, note) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid ? {...d, note_observasi: note} : d,
        );
      }
      return [
        ...prev,
        {
          fid_indicator: fid,
          is_observasi: '0',
          is_mentoring: '0',
          note_observasi: note,
        },
      ];
    });
  };

  // === Handle Toggle Checkbox Observasi/Mentoring per indikator ===
  const toggleCheckbox = (fid, field) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid
            ? {...d, [field]: existing[field] === '1' ? '0' : '1'}
            : d,
        );
      }
      return [
        ...prev,
        {
          fid_indicator: fid,
          is_observasi: field === 'is_observasi' ? '1' : '0',
          is_mentoring: field === 'is_mentoring' ? '1' : '0',
          note_observasi: '',
        },
      ];
    });
  };

  // === Hitung Poin Live per kategori ===
  const calculatePoints = details => {
    const newPoints = {};
    for (const kategori in indicators) {
      const indicatorList = indicators[kategori];
      let yObs = 0;
      let yMentor = 0;
      indicatorList.forEach(ind => {
        const detail = details.find(
          d => String(d.fid_indicator) === String(ind.id),
        );
        if (detail) {
          if (detail.is_observasi === '1') yObs += 1;
          if (detail.is_mentoring === '1') yMentor += 1;
        }
      });
      newPoints[kategori] = {
        indicator: kategori,
        yscoreObservasi: yObs,
        pointObservasi: yObs * 12.5,
        yscoreMentoring: yMentor,
        pointMentoring: yMentor * 12.5,
      };
    }
    return newPoints;
  };

  // === Update Points ketika detail berubah ===
  useEffect(() => {
    const updatedPoints = calculatePoints(editableDetails);
    setPoints(updatedPoints);
  }, [editableDetails]);

  // === Handler DateTime Picker (tanggal, waktu mulai/selesai) ===
  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) setDateMentoring(selectedDate);
  };
  const onChangeStartTime = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowStartTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) setStartTime(selectedTime);
  };
  const onChangeEndTime = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowEndTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) setEndTime(selectedTime);
  };

  // === Toggle Kategori Indikator di Section ===
  const toggleCategoryVisibility = kategori => {
    setVisibleCategories(prev => ({
      ...prev,
      [kategori]: !prev[kategori],
    }));
  };

  // === Render Rekap Point Section (Observasi/Mentoring) ===
  const renderLivePointsSection = type => {
    const isObs = type === 'observasi';
    const dataFiltered = Object.values(points);
    const totalYScore = dataFiltered.reduce(
      (sum, p) => sum + (isObs ? p.yscoreObservasi : p.yscoreMentoring),
      0,
    );
    const totalPoint = dataFiltered.reduce(
      (sum, p) => sum + (isObs ? p.pointObservasi : p.pointMentoring),
      0,
    );
    const averagePoint =
      dataFiltered.length && !isNaN(totalPoint)
        ? (totalPoint / dataFiltered.length).toFixed(1)
        : '0.0';
    return {
      jsx: (
        <ToggleCard
          title={isObs ? 'Rekap Point Observasi' : 'Rekap Point Mentoring'}>
          <View style={styles.pointsGrid}>
            {dataFiltered.map((item, index) => (
              <View key={index} style={styles.pointCard}>
                <Text style={styles.pointCategory}>{item.indicator}</Text>
                <View style={styles.pointRow}>
                  <Text style={styles.pointLabel}>Y Score:</Text>
                  <Text style={styles.pointValue}>
                    {isObs ? item.yscoreObservasi : item.yscoreMentoring}
                  </Text>
                </View>
                <View style={styles.pointRow}>
                  <Text style={styles.pointLabel}>Point:</Text>
                  <Text style={styles.pointValue}>
                    {isObs ? item.pointObservasi : item.pointMentoring}
                  </Text>
                </View>
              </View>
            ))}
            <View style={[styles.pointCard, styles.summaryCard]}>
              <Text style={[styles.pointCategory, {fontWeight: 'bold'}]}>
                AVERAGE POINT
              </Text>
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>Total Y Score:</Text>
                <Text style={styles.pointValue}>{totalYScore}</Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointLabel}>Average Point:</Text>
                <Text style={styles.pointValue}>{averagePoint}</Text>
              </View>
            </View>
          </View>
        </ToggleCard>
      ),
    };
  };

  const observasiPoints = renderLivePointsSection('observasi');
  const mentoringPoints = renderLivePointsSection('mentoring');

  // === Submit Update ke API ===
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const loginCache = await AsyncStorage.getItem('loginCache');
      const token = loginCache ? JSON.parse(loginCache).token : null;
      console.log('TOKEN:', token);
      if (!token)
        throw new Error('Sesi telah berakhir. Silakan login kembali.');
      if (!unitType || !unitModel || !unitNumber)
        throw new Error('Harap lengkapi semua informasi unit');

      // Kalkulasi poin
      const calcPoints = type => {
        const isObs = type === 'observasi';
        const dataFiltered = Object.values(points);
        const totalYScore = dataFiltered.reduce(
          (sum, p) => sum + (isObs ? p.yscoreObservasi : p.yscoreMentoring),
          0,
        );
        const totalPoint = dataFiltered.reduce(
          (sum, p) => sum + (isObs ? p.pointObservasi : p.pointMentoring),
          0,
        );
        const averagePoint =
          dataFiltered.length && !isNaN(totalPoint)
            ? parseFloat((totalPoint / dataFiltered.length).toFixed(1))
            : 0;
        return {totalYScore, averagePoint};
      };

      const observasi = calcPoints('observasi');
      const mentoring = calcPoints('mentoring');

      // Payload API
      const payload = {
        operator_jde: operatorJDE,
        operator_name: operatorName,
        unit_type: unitType,
        unit_model: unitModel,
        unit_number: unitNumber,
        header_site: site,
        area: area,
        date_mentoring: dateMentoring.toISOString().split('T')[0],
        start_time: `${startTime.getHours()}:${String(
          startTime.getMinutes(),
        ).padStart(2, '0')}`,
        end_time: `${endTime.getHours()}:${String(
          endTime.getMinutes(),
        ).padStart(2, '0')}`,
        average_yscore_observation: observasi.totalYScore,
        average_point_observation: observasi.averagePoint,
        average_yscore_mentoring: mentoring.totalYScore,
        average_point_mentoring: mentoring.averagePoint,
        indicators: Object.values(indicators)
          .flat()
          .map(ind => {
            const detail = editableDetails.find(
              d => d.fid_indicator === ind.id,
            );
            return {
              fid_indicator: ind.id,
              is_observasi: detail?.is_observasi ?? '0',
              is_mentoring: detail?.is_mentoring ?? '0',
              note_observasi: detail?.note_observasi ?? '',
            };
          }),
      };
      console.log('Payload:', payload);

      console.log('Token:', token);
      const response = await axios.put(
        `${API_BASE_URL.mop}/mentoring/${id}/update`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );
      if (response.data.success) {
        alert('Data mentoring berhasil diperbarui!');
        navigation.goBack();
      } else {
        throw new Error(response.data.message || 'Gagal memperbarui data');
      }
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response?.status === 401) {
        // // INI yang penting: hanya hapus loginCache
        // await AsyncStorage.removeItem('loginCache');
        // alert('Sesi telah berakhir. Silakan login kembali.');
        // navigation.reset({index: 0, routes: [{name: 'Login'}]});
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message ||
            error.message ||
            'Terjadi kesalahan saat mengupdate data',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // === UI Loader & Fallback ===
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }
  if (!headerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Data tidak ditemukan</Text>
      </View>
    );
  }

  // ==== RENDER FORM ====
  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{paddingBottom: 48}}>
            <View style={styles.container}>
              <Text style={styles.title}>Edit Data Mentoring</Text>

              {/* --- HEADER CARD --- */}
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setExpanded(!expanded)}>
                  <Icon
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.sectionTitle}>Header</Text>
                </TouchableOpacity>
                {expanded && (
                  <View style={styles.sectionContent}>
                    <View style={styles.row}>
                      <View style={styles.half}>
                        <Text style={styles.label}>Trainer JDE</Text>
                        <Text style={styles.value}>
                          {headerData.trainer_jde}
                        </Text>
                      </View>
                      <View style={styles.half}>
                        <Text style={styles.label}>Nama Trainer</Text>
                        <Text style={styles.value}>
                          {headerData.trainer_name}
                        </Text>
                      </View>
                    </View>
                    <View style={{padding: 1}}>
                      <Text style={{fontSize: 16, marginBottom: 8}}>
                        Operator
                      </Text>
                      <TextInput
                        placeholder="Cari Operator JDE"
                        value={operatorQuery}
                        onChangeText={searchOperator}
                        style={[styles.value, {paddingVertical: 10}]}
                      />
                      {/* Search Results */}
                      {showResults && searchResults.length > 0 && (
                        <View
                          style={[styles.indicatorDetail, {maxHeight: 150}]}>
                          <FlatList
                            data={searchResults}
                            keyExtractor={item => item.employeeId}
                            renderItem={({item}) => (
                              <TouchableOpacity
                                onPress={() => handleSelectOperator(item)}
                                style={[
                                  styles.pointCard,
                                  {paddingVertical: 10},
                                ]}>
                                <Text>{`${item.employeeId} - ${item.EmployeeName}`}</Text>
                              </TouchableOpacity>
                            )}
                            nestedScrollEnabled={true}
                          />
                        </View>
                      )}
                      <View style={styles.operatorBox}>
                        <Text style={{fontSize: 16, marginBottom: 8}}>
                          Operator JDE: {operatorJDE}
                        </Text>
                        <View
                          style={{
                            height: 1,
                            backgroundColor: '#e0e0e0',
                            marginVertical: 8,
                          }}
                        />
                        <Text style={{fontSize: 16}}>
                          Nama Operator: {operatorName}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.label}>Site</Text>
                    <TextInput
                      value={site || ''}
                      editable={false}
                      style={styles.input}
                    />
                    <Text style={styles.label}>Area</Text>
                    <TextInput
                      value={area ?? ''}
                      onChangeText={setArea}
                      placeholder="Masukkan nama Area"
                      style={[
                        styles.input,
                        {minHeight: 40, textAlignVertical: 'top'},
                      ]}
                      multiline
                    />
                  </View>
                )}
              </View>

              {/* --- UNIT DAN WAKTU CARD --- */}
              <ToggleCard title="Unit dan Waktu" defaultExpanded={true}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit Type</Text>
                  <RNPickerSelect
                    onValueChange={setUnitType}
                    items={unitTypes}
                    value={unitType}
                    placeholder={{label: 'Pilih Tipe Unit', value: null}}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => (
                      <Icon name="chevron-down" size={20} color="#9ca3af" />
                    )}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit Model</Text>
                  <RNPickerSelect
                    onValueChange={setUnitModel}
                    items={modelUnits}
                    value={unitModel}
                    placeholder={{label: 'Pilih Model Unit', value: null}}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => (
                      <Icon name="chevron-down" size={20} color="#9ca3af" />
                    )}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Unit Number</Text>
                  <RNPickerSelect
                    onValueChange={setUnitNumber}
                    items={unitNumbers}
                    value={unitNumber}
                    placeholder={{label: 'Pilih Unit Number', value: null}}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => (
                      <Icon name="chevron-down" size={20} color="#9ca3af" />
                    )}
                  />
                </View>
                <View style={styles.timeDateGroup}>
                  <View style={styles.timeDateInput}>
                    <Text style={styles.label}>Tanggal</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={styles.datePickerButton}>
                      <Icon name="calendar" size={18} color="#6366f1" />
                      <Text style={styles.datePickerText}>
                        {dateMentoring.toLocaleDateString('id-ID')}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={dateMentoring}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                      />
                    )}
                  </View>
                  <View style={styles.timeDateInput}>
                    <Text style={styles.label}>Waktu Mulai</Text>
                    <TouchableOpacity
                      onPress={() => setShowStartTimePicker(true)}
                      style={styles.datePickerButton}>
                      <Icon name="time" size={18} color="#6366f1" />
                      <Text style={styles.datePickerText}>
                        {startTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </TouchableOpacity>
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={startTime}
                        mode="time"
                        display="default"
                        onChange={onChangeStartTime}
                      />
                    )}
                  </View>
                  <View style={styles.timeDateInput}>
                    <Text style={styles.label}>Waktu Selesai</Text>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(true)}
                      style={styles.datePickerButton}>
                      <Icon name="time" size={18} color="#6366f1" />
                      <Text style={styles.datePickerText}>
                        {endTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </TouchableOpacity>
                    {showEndTimePicker && (
                      <DateTimePicker
                        value={endTime}
                        mode="time"
                        display="default"
                        onChange={onChangeEndTime}
                      />
                    )}
                  </View>
                </View>
              </ToggleCard>

              {/* --- INDIKATOR --- */}
              <ToggleCard title="Indikator Mentoring" defaultExpanded={true}>
                {Object.entries(indicators).map(([kategori, list]) => (
                  <View key={kategori} style={styles.indicatorCategory}>
                    <TouchableOpacity
                      onPress={() => toggleCategoryVisibility(kategori)}
                      style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>{kategori}</Text>
                      <Icon
                        name={
                          visibleCategories[kategori]
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={18}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                    {visibleCategories[kategori] && (
                      <>
                        {list.map(ind => {
                          const detail = editableDetails.find(
                            d => String(d.fid_indicator) === String(ind.id),
                          ) || {
                            is_observasi: '0',
                            is_mentoring: '0',
                            note_observasi: '',
                            fid_indicator: ind.id,
                          };
                          return (
                            <View key={ind.id} style={styles.indicatorItem}>
                              <Text style={styles.indicatorParam}>
                                • {ind.param1}
                              </Text>
                              <View style={styles.indicatorDetail}>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>
                                    Observasi:
                                  </Text>
                                  <CheckBox
                                    value={detail.is_observasi === '1'}
                                    onValueChange={() =>
                                      toggleCheckbox(
                                        detail.fid_indicator,
                                        'is_observasi',
                                      )
                                    }
                                    tintColors={{true: '#111', false: '#111'}}
                                    boxType="square"
                                    style={{width: 20, height: 20}}
                                  />
                                </View>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>
                                    Mentoring:
                                  </Text>
                                  <View style={styles.checkBoxWrapper}>
                                    <CheckBox
                                      value={detail.is_mentoring === '1'}
                                      onValueChange={() =>
                                        toggleCheckbox(
                                          detail.fid_indicator,
                                          'is_mentoring',
                                        )
                                      }
                                      tintColors={{true: '#111', false: '#111'}}
                                      boxType="square"
                                      style={{width: 20, height: 20}}
                                    />
                                  </View>
                                </View>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>
                                    Catatan:
                                  </Text>
                                  <TextInput
                                    style={styles.detailValue}
                                    multiline
                                    placeholder="Masukkan catatan..."
                                    value={detail.note_observasi || ''}
                                    onChangeText={text =>
                                      updateNote(detail.fid_indicator, text)
                                    }
                                  />
                                </View>
                              </View>
                            </View>
                          );
                        })}
                        {/* Skor per kategori */}
                        <View style={styles.categoryScore}>
                          <Text style={styles.scoreText}>
                            Observasi : Y Score:{' '}
                            {points[kategori]?.yscoreObservasi ?? 0} | Point:{' '}
                            {points[kategori]?.pointObservasi ?? 0}
                          </Text>
                          <Text style={styles.scoreText}>
                            Mentoring : Y Score:{' '}
                            {points[kategori]?.yscoreMentoring ?? 0} | Point:{' '}
                            {points[kategori]?.pointMentoring ?? 0}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </ToggleCard>

              {/* --- Rekap Point --- */}
              {observasiPoints.jsx}
              {mentoringPoints.jsx}

              {/* --- Simpan --- */}
              <Button title="Simpan" onPress={handleSubmit} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default EditDataMentoring;
