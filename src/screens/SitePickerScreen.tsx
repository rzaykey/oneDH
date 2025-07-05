import React from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {sitePickerStyles as styles} from '../styles/sitePickerStyles';
import LinearGradient from 'react-native-linear-gradient';
import {useSiteContext} from '../context/SiteContext';
import Toast from 'react-native-toast-message';

const SitePickerScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const {setActiveSite} = useSiteContext();

  const sites = route.params?.sites || [];

  const handlePickSite = site => {
    setActiveSite(site);

    Toast.show({
      type: 'success',
      text1: 'Site Dipilih',
      text2: `Lokasi aktif: ${site}`,
      position: 'top',
      visibilityTime: 2000,
      topOffset: 50,
    });

    navigation.replace('MainApp'); // atau Dashboard
  };

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.inner}>
          <Text style={styles.title}>Pilih Site/Lokasi:</Text>
          {sites.length === 0 ? (
            <Text
              style={{
                color: 'red',
                marginTop: 32,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 16,
              }}>
              Tidak ada site yang bisa dipilih.
            </Text>
          ) : (
            <FlatList
              data={sites}
              keyExtractor={item => item}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.siteCard}
                  activeOpacity={0.78}
                  onPress={() => handlePickSite(item)}>
                  <Text style={styles.siteText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default SitePickerScreen;
