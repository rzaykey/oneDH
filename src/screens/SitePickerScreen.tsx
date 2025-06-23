import React from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {sitePickerStyles as styles} from '../styles/sitePickerStyles';
import {useSiteContext} from '../context/SiteContext';

const SitePickerScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const {setActiveSite} = useSiteContext();

  const sites = route.params?.sites || [];

  const handlePickSite = site => {
    setActiveSite(site); // Update context!
    navigation.replace('MainApp'); // atau Dashboard
  };

  return (
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
  );
};

export default SitePickerScreen;
