import {StyleSheet} from 'react-native';

export const sitePickerStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 28,
    paddingTop: 12,
  },
  siteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 19,
    paddingHorizontal: 16,
    marginBottom: 13,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1E90FF',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  siteText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#29436e',
  },
});
