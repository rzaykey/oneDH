import React, {useEffect} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthLoading'>;

const AuthLoadingScreen = ({navigation}) => {
  useEffect(() => {
    const checkAuth = async () => {
      const cache = await AsyncStorage.getItem('loginCache');
      if (!cache) {
        navigation.replace('Login');
        return;
      }

      const session = JSON.parse(cache);
      const roles = session.roles || [];
      const sites = [...new Set(roles.map(r => r.code_site))];

      if (sites.length === 0) {
        // Tidak ada site, redirect ke login/atau tampilkan pesan error
        navigation.replace('Login');
      } else if (sites.length === 1) {
        // Auto set activeSite dan langsung ke MainApp
        // Kamu bisa pakai event, atau update context lewat MainApp
        navigation.replace('MainApp', {autoSite: sites[0]});
      } else {
        navigation.replace('SitePicker', {sites});
      }
    };

    checkAuth();
  }, [navigation]);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator size="large" color="#1E90FF" />
    </View>
  );
};

export default AuthLoadingScreen;
