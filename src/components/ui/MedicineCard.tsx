import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

export type MedicineStatus = 'taken' | 'upcoming' | 'missed' | 'skipped' | 'inactive';

interface MedicineCardProps {
  name: string;
  subtitle?: string;
  times?: string[];
  status?: MedicineStatus;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const STATUS_STYLES: Record<MedicineStatus, { bg: string; fg: string; label: string }> = {
  taken:    { bg: colors.success[50], fg: colors.success[700], label: 'Taken' },
  upcoming: { bg: colors.primary[50], fg: colors.primary[700], label: 'Upcoming' },
  missed:   { bg: colors.error[50],   fg: colors.error[700],   label: 'Missed' },
  skipped:  { bg: colors.neutral[100], fg: colors.neutral[700], label: 'Skipped' },
  inactive: { bg: colors.neutral[100], fg: colors.neutral[600], label: 'Inactive' },
};

const MedicineCardImpl: React.FC<MedicineCardProps> = ({
  name,
  subtitle,
  times,
  status,
  onPress,
  onLongPress,
  style,
  accessibilityLabel,
}) => {
  const statusStyle = status ? STATUS_STYLES[status] : null;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${name}${subtitle ? `, ${subtitle}` : ''}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="pill" size={24} color={colors.primary[600]} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        {times && times.length > 0 ? (
          <View style={styles.timesRow}>
            {times.slice(0, 4).map((t) => (
              <View key={t} style={styles.timeChip}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.neutral[600]} />
                <Text style={styles.timeText}>{t}</Text>
              </View>
            ))}
            {times.length > 4 ? (
              <Text style={styles.moreTimes}>+{times.length - 4}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {statusStyle ? (
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.fg }]}>{statusStyle.label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

export const MedicineCard = React.memo(MedicineCardImpl);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 96,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    marginBottom: spacing.sm + 4,
    ...shadows.small,
  },
  pressed: {
    opacity: 0.96,
    backgroundColor: colors.neutral[50],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  moreTimes: {
    fontSize: 12,
    color: colors.neutral[500],
    marginLeft: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
