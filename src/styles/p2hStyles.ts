import {StyleSheet, Platform, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

export const p2hStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  title: {
    fontSize: 19,
    color: '#176B87',
    fontWeight: 'bold',
    marginVertical: 18,
    marginLeft: 3,
    letterSpacing: 0.3,
  },
  menuList: {
    paddingBottom: 22,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    marginBottom: 13,
    elevation: 3,
    shadowColor: '#1E90FF',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    paddingVertical: 13,
    paddingHorizontal: 15,
    minHeight: 66,
    borderWidth: 1,
    borderColor: '#e9eef6',
    // Optional anim effect:
    // transform: [{scale: 0.98}]
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
    color: '#176B87',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 13,
    color: '#586479',
    fontWeight: '400',
  },
});
