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
    color: '#2463EB',
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
    color: '#2463EB',
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
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '100%', // pastikan tidak melebihi container
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 52,
    marginBottom: 52,
    paddingHorizontal: 26,
  },
  emptyText: {
    color: '#2463EB', // Lebih readable di white/gradient
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },
  limitPickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  limitLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  limitButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginRight: 6,
  },
  limitButtonActive: {
    backgroundColor: '#2563eb22',
    borderColor: '#2563eb',
  },
  limitText: {
    fontSize: 14,
    color: '#555',
  },
  limitTextActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  extraInfo: {
    marginTop: 8,
    paddingLeft: 8,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  closeButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    marginBottom: 10,
    textAlignVertical: 'top', // penting untuk multiline
  },
  modalDateText: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
    gap: 8,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  statusOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  statusOptionText: {
    color: '#333',
  },
  statusOptionTextSelected: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10, // jika React Native versi >= 0.71
    marginBottom: 12,
  },
  dateTimeBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
