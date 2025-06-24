import React from 'react';
import {View, Text, TouchableOpacity, FlatList} from 'react-native';
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
  // JCM: 'JCMScreen',
  // MOP: 'MOPScreen',
};

const iconForModule = (mod: string) => {
  switch (mod) {
    case 'P2H':
      return (
        <Icon
          name="car-outline"
          size={26}
          color="#4974c5"
          style={styles.icon}
        />
      );
    case 'JCM':
      return (
        <Icon
          name="list-outline"
          size={26}
          color="#0d9c6c"
          style={styles.icon}
        />
      );
    case 'MOP':
      return (
        <Icon
          name="hammer-outline"
          size={26}
          color="#b47d04"
          style={styles.icon}
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
      alert('Fitur untuk modul ini masih dalam tahap Development');
    }
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#1E90FF']}
      style={{flex: 1}}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <SafeAreaView
        style={[
          styles.safeContainer,
          // {paddingTop: insets.top + 8, paddingBottom: insets.bottom}, // biar kiri-kanan lebih lega
        ]}>
        <Text style={styles.sectionTitle}>
          Modul Untuk Site: <Text style={{color: '#29436e'}}>{activeSite}</Text>
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
                <Text style={[styles.label, {fontSize: 13, color: '#444'}]}>
                  {item.permit?.toUpperCase() || '-'}
                </Text>
                <Text
                  style={{fontSize: 12, color: '#888', textAlign: 'center'}}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ModuleScreen;
