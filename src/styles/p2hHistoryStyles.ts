import {StyleSheet, Platform, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

export const p2hHistoryStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // <-- ini yang bikin center horizontal
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomColor: '#cbd6ee',
    marginBottom: 5,
    marginTop: 18, // atau paddingTop: 18,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1E90FF',
    marginVertical: 0, // <-- hilangkan, sudah cukup di headerWrap
    textAlign: 'center', // supaya teksnya juga rata tengah
  },

  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 13,
    padding: 14,
    elevation: 2,
    shadowColor: '#aaa',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e3eafe',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  unitText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1E90FF',
  },
  siteLabel: {
    backgroundColor: '#e3eafe',
    color: '#2563eb',
    fontSize: 13,
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  modelText: {
    color: '#444',
    fontWeight: '500',
    marginBottom: 3,
    fontSize: 14,
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  driverName: {
    color: '#3556aa',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    marginTop: 2,
  },
  labelInfo: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },
  hmkm: {
    color: '#777',
    fontSize: 13,
    fontWeight: 'bold',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 1,
  },
  badge: {
    borderWidth: 1.5,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 13,
  },
  keteranganRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  ketLabel: {
    color: '#444',
    fontWeight: 'bold',
    fontSize: 13,
  },
  ketValue: {
    color: '#e67e22',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 52,
    marginBottom: 52,
    paddingHorizontal: 26,
  },
  emptyText: {
    color: '#176B87', // Lebih readable di white/gradient
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 2,
  },
  emptySubText: {
    color: '#29436e',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 0,
  },
});
