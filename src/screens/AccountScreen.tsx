import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const AccountScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      {/* Tambahkan menu edit profil, dsb */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {fontSize: 22, fontWeight: 'bold', color: '#1E90FF'},
});

export default AccountScreen;
