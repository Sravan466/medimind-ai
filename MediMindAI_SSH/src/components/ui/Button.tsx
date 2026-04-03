import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles/theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  labelStyle,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minHeight: 48,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary[600],
          elevation: 2,
          shadowColor: colors.primary[500],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.neutral[100],
          borderWidth: 1,
          borderColor: colors.neutral[300],
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary[500],
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 12,
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          paddingVertical: 0,
        };
      default:
        return baseStyle;
    }
  };

  const getLabelStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: colors.neutral[50],
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: colors.neutral[700],
        };
      case 'outline':
        return {
          ...baseStyle,
          color: colors.primary[500],
          fontSize: 14,
          fontWeight: '600',
        };
      case 'text':
        return {
          ...baseStyle,
          color: colors.primary[600],
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.neutral[50] : colors.primary[600]} 
        />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons 
              name={icon}
              size={18}
              color={variant === 'primary' ? colors.neutral[50] : colors.primary[600]}
              style={styles.icon}
            />
          )}
          <Text style={[getLabelStyle(), labelStyle]}>
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Base button styles
  },
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
