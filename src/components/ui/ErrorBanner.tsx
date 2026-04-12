import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss, style }) => {
  if (!message) return null;
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons
        name="alert-circle"
        size={20}
        color={colors.error[600]}
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss error"
          style={styles.dismiss}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.error[700]} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.error[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.error[500],
    borderRadius: 8,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  message: {
    flex: 1,
    color: colors.error[800],
    fontSize: 14,
    lineHeight: 20,
  },
  dismiss: {
    padding: 2,
    marginLeft: spacing.sm,
  },
});
