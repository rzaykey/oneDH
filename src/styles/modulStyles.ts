import {StyleSheet, Dimensions} from 'react-native';

export const modulStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: '#F4F7FA',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 18,
    letterSpacing: 0.1,
    alignSelf: 'flex-start',
    marginLeft: 5,
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
    shadowColor: '#1E90FF',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: {width: 0, height: 3},
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E90FF',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.03,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#F4F7FA',
    paddingHorizontal: 18,
  },
});
