import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../styles/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string | boolean;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  labelStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  right?: React.ReactNode;
  fullWidth?: boolean;
  variant?: string;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  disabled = false,
  style,
  labelStyle,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  right,
  fullWidth = false,
  variant,
}) => {
  const getInputStyle = (): any => {
    const baseStyle: any = {
      borderWidth: 1,
      borderColor: error ? colors.error[500] : colors.neutral[300],
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: colors.neutral[50],
      color: colors.neutral[900],
      minHeight: 48,
    };

    if (multiline) {
      baseStyle.minHeight = numberOfLines * 24 + 24;
      baseStyle.textAlignVertical = 'top';
    }

    return baseStyle;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      <View style={fullWidth ? styles.fullWidthContainer : undefined}>
        <TextInput
          style={[getInputStyle(), style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[500]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {right && (
          <View style={styles.rightContainer}>
            {right}
          </View>
        )}
      </View>
      {error && (
        <Text style={styles.error}>
          {typeof error === 'string' ? error : 'This field is required'}
        </Text>
      )}
    </View>
  );
};

// Add Icon component to Input
const InputIcon: React.FC<{ icon: string; onPress?: () => void }> = ({ icon, onPress }) => {
  return (
    <Text style={styles.icon} onPress={onPress}>
      {icon}
    </Text>
  );
};

// Export Input with Icon property
export const Input = Object.assign(InputComponent, {
  Icon: InputIcon,
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  error: {
    fontSize: 12,
    color: colors.error[500],
    marginTop: 4,
    marginLeft: 4,
  },
  icon: {
    fontSize: 20,
    color: colors.neutral[500],
    marginRight: 8,
  },
  fullWidthContainer: {
    width: '100%',
  },
  rightContainer: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
});
