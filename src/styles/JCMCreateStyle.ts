import {StyleSheet} from 'react-native';

export const JCMCreateStyle = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#333',
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 18,
    textAlign: 'center',
    color: '#2463EB',
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  picker: {
    inputIOS: {
      borderWidth: 1,
      borderColor: '#e3e8f0',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 15,
      backgroundColor: '#fff',
      marginBottom: 2,
    },
    inputAndroid: {
      borderWidth: 1,
      borderColor: '#e3e8f0',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 15,
      backgroundColor: '#fff',
      marginBottom: 2,
      color: '#000',
    },
  },
  taskNumberBox: {
    borderWidth: 1,
    borderColor: '#e3e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f3f4f6',
  },
  formGroup: {
    marginBottom: 12,
  },
  button: {
    marginTop: 22,
    backgroundColor: '#2463EB',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 24,
    marginBottom: 26,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
  },
  buttonDisabled: {
    backgroundColor: '#aac4f7',
  },
  offlineContainer: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
  },
  syncButton: {
    marginTop: 8,
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 14,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#2463EB',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },

  iconButton: {
    padding: 10,
  },

  iconText: {
    fontSize: 20,
  },

  flatButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 120,
    alignItems: 'center',
  },

  flatButtonDisabled: {
    opacity: 0.5,
  },

  flatButtonText: {
    fontSize: 14,
    color: '#333',
  },
  offlineButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    marginHorizontal: 12, // biar sejajar dengan card/form lainnya
  },

  flatButtonWide: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  badge: {
    backgroundColor: '#e02424',
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 16, // Jika React Native >= 0.71
  },
  inputContainer: {
    flex: 1,
  },
  refreshButton: {
    padding: 10,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    marginHorizontal: 24, // biar konsisten dengan tombol lain
    margin: 5,
  },
  refreshButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
