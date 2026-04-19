// Login Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { AuthScaffold } from '../../src/components/auth/AuthScaffold';
import { VALIDATION_RULES } from '../../src/utils/constants';
import { colors } from '../../src/styles/theme';

export default function LoginScreen() {
  const { signIn, loading, error, clearError } = useAuthContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    clearError();
  }, []);

  const validateForm = () => {
    const errors = { email: '', password: '' };
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!VALIDATION_RULES.EMAIL.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`;
    }
    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    const result = await signIn(formData.email, formData.password);
    if (result.success) {
      router.replace('/(tabs)');
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AuthScaffold
      title="Welcome Back"
      subtitle="Sign in to your MediMind account"
      errorMessage={error || undefined}
      onDismissError={clearError}
      footer={
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            Don't have an account?{' '}
          </Text>
          <Button
            variant="text"
            onPress={() => router.push('/(auth)/register')}
            disabled={loading}
            accessibilityHint="Navigate to account registration"
          >
            Sign Up
          </Button>
        </View>
      }
    >
      <Input
        label="Email"
        value={formData.email}
        onChangeText={(t) => updateFormData('email', t)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={formErrors.email || undefined}
        disabled={loading}
        accessibilityLabel="Email address"
      />

      <Input
        label="Password"
        value={formData.password}
        onChangeText={(t) => updateFormData('password', t)}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        error={formErrors.password || undefined}
        disabled={loading}
        accessibilityLabel="Password"
        right={
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={colors.neutral[600]}
            />
          </Pressable>
        }
      />

      <Button
        variant="primary"
        onPress={handleSignIn}
        loading={loading}
        disabled={loading}
        fullWidth
        style={styles.signInButton}
      >
        Sign In
      </Button>

      <Button
        variant="text"
        onPress={() => router.push('/(auth)/forgot-password')}
        disabled={loading}
        style={styles.forgotButton}
        accessibilityHint="Navigate to password reset"
      >
        Forgot Password?
      </Button>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  signInButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  forgotButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    color: colors.neutral[600],
  },
});
