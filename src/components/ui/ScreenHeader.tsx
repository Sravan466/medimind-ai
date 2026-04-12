import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, screenTypography } from '../../styles/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, right, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            accessible={true}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  textWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...screenTypography.screenTitle,
    color: colors.neutral[900],
  },
  subtitle: {
    ...screenTypography.screenSubtitle,
    color: colors.neutral[600],
    marginTop: 2,
  },
  right: {
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
});
