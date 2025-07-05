import {StyleSheet} from 'react-native';

export const editDataStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
    marginVertical: 18,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  sectionContent: {
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  half: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  timeDateGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeDateInput: {
    width: '30%',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  indicatorCategory: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  indicatorItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  indicatorParam: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
  },
  indicatorDetail: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 100,
    fontSize: 13,
    color: '#6b7280',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    borderRadius: 5,
    minHeight: 40,
  },
  pointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pointCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pointCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pointLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  pointValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
  },
  finalScore: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#2463EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textInput: {
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 8,
    maxHeight: 150,
  },
  searchResultItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  // Tambahan dari pickerSelectStyles
  categoryScore: {
    marginTop: 8,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  operatorBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    color: '#000',
  },
  pickerSelectAndroid: {
    height: 48, // atau coba 50
    minHeight: 48, // tambahan jaga-jaga
    paddingHorizontal: 16,
    paddingVertical: 12, // tambahkan supaya teks tidak kepotong
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    justifyContent: 'center',
    textAlignVertical: 'center', // ini penting di Android
    backgroundColor: '#fff',
    lineHeight: 24, // pastikan cukup besar
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clearButton: {
    marginLeft: 12,
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
export const operatorDropdownBox = {
  position: 'absolute',
  left: 0,
  right: 0,
  zIndex: 10,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#111',
  borderRadius: 7,
  maxHeight: 170,
  top: 65, // bisa diatur sesuai jarak input search
};
export const checkBoxWrapper = {
  borderWidth: 1,
  borderColor: '#111',
  borderRadius: 4,
  padding: 1,
  marginRight: 6,
};
