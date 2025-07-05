import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
  UIManager,
  Button,
  Alert,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import CheckBox from '@react-native-community/checkbox';
import {editDataStyles as styles} from '../../../styles/editDataStyles';
import {pickerSelectStyles} from '../../../styles/pickerSelectStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import API_BASE_URL from '../../../config';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';

import {addQueueOffline} from '../../../utils/offlineQueueHelper';
import {OfflineQueueContext} from '../../../utils/OfflineQueueContext';

// Enable layout animation for Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MENTORING_QUEUE_KEY = 'mentoring_queue_offline';

// --- Expandable Card
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

const AddDataMentoring = ({route}) => {
  const navigation = useNavigation();
  const {pushMentoringQueue, mentoringQueueCount, syncing} =
    useContext(OfflineQueueContext);
  const [loading, setLoading] = useState(true);

  // --- State
  const [operatorJDE, setOperatorJDE] = useState(null);
  const [operatorName, setOperatorName] = useState(null);
  const [trainerName, setTrainerName] = useState(null);
  const [trainerJDE, setTrainerJDE] = useState(null);
  const [site, setSite] = useState(null);
  const [operatorQuery, setOperatorQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [rawSiteList, setRawSiteList] = useState([]);
  const [modelUnitRaw, setModelUnitRaw] = useState([]);
  const [unitRaw, setUnitRaw] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [modelUnits, setModelUnits] = useState([]);
  const [unitNumbers, setUnitNumbers] = useState([]);
  const {data} = route.params;
  const {unitType, unitTypeId} = data;
  const [unitModel, setUnitModel] = useState(null);
  const [unitNumber, setUnitNumber] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState({});
  const [expanded, setExpanded] = useState(true);
  const [indicators, setIndicators] = useState({});
  const [dateMentoring, setDateMentoring] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [editableDetails, setEditableDetails] = useState([]);
  const [area, setArea] = useState(null);
  const [points, setPoints] = useState({});
  const [isConnected, setIsConnected] = useState(true);

  // --- DropDownPicker State
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [operatorItems, setOperatorItems] = useState([]);

  useEffect(() => {
    if (searchResults.length) {
      setOperatorItems(
        searchResults.map((item, idx) => ({
          label: `${item.employeeId} - ${item.EmployeeName}`,
          value: `${item.employeeId}_${idx}`,
          item: item,
        })),
      );
    } else {
      setOperatorItems([]);
    }
  }, [searchResults]);

  // --- Detect online/offline
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected === true);
    });
    NetInfo.fetch().then(state => setIsConnected(state.isConnected === true));
    return () => unsubscribe();
  }, []);

  // --- Prefill draft (checkbox indikator tetap walau offline)
  useEffect(() => {
    const prefillForm = async () => {
      const draft = await AsyncStorage.getItem(
        'mentoring_editable_details_temp',
      );
      if (draft) setEditableDetails(JSON.parse(draft));
    };
    prefillForm();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      'mentoring_editable_details_temp',
      JSON.stringify(editableDetails),
    );
  }, [editableDetails]);

  // --- Ambil master data dari cache/online
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let master = {};
        if (isConnected) {
          const res = await axios.get(
            `${API_BASE_URL.mop}/mentoring/createData`,
          );
          master = res.data?.data || {};
          await AsyncStorage.setItem(
            'mentoring_master',
            JSON.stringify(master),
          );
        } else {
          const cache = await AsyncStorage.getItem('mentoring_master');
          if (cache) master = JSON.parse(cache);
          else {
            Alert.alert(
              'Offline',
              'Data master belum tersedia. Silakan online dulu.',
            );
            setLoading(false);
            return;
          }
        }
        setRawSiteList(master.siteList || []);
        setModelUnitRaw(master.models || []);
        setUnitRaw(master.units || []);
        setEditableDetails(master.details || []);
        setPoints({});
      } catch (error) {
        Alert.alert('Gagal mengambil data', error.message || 'Cek koneksi');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isConnected]);

  // --- Ambil site prioritas online
  useEffect(() => {
    let didCancel = false;
    const fetchMasterSite = async () => {
      setLoading(true);
      let siteData = [];
      try {
        const res = await axios.get(`${API_BASE_URL.mop}/getSite`);
        siteData = res.data?.data || [];
        await AsyncStorage.setItem(
          'mentoring_master_site',
          JSON.stringify(siteData),
        );
      } catch (err) {
        const cache = await AsyncStorage.getItem('mentoring_master_site');
        siteData = cache ? JSON.parse(cache) : [];
      }
      if (!didCancel) {
        setRawSiteList(siteData || []);
        setLoading(false);
      }
    };
    fetchMasterSite();
    return () => {
      didCancel = true;
    };
  }, []);

  // --- Prefill user info (trainer)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('loginCache');
        if (userString) {
          const loginData = JSON.parse(userString);
          // Ambil dari dataEmp
          const user = loginData.dataEmp;
          setTrainerJDE(user.jdeno); // jdeno untuk JDE
          setTrainerName(user.name); // name untuk nama trainer
          setSite(user.site); // site user (BCP, dll)
        }
      } catch (err) {
        // Optional: logging
      }
    };
    fetchUser();
  }, []);

  // --- Fetch indikator by type (cache per tipe)
  useEffect(() => {
    const fetchIndicatorsByType = async () => {
      if (!unitTypeId) return setIndicators({});
      let data = {};
      const cache = await AsyncStorage.getItem(
        `mentoring_indicators_${unitTypeId}`,
      );
      if (cache) {
        data = JSON.parse(cache);
        setIndicators(data);
        if (isConnected) {
          try {
            const response = await axios.get(
              `${API_BASE_URL.mop}/mentoring/createData?type_mentoring=${unitTypeId}`,
            );
            const freshData = response.data?.data?.indicators || {};
            await AsyncStorage.setItem(
              `mentoring_indicators_${unitTypeId}`,
              JSON.stringify(freshData),
            );
            setIndicators(freshData);
          } catch {}
        }
      } else if (isConnected) {
        try {
          const response = await axios.get(
            `${API_BASE_URL.mop}/mentoring/createData?type_mentoring=${unitTypeId}`,
          );
          data = response.data?.data?.indicators || {};
          await AsyncStorage.setItem(
            `mentoring_indicators_${unitTypeId}`,
            JSON.stringify(data),
          );
          setIndicators(data);
        } catch {
          setIndicators({});
        }
      } else {
        setIndicators({});
      }
    };
    fetchIndicatorsByType();
  }, [unitTypeId, isConnected]);

  // --- Dropdown builder (site, model, unit)
  useEffect(() => {
    if (!modelUnitRaw.length) return setUnitTypes([]);
    const types = Array.from(
      new Set(modelUnitRaw.map(m => m.class && m.class.trim())),
    )
      .filter(Boolean)
      .map(t => ({label: t, value: t}));
    setUnitTypes(types);
  }, [modelUnitRaw]);

  useEffect(() => {
    if (!unitTypeId || !modelUnitRaw.length) {
      setModelUnits([]);
      setUnitModel(null);
      return;
    }
    const filteredModels = modelUnitRaw
      .filter(m => String(m.class) === String(unitTypeId))
      .map(m => ({label: m.model, value: String(m.id)}));
    setModelUnits(filteredModels);
    setUnitModel(null);
  }, [unitTypeId, modelUnitRaw]);

  useEffect(() => {
    if (!unitModel || !unitRaw.length) {
      setUnitNumbers([]);
      setUnitNumber(null);
      return;
    }
    const filteredUnits = unitRaw
      .filter(u => String(u.fid_model) === String(unitModel))
      .map(u => ({label: u.no_unit, value: String(u.id)}));
    setUnitNumbers(filteredUnits);
    setUnitNumber(null);
  }, [unitModel, unitRaw]);

  // --- Search operator (API/cached)
  const searchOperator = async text => {
    setOperatorQuery(text);
    setShowResults(true);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      let arr = [];
      if (isConnected) {
        const response = await axios.get(
          `${API_BASE_URL.mop}/getEmployeeOperator?q=${text}`,
        );
        arr = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        await AsyncStorage.setItem(
          'mentoring_operator_search',
          JSON.stringify(arr),
        );
      } else {
        const cache = await AsyncStorage.getItem('mentoring_operator_search');
        arr = cache ? JSON.parse(cache) : [];
      }
      setSearchResults(arr);
    } catch {
      setSearchResults([]);
    }
  };

  const handleClear = async () => {
    try {
      await AsyncStorage.removeItem('mentoring_queue_offline');
      Toast.show({
        type: 'success',
        text1: 'Berhasil',
        text2: 'Antrian offline mentoring sudah dihapus.',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gagal',
        text2: 'Tidak bisa menghapus cache offline.',
      });
    }
  };

  const handleSelectOperator = item => {
    setOperatorJDE(item.employeeId);
    setOperatorName(item.EmployeeName);
    setOperatorQuery(`${item.employeeId} - ${item.EmployeeName}`);
    setShowResults(false);
  };

  // --- Checkbox per indikator
  const toggleCheckbox = (fid, field) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid
            ? {...d, [field]: d[field] === '1' ? '0' : '1'}
            : d,
        );
      } else {
        return [
          ...prev,
          {
            fid_indicator: fid,
            is_observasi: field === 'is_observasi' ? '1' : '0',
            is_mentoring: field === 'is_mentoring' ? '1' : '0',
            note_observasi: '',
          },
        ];
      }
    });
  };

  const updateNote = (fid, note) => {
    setEditableDetails(prev => {
      const existing = prev.find(d => d.fid_indicator === fid);
      if (existing) {
        return prev.map(d =>
          d.fid_indicator === fid ? {...d, note_observasi: note} : d,
        );
      } else {
        return [
          ...prev,
          {
            fid_indicator: fid,
            is_observasi: '0',
            is_mentoring: '0',
            note_observasi: note,
          },
        ];
      }
    });
  };

  // --- Kalkulasi point kategori
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
  useEffect(() => {
    const updatedPoints = calculatePoints(editableDetails);
    setPoints(updatedPoints);
  }, [editableDetails, indicators]);

  // --- Handler Date/Time
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

  const toggleCategoryVisibility = kategori => {
    setVisibleCategories(prev => ({
      ...prev,
      [kategori]: !prev[kategori],
    }));
  };

  // --- Live Rekap Points
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
    return (
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
    );
  };

  // --- SUBMIT (OFFLINE FIRST)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setLoading(true);
      const loginCache = await AsyncStorage.getItem('loginCache');
      const token = loginCache ? JSON.parse(loginCache).token : null;

      if (!unitType || !unitModel || !unitNumber)
        throw new Error('Harap lengkapi semua informasi unit');
      if (!operatorJDE || !operatorName || !site || !area)
        throw new Error('Harap lengkapi semua informasi operator');

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
      const payload = {
        IDTypeMentoring: unitTypeId,
        IDtrainer: trainerJDE,
        trainer: trainerName,
        IDoperator: operatorJDE,
        operator: operatorName,
        site: site,
        area: area,
        type: unitTypeId,
        model: unitModel,
        unit: unitNumber,
        date: dateMentoring.toISOString().split('T')[0],
        time_start: `${startTime.getHours()}:${String(
          startTime.getMinutes(),
        ).padStart(2, '0')}`,
        time_end: `${endTime.getHours()}:${String(
          endTime.getMinutes(),
        ).padStart(2, '0')}`,
        average_yscore_observation: observasi.totalYScore,
        average_point_observation: observasi.averagePoint,
        average_yscore_mentoring: mentoring.totalYScore,
        average_point_mentoring: mentoring.averagePoint,
        indicators: editableDetails.map(detail => ({
          fid_indicator: detail.fid_indicator,
          is_observasi: detail.is_observasi,
          is_mentoring: detail.is_mentoring,
          note_observasi: detail.note_observasi || '',
        })),
        id_local: Date.now() + '_' + Math.random().toString(36).slice(2, 10),
      };

      if (!isConnected) {
        await addQueueOffline(MENTORING_QUEUE_KEY, payload);
        await AsyncStorage.removeItem('mentoring_editable_details_temp');
        Toast.show({
          type: 'success',
          text1: 'Berhasil (Offline)',
          text2: 'Data akan dikirim saat online.',
        });
        navigation.goBack();
        return;
      }

      if (!token) throw new Error('Sesi habis, login kembali');

      const response = await axios.post(
        `${API_BASE_URL.mop}/mentoring/store`,
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
        await AsyncStorage.removeItem('mentoring_editable_details_temp');
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Data mentoring berhasil ditambahkan!',
        });
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('FullDashboard');
      } else {
        throw new Error(response.data.message || 'Gagal menambah data');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error.response?.data?.message || error.message || 'Terjadi kesalahan',
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2463EB" />
      </View>
    );
  }

  // --- UI ---
  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 40}}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Tambah Data Mentoring {unitType}</Text>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>

          {/* Status Offline Queue & Push Manual */}
          {mentoringQueueCount > 0 && (
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
                {mentoringQueueCount} data offline menunggu jaringan!
              </Text>
              {isConnected && (
                <TouchableOpacity
                  onPress={pushMentoringQueue}
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
          {syncing && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <ActivityIndicator size="small" color="#2463EB" />
              <Text style={{marginLeft: 6, fontSize: 13}}>
                Mengirim data offline...
              </Text>
            </View>
          )}

          {/* HEADER */}
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
                {/* Trainer Info */}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Trainer JDE</Text>
                    <TextInput
                      value={trainerJDE}
                      editable={false}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Nama Trainer</Text>
                    <TextInput
                      value={trainerName}
                      editable={false}
                      style={styles.input}
                    />
                  </View>
                </View>
                {/* Operator */}
                <View style={{padding: 1, marginBottom: 16}}>
                  <Text style={{fontSize: 16, marginBottom: 8}}>Operator</Text>
                  <View style={{zIndex: 1000, marginBottom: 10}}>
                    <DropDownPicker
                      open={operatorOpen}
                      value={operatorJDE}
                      items={operatorItems}
                      setOpen={setOperatorOpen}
                      setValue={val => {
                        setOperatorOpen(false);
                        const selected = operatorItems.find(
                          i => i.value === val(),
                        );
                        if (selected) {
                          setOperatorJDE(selected.item.employeeId);
                          setOperatorName(selected.item.EmployeeName);
                          setOperatorQuery(
                            `${selected.item.employeeId} - ${selected.item.EmployeeName}`,
                          );
                          setShowResults(false);
                        }
                      }}
                      setItems={setOperatorItems}
                      placeholder="Cari Operator JDE"
                      searchable={true}
                      searchPlaceholder="Cari Operator JDE"
                      onChangeSearchText={text => {
                        searchOperator(text);
                        setOperatorQuery(text);
                        setShowResults(true);
                      }}
                      listMode="MODAL"
                      zIndex={1500}
                      zIndexInverse={1000}
                      style={{
                        borderColor: '#111',
                        borderRadius: 6,
                        minHeight: 48,
                      }}
                      textStyle={{fontSize: 16}}
                      disabled={loading}
                    />
                  </View>
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
                {/* Site & Lokasi */}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Site</Text>
                    <RNPickerSelect
                      onValueChange={setSite}
                      items={rawSiteList
                        .filter(
                          site => !!site && site.code_site && site.name_site,
                        )
                        .map((site, idx) => ({
                          label: site.name_site,
                          value: site.code_site,
                          key: `${site.code_site}_${idx}`,
                        }))}
                      value={site}
                      placeholder={{label: 'Pilih Site', value: null}}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => (
                        <Icon name="chevron-down" size={20} color="#9ca3af" />
                      )}
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Lokasi</Text>
                    <TextInput
                      value={area}
                      onChangeText={setArea}
                      placeholder="Masukkan Area"
                      style={styles.input}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Unit dan Waktu */}
          <ToggleCard title="Unit dan Waktu" defaultExpanded={true}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipe Unit</Text>
              <View style={styles.staticInput}>
                <Text style={styles.staticText}>{unitType}</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model Unit</Text>
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
              <Text style={styles.label}>Nomor Unit</Text>
              <RNPickerSelect
                onValueChange={setUnitNumber}
                items={unitNumbers}
                value={unitNumber}
                placeholder={{label: 'Pilih Nomor Unit', value: null}}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
                Icon={() => (
                  <Icon name="chevron-down" size={20} color="#9ca3af" />
                )}
              />
            </View>
            {/* Waktu & Tanggal */}
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

          {/* Indikator */}
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
                          {ind.param2 && (
                            <Text style={styles.indicatorParam}>
                              • {ind.param2}
                            </Text>
                          )}
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Observasi:</Text>
                            <View style={styles.checkBoxWrapper}>
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
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Mentoring:</Text>
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
                            <Text style={styles.detailLabel}>Catatan:</Text>
                            <TextInput
                              style={[styles.detailValue, styles.noteInput]}
                              multiline
                              placeholder="Masukkan catatan..."
                              value={detail.note_observasi || ''}
                              onChangeText={text =>
                                updateNote(detail.fid_indicator, text)
                              }
                            />
                          </View>
                        </View>
                      );
                    })}
                    {/* Skor Kategori */}
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

          {/* Summary */}
          {renderLivePointsSection('observasi')}
          {renderLivePointsSection('mentoring')}
          <Button
            title={loading ? 'Menyimpan...' : 'Simpan'}
            onPress={handleSubmit}
            disabled={loading || syncing}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default AddDataMentoring;
