// src/styles/loginStyles.ts
import {StyleSheet} from 'react-native';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10, // Atur sesuai kebutuhan
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180, // Sedikit dikurangi dari 200 agar lebih proporsional
    marginBottom: 10,
    marginTop: 100,
  },
  logo: {
    width: '70%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    width: '90%', // Atur lebar relatif, atau ganti ke maxWidth
    maxWidth: 340, // Biar tidak lebih dari 340px
    alignSelf: 'center', // Agar input center di parent
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#0f0f0f',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
    maxWidth: 340,
    alignSelf: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },

  inputFocus: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f6ff',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  iconBtn: {
    padding: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 6,
  },
  statusWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusOnline: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusOffline: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
});
