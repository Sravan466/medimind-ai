import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface PasswordStrengthProps {
  password: string;
}

type Strength = { score: 0 | 1 | 2 | 3; label: string; color: string };

const evaluate = (pw: string): Strength => {
  if (!pw) return { score: 0, label: '', color: colors.neutral[200] };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(score, 3) as 0 | 1 | 2 | 3;
  if (clamped <= 1) return { score: 1, label: 'Weak', color: colors.error[500] };
  if (clamped === 2) return { score: 2, label: 'Medium', color: colors.warning[500] };
  return { score: 3, label: 'Strong', color: colors.primary[600] };
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const strength = useMemo(() => evaluate(password), [password]);
  if (!password) return null;
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: strength.score, min: 0, max: 3 }}
      accessibilityLabel={`Password strength: ${strength.label}`}
    >
      <View style={styles.bars}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: strength.score >= i ? strength.color : colors.neutral[200] },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: strength.color }]}>{strength.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
