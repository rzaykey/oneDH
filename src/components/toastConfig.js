import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const toastConfig = {
  error: ({text1, text2}) => (
    <View style={styles.toastContainer}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    backgroundColor: '#ffffffff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  text1: {
    color: '#FF4D4F',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  text2: {
    color: '#FF4D4F',
    fontSize: 14,
    flexWrap: 'wrap',
  },
});
