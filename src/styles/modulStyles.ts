import {StyleSheet, Platform, Dimensions} from 'react-native';
const {width} = Dimensions.get('window');

export const modulStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: '#F4F7FA',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#2463EB',
    marginBottom: 18,
    letterSpacing: 0.1,
    alignSelf: 'flex-start',
    marginLeft: 5,
    marginVertical: 18,
  },
  grid: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 8,
    marginHorizontal: 6,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2463EB',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: {width: 0, height: 3},
  },
  icon: {
    marginBottom: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2463EB',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.03,
  },
  safeContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
});
