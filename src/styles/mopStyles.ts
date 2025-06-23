import {StyleSheet} from 'react-native';

export const mopStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  container: {
    flexGrow: 1,
    padding: 18,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 21,
    color: '#1E90FF',
    marginBottom: 18,
    marginTop: 8,
    alignSelf: 'center',
    letterSpacing: 1,
  },
  section: {
    fontWeight: '600',
    fontSize: 16,
    color: '#29436e',
    marginTop: 18,
    marginBottom: 7,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 9,
    elevation: 2,
    shadowColor: '#222',
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
});
