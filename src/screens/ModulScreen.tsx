import React from 'react';
import {View, Text, TouchableOpacity, FlatList, Image} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useSiteContext} from '../context/SiteContext';
import Icon from 'react-native-vector-icons/Ionicons';
import {modulStyles as styles} from '../styles/modulStyles';
import {Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const CARD_SIZE = (Dimensions.get('window').width - 54) / 2;

const MODULE_TO_SCREEN: Record<string, string> = {
  P2H: 'P2HScreen',
  JCM: 'JCMScreen',
  MOP: 'MOPScreen',
};

const iconForModule = (mod: string) => {
  switch (mod) {
    case 'P2H':
      return (
        <Image
          source={require('../assets/images/list.png')} // Ganti path sesuai lokasi car.png
          style={[styles.icon, {width: 50, height: 50}]}
          resizeMode="contain"
        />
      );
    case 'JCM':
      return (
        <Image
          source={require('../assets/images/mechanic.png')} // Ganti path sesuai lokasi car.png
          style={[styles.icon, {width: 50, height: 50}]}
          resizeMode="contain"
        />
      );
    case 'MOP':
      return (
        <Image
          source={require('../assets/images/practice.png')} // Ganti path sesuai lokasi car.png
          style={[styles.icon, {width: 50, height: 50}]}
          resizeMode="contain"
        />
      );
    default:
      return (
        <Icon name="apps-outline" size={26} color="#888" style={styles.icon} />
      );
  }
};

const ModuleScreen: React.FC = () => {
  const navigation = useNavigation();
  const {activeSite, roles} = useSiteContext();
  const insets = useSafeAreaInsets();

  const modulesForActiveSite = roles.filter(r => r.code_site === activeSite);

  const handleModulePress = (module: string) => {
    const screenName = MODULE_TO_SCREEN[module];
    if (screenName) {
      navigation.navigate(screenName as never);
    } else {
      alert('Aplikasi ini dalam tahap pengembangan');
    }
  };

  return (
    <LinearGradient
      colors={['#FFBE00', '#B9DCEB']}
      style={{flex: 1}}
      start={{x: 3, y: 3}}
      end={{x: 1, y: 0}}>
      <SafeAreaView
        style={[
          styles.safeContainer,
          // {paddingTop: insets.top + 8, paddingBottom: insets.bottom}, // biar kiri-kanan lebih lega
        ]}>
        <Text style={styles.sectionTitle}>
          Aplikasi Untuk Site:{' '}
          <Text style={{color: '#29436e'}}>{activeSite}</Text>
        </Text>
        {modulesForActiveSite.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 32,
            }}>
            <Text style={{color: '#888', fontSize: 16, fontWeight: '600'}}>
              Tidak ada modul yang dapat diakses di site ini.
            </Text>
          </View>
        ) : (
          <FlatList
            data={modulesForActiveSite}
            numColumns={2}
            keyExtractor={(_, i) => i.toString()}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={{justifyContent: 'space-between'}}
            contentContainerStyle={styles.grid}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.card, {width: CARD_SIZE}]}
                activeOpacity={0.86}
                onPress={() => handleModulePress(item.module)}>
                {iconForModule(item.module)}
                <Text style={styles.label}>{item.module}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ModuleScreen;
