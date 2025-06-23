import {StyleSheet} from 'react-native';
import {Colors} from './colors'; // sesuaikan path

export const commonStyles = StyleSheet.create({
  pointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pointCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pointCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: Colors.textPrimary,
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pointLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  pointValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
