import {StyleSheet, Platform, Dimensions} from 'react-native';
const {width} = Dimensions.get('window');

export const mopStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    paddingHorizontal: 18,
  },
  container: {
    flexGrow: 1,
    // paddingHorizontal: 18,
    // paddingBottom: 18,
    // paddingTop: 18, // ✅ agar title tidak terlalu atas
  },
  title: {
    fontSize: 22,
    color: '#2463EB',
    fontWeight: 'bold',
    marginVertical: 18,
    marginLeft: 3,
    letterSpacing: 0.3, // ✅ agar tidak dempet section
  },
  section: {
    fontWeight: '600',
    fontSize: 16.2,
    color: '#2463EB',
    marginBottom: 7,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    marginBottom: 13,
    elevation: 3,
    shadowColor: '#2463EB',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    paddingVertical: 13,
    paddingHorizontal: 15,
    minHeight: 66,
    borderWidth: 1,
    borderColor: '#e9eef6',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F8CFD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#3E82D7',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
  },
  menuInfo: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    fontSize: 16.2,
    color: '#2463EB',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 13,
    color: '#586479',
    fontWeight: '400',
  },
  refreshButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  refreshButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  refreshText: {
    color: '#FFF',
    fontWeight: '600',
  },
  refreshSpinner: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // ✅
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 300,
    elevation: 3,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#2d3748',
  },
  modalItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  modalIcon: {
    marginRight: 10,
  },
  modalItemText: {
    fontSize: 16,
    color: '#1a202c',
  },
  modalCancel: {
    color: '#e74c3c',
    marginTop: 14,
  },
});
