import React, { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, AccessibilityInfo } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, borderRadius as br } from '../../styles/theme';

// ---------- Types ----------

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// ---------- Size config ----------

const SIZE_CONFIG = {
  sm: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: br.sm,
    fontSize: 12 as number,
    fontWeight: '600' as const,
    iconSize: 14,
  },
  md: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: br.md,
    fontSize: 14 as number,
    fontWeight: '600' as const,
    iconSize: 18,
  },
  lg: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: br.lg,
    fontSize: 16 as number,
    fontWeight: '700' as const,
    iconSize: 22,
  },
} as const;

// ---------- Variant config ----------

const VARIANT_CONFIG = {
  primary: {
    backgroundColor: colors.primary[600],
    borderWidth: 0,
    borderColor: 'transparent',
    textColor: colors.neutral[50],
    pressedBg: colors.primary[700],
    pressedScale: 0.97,
    shadow: {
      shadowColor: colors.primary[600],
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    rippleColor: 'rgba(255,255,255,0.2)',
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    textColor: colors.neutral[700],
    pressedBg: colors.neutral[200],
    pressedScale: 0.98,
    shadow: null,
    rippleColor: 'rgba(0,0,0,0.08)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary[400],
    textColor: colors.primary[600],
    pressedBg: colors.primary[50],
    pressedScale: 0.98,
    shadow: null,
    rippleColor: 'rgba(14,165,233,0.1)',
  },
  text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    textColor: colors.primary[600],
    pressedBg: colors.primary[50],
    pressedScale: 1.0,
    shadow: null,
    rippleColor: 'rgba(14,165,233,0.1)',
  },
  danger: {
    backgroundColor: colors.error[600],
    borderWidth: 0,
    borderColor: 'transparent',
    textColor: colors.neutral[50],
    pressedBg: colors.error[700],
    pressedScale: 0.97,
    shadow: {
      shadowColor: colors.error[600],
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    rippleColor: 'rgba(255,255,255,0.2)',
  },
} as const;

// ---------- Component ----------

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  labelStyle,
  icon,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_CONFIG[variant];
  const derivedLabel = accessibilityLabel || (typeof children === 'string' ? children : undefined);

  const isTextVariant = variant === 'text';
  const isFilled = variant === 'primary' || variant === 'danger';

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => { if (mounted) setReduceMotion(!!v); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setReduceMotion(!!v));
    return () => { mounted = false; sub?.remove?.(); };
  }, []);

  const disabledFillBg =
    variant === 'primary' ? colors.primary[200]
    : variant === 'danger' ? colors.error[200]
    : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        // Base
        {
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          flexDirection: 'row' as const,
        },
        // Size
        {
          paddingHorizontal: isTextVariant ? 8 : sizeConfig.paddingHorizontal,
          paddingVertical: isTextVariant ? 4 : sizeConfig.paddingVertical,
          minHeight: isTextVariant ? undefined : sizeConfig.minHeight,
          borderRadius: sizeConfig.borderRadius,
        },
        // Variant
        {
          backgroundColor: variantConfig.backgroundColor,
          borderWidth: variantConfig.borderWidth,
          borderColor: variantConfig.borderColor,
        },
        // Shadow (primary / danger only)
        variantConfig.shadow,
        // Full width
        fullWidth && styles.fullWidth,
        // Pressed state
        pressed && !disabled && {
          backgroundColor: variantConfig.pressedBg,
          ...(reduceMotion ? null : { transform: [{ scale: variantConfig.pressedScale }] }),
        },
        // Disabled — filled variants get a tinted fill instead of opacity
        disabled && (disabledFillBg
          ? { backgroundColor: disabledFillBg, shadowOpacity: 0, elevation: 0 }
          : styles.disabled),
        // User overrides
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={derivedLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      hitSlop={size === 'sm' ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined}
      android_ripple={
        isFilled
          ? { color: variantConfig.rippleColor, borderless: false }
          : undefined
      }
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFilled ? colors.neutral[50] : colors.primary[600]}
          accessibilityElementsHidden={true}
        />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={sizeConfig.iconSize}
              color={variantConfig.textColor}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              {
                fontSize: sizeConfig.fontSize,
                fontWeight: sizeConfig.fontWeight,
                color: variantConfig.textColor,
                textAlign: 'center',
              },
              labelStyle,
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
};

// ---------- Static styles ----------

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
    alignSelf: 'center',
  },
});
