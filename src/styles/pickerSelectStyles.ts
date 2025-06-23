import {StyleSheet} from 'react-native';
import {Colors} from './colors'; // pastikan import Colors yang kamu pakai

export const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    borderRadius: 10,
    color: Colors.textPrimary,
    paddingRight: 30,
    backgroundColor: Colors.backgroundLight,
    marginBottom: 18,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    borderRadius: 10,
    color: Colors.textPrimary,
    paddingRight: 30,
    backgroundColor: Colors.backgroundLight,
    marginBottom: 18,
  },
  placeholder: {
    color: Colors.textMuted,
  },
});
