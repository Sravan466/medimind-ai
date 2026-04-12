import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

interface CardHeaderProps {
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  right?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

const CardHeader: React.FC<CardHeaderProps> = ({ title, icon, right, style, titleStyle }) => (
  <View style={[styles.header, style]}>
    {icon ? (
      <View style={styles.iconChip}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary[600]} />
      </View>
    ) : null}
    <Text style={[styles.title, titleStyle]} accessibilityRole="header">
      {title}
    </Text>
    {right ? <View style={styles.right}>{right}</View> : null}
  </View>
);

const CardBase: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  padding = spacing.lg,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const content = (
    <View style={[styles.card, { padding }, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
};

export const Card = Object.assign(CardBase, { Header: CardHeader });

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadows.small,
  },
  pressed: {
    opacity: 0.97,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  right: {
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
});
