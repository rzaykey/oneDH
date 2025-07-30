import {StyleSheet, Platform, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

export const jcmStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
    backgroundColor: 'transparent',
  },

  title: {
    fontSize: 19,
    color: '#2463EB',
    fontWeight: 'bold',
    marginVertical: 18,
    marginLeft: 3,
    letterSpacing: 0.3,
  },

  menuList: {
    paddingBottom: 22,
  },

  sectionContainer: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
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

  // Tambahan untuk modal
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },

  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center',
    color: '#222',
  },

  modalButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15,
  },
});
