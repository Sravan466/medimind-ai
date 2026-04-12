import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';

interface EmptyStateProps {
  illustration?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  illustration = 'inbox-outline',
  title,
  description,
  action,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.illustration}>
        <MaterialCommunityIcons
          name={illustration}
          size={48}
          color={colors.primary[600]}
        />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.lg,
  },
});
