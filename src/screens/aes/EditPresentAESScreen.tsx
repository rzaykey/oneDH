import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Button,
  Pressable,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import API_BASE_URL from '../../config';
import {agendaFormStyles as styles} from '../../styles/agendaFormStyles';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CollapsibleCard = ({title, collapsed, onToggle, children}) => (
  <View style={styles.card}>
    <TouchableOpacity style={styles.cardHeader} onPress={onToggle}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardIcon}>{collapsed ? '+' : '-'}</Text>
    </TouchableOpacity>
    {!collapsed && <View style={styles.cardContent}>{children}</View>}
  </View>
);

export default function EditPresentAESScreen({route, navigation}) {
  const {agendaId} = route.params || {};
  const [loading, setLoading] = useState(true);
  const [collapsedGeneral, setCollapsedGeneral] = useState(false);
  const [collapsedTime, setCollapsedTime] = useState(true);
  const isDisabled = agenda?.status === 'Close';

  // Field dari JSON
  const [title, setTitle] = useState('');
  const [fidSite, setFidSite] = useState('');
  const [fidCategory, setFidCategory] = useState('');
  const [namaPemateri, setNamaPemateri] = useState('');
  const [remark, setRemark] = useState('');
  const [code_agenda, setCodAgenda] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [name_presenter, setNamePresenter] = useState('');
  const [fid_presenter, setFidPresenter] = useState('');
  const [datestart, setDatestart] = useState(new Date());
  const [datefinish, setDatefinish] = useState(new Date());

  // UI state
  const [saving, setSaving] = useState(false);
  const [collapsedDetail, setCollapsedDetail] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [photoClose, setPhotoClose] = useState('');
  const [agendaDetail, setAgendaDetail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const FILE_BASE_URL = API_BASE_URL.onedh.replace('/api', '');
  interface Agenda {
    status?: string;
  }
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const getAuthHeader = async () => {
    const cache = await AsyncStorage.getItem('loginCache');
    const token = cache ? JSON.parse(cache)?.token : null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchMasterData = async () => {
    try {
      const headers = await getAuthHeader();

      // Ambil cache dari AsyncStorage
      const [deptCache, siteCache, categoryCache] = await Promise.all([
        AsyncStorage.getItem('master_dept'),
        AsyncStorage.getItem('master_site'),
        AsyncStorage.getItem('master_category'),
      ]);

      // Parse cache jika ada
      let deptData = deptCache ? JSON.parse(deptCache) : null;
      let siteData = siteCache ? JSON.parse(siteCache) : null;
      let categoryData = categoryCache ? JSON.parse(categoryCache) : null;

      // Ambil data dari API jika cache kosong atau tidak valid
      if (!Array.isArray(deptData)) {
        const res = await fetch(`${API_BASE_URL.onedh}/GetDept`, {headers});
        const json = await res.json();
        deptData = Array.isArray(json) ? json : json?.data || [];
        await AsyncStorage.setItem('master_dept', JSON.stringify(deptData)); // update cache
      }

      if (!Array.isArray(siteData)) {
        const res = await fetch(`${API_BASE_URL.onedh}/GetSite`, {headers});
        const json = await res.json();
        siteData = Array.isArray(json) ? json : json?.data || [];
        await AsyncStorage.setItem('master_site', JSON.stringify(siteData)); // update cache
      }

      if (!Array.isArray(categoryData)) {
        const res = await fetch(`${API_BASE_URL.onedh}/GetCategory`, {headers});
        const json = await res.json();
        categoryData = Array.isArray(json) ? json : json?.data || [];
        await AsyncStorage.setItem(
          'master_category',
          JSON.stringify(categoryData),
        ); // update cache
      }

      // Set state dengan aman
      setDepartments(
        deptData.map(d => ({
          label: d?.department_name ?? '',
          value: d?.department_name != null ? String(d.department_name) : '',
        })),
      );

      setSites(
        siteData.map(s => ({
          label: s?.code ?? '',
          value: s?.id != null ? String(s.id) : '',
        })),
      );

      setCategories(
        categoryData.map(c => ({
          label: c?.name ?? '',
          value: c?.id != null ? String(c.id) : '',
        })),
      );
    } catch (e) {
      console.log('❌ Gagal ambil master data:', e);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchAgendaDetail = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();

      const res = await fetch(
        `${API_BASE_URL.onedh}/GetAgendaDetails?id=${agendaId}`,
        {
          method: 'GET',
          headers,
        },
      );

      const json = await res.json();

      if (json?.length) {
        const agenda = json[0];

        setCodAgenda(agenda.code_agenda || '');
        setCompany(agenda.company || '');
        setNamePresenter(agenda.name_presenter || '');
        setFidPresenter(agenda.fid_presenter?.toString() || '');
        setTitle(agenda.tittle || '');
        setRemark(agenda.remark || '');
        setNamaPemateri(agenda.nama_pemateri || '');
        setDatestart(dayjs(agenda.datetime_start).toDate());
        setDatefinish(dayjs(agenda.datetime_end).toDate());
        setAgendaDetail(agenda);
        setDepartment(agenda.department || '');
        setFidSite(agenda.fid_site || '');
        setFidCategory(agenda.fid_category?.toString() || '');
        setPhotoClose(agenda.photo || '');
        setAgenda(agenda);
      }
    } catch (err) {
      console.log('❌ Gagal ambil detail agenda:', err);
    }
    setLoading(false);
  };

  const updateAgenda = async () => {
    try {
      setSaving(true);
      const headers = await getAuthHeader();

      const payload = {
        fid_agenda: agendaId,
        fid_site: fidSite,
        fid_category: fidCategory,
        fid_department: department,
        tittle: title,
        datestart: dayjs(datestart).format('YYYY-MM-DD HH:mm:ss'),
        datefinish: dayjs(datefinish).format('YYYY-MM-DD HH:mm:ss'),
        remark,
        nama_pemateri: namaPemateri,
        jdeno: fid_presenter,
        company,
      };

      const res = await fetch(`${API_BASE_URL.onedh}/EditAgenda`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Agenda berhasil diperbarui',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 40,
        });
        navigation.replace('AESMyHistory');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Gagal Menyimpan Agenda',
          text2: data?.notif || data?.message || 'Terjadi kesalahan.',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 40,
        });
      }
    } catch (error) {
      console.error('❌ Error updateAgenda:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Tidak bisa menghubungi server',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 40,
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (agendaId) {
      fetchAgendaDetail();
    }
  }, [agendaId]);

  const toggleCollapse = setter => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(prev => !prev);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f8ef7" />
      </View>
    );
  }
  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={styles.container}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Form Event Detail</Text>

          {/* Detail Agenda */}
          <CollapsibleCard
            title="Info Umum"
            collapsed={collapsedGeneral}
            onToggle={() => toggleCollapse(setCollapsedGeneral)}>
            <Text style={styles.label}>Judul Agenda</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Site</Text>
            <RNPickerSelect
              onValueChange={setFidSite}
              value={fidSite}
              items={sites}
              style={{
                inputIOS: styles.inputIOS,
                inputAndroid: styles.inputAndroid,
              }}
              placeholder={{label: 'Pilih Site', value: null}}
              disabled={isDisabled}
            />

            <Text style={styles.label}>Kategori</Text>
            <RNPickerSelect
              onValueChange={setFidCategory}
              value={fidCategory}
              items={categories}
              style={{
                inputIOS: styles.inputIOS,
                inputAndroid: styles.inputAndroid,
              }}
              placeholder={{label: 'Pilih Kategori', value: null}}
            />

            <Text style={styles.label}>Nama Presenter</Text>
            <TextInput
              style={[
                styles.input,
                {backgroundColor: '#f0f0f0', color: '#888'},
              ]}
              editable={false}
              value={name_presenter}
              onChangeText={setNamePresenter}
            />

            <Text style={styles.label}>FID Presenter</Text>
            <TextInput
              style={[
                styles.input,
                {backgroundColor: '#f0f0f0', color: '#888'},
              ]}
              editable={false}
              value={fid_presenter}
              onChangeText={setFidPresenter}
            />
          </CollapsibleCard>

          <CollapsibleCard
            title="Detail Agenda"
            collapsed={collapsedDetail}
            onToggle={() => toggleCollapse(setCollapsedDetail)}>
            <Text style={styles.label}>Kode Agenda</Text>
            <TextInput
              style={[
                styles.input,
                {backgroundColor: '#f0f0f0', color: '#888'},
              ]}
              editable={false}
              value={code_agenda}
              onChangeText={setCodAgenda}
            />

            <Text style={styles.label}>Nama Pemateri</Text>
            <TextInput
              style={styles.input}
              value={namaPemateri}
              onChangeText={setNamaPemateri}
            />

            <Text style={styles.label}>Company</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
            />

            <Text style={styles.label}>Department</Text>
            <RNPickerSelect
              onValueChange={setDepartment}
              value={department}
              items={departments}
              style={{
                inputIOS: styles.inputIOS,
                inputAndroid: styles.inputAndroid,
              }}
              placeholder={{label: 'Pilih Department', value: null}}
            />

            <Text style={styles.label}>Remark</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={remark}
              onChangeText={setRemark}
            />

            {photoClose ? (
              <View style={{alignItems: 'center', marginVertical: 10}}>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <Image
                    source={{uri: `${FILE_BASE_URL}/storage/${photoClose}`}}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{color: '#999'}}>Tidak ada foto penutupan</Text>
            )}
            {/* Modal Fullscreen */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}>
              <Pressable
                style={styles.modalContainer}
                onPress={() => setModalVisible(false)}>
                <Image
                  source={{uri: `${FILE_BASE_URL}/storage/${photoClose}`}}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </Pressable>
            </Modal>
          </CollapsibleCard>

          <CollapsibleCard
            title="Tanggal & Waktu"
            collapsed={collapsedTime}
            onToggle={() => toggleCollapse(setCollapsedTime)}>
            {/* Tanggal Mulai */}
            <Text style={styles.label}>Tanggal Mulai</Text>
            <View style={styles.row}>
              {/* Tanggal */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tanggal:</Text>
                <Button
                  title={dayjs(datestart).format('YYYY-MM-DD')}
                  onPress={() => setShowStartDatePicker(true)}
                />
                {showStartDatePicker && (
                  <DateTimePicker
                    value={dayjs(datestart).toDate()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (event?.type === 'set' && selectedDate) {
                        const time = dayjs(datestart).format('HH:mm:ss');
                        setDatestart(
                          dayjs(selectedDate)
                            .hour(dayjs(datestart).hour())
                            .minute(dayjs(datestart).minute())
                            .second(dayjs(datestart).second())
                            .toDate(),
                        );
                      }
                    }}
                  />
                )}
              </View>

              {/* Jam */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jam:</Text>
                <Button
                  title={dayjs(datestart).format('HH:mm:ss')}
                  onPress={() => setShowStartTimePicker(true)}
                />
                {showStartTimePicker && (
                  <DateTimePicker
                    value={dayjs(datestart).toDate()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowStartTimePicker(false);
                      if (event?.type === 'set' && selectedTime) {
                        const date = dayjs(datestart).format('YYYY-MM-DD');
                        setDatestart(
                          dayjs(
                            `${date} ${dayjs(selectedTime).format('HH:mm:ss')}`,
                          ).toDate(),
                        );
                      }
                    }}
                  />
                )}
              </View>
            </View>

            {/* Tanggal Selesai */}
            <Text style={styles.label}>Tanggal Selesai</Text>
            <View style={styles.row}>
              {/* Tanggal */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tanggal:</Text>
                <Button
                  title={dayjs(datefinish).format('YYYY-MM-DD')}
                  onPress={() => setShowEndDatePicker(true)}
                />
                {showEndDatePicker && (
                  <DateTimePicker
                    value={dayjs(datefinish).toDate()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (event?.type === 'set' && selectedDate) {
                        const time = dayjs(datefinish).format('HH:mm:ss');
                        setDatefinish(
                          dayjs(selectedDate)
                            .hour(dayjs(datefinish).hour())
                            .minute(dayjs(datefinish).minute())
                            .second(dayjs(datefinish).second())
                            .toDate(),
                        );
                      }
                    }}
                  />
                )}
              </View>

              {/* Jam */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Jam:</Text>
                <Button
                  title={dayjs(datefinish).format('HH:mm:ss')}
                  onPress={() => setShowEndTimePicker(true)}
                />
                {showEndTimePicker && (
                  <DateTimePicker
                    value={dayjs(datefinish).toDate()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowEndTimePicker(false);
                      if (event?.type === 'set' && selectedTime) {
                        const date = dayjs(datefinish).format('YYYY-MM-DD');
                        setDatefinish(
                          dayjs(
                            `${date} ${dayjs(selectedTime).format('HH:mm:ss')}`,
                          ).toDate(),
                        );
                      }
                    }}
                  />
                )}
              </View>
            </View>
          </CollapsibleCard>

          {agenda?.status === 'Open' && (
            <TouchableOpacity
              onPress={updateAgenda}
              style={styles.button}
              disabled={saving}>
              <Text style={styles.buttonText}>
                {saving ? 'Menyimpan...' : 'Update Agenda'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
