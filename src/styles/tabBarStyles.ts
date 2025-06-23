import {StyleSheet, Platform} from 'react-native';

export const tabBarStyles = StyleSheet.create({
  tabBar: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#fff',
    elevation: 14,
    shadowColor: '#222',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: -2},
    position: 'absolute',
    overflow: 'hidden',
    paddingTop: 5,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    minWidth: 90,
    flex: 1,
    marginTop: Platform.OS === 'android' ? 3 : 0,
  },
  tabIcon: {
    marginBottom: 1,
  },
  tabLabel: {
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '600',
    color: '#AAB2BD',
    marginTop: 2,
    letterSpacing: 0.08,
    textAlign: 'center',
  },
});
