// Register Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { AuthScaffold } from '../../src/components/auth/AuthScaffold';
import { PasswordStrength } from '../../src/components/auth/PasswordStrength';
import { VALIDATION_RULES } from '../../src/utils/constants';
import { colors } from '../../src/styles/theme';

export default function RegisterScreen() {
  const { signUp, loading, error, clearError } = useAuthContext();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => { clearError(); }, []);

  const validateForm = () => {
    const errors = { fullName: '', email: '', password: '', confirmPassword: '' };
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    else if (formData.fullName.trim().length < 2) errors.fullName = 'Full name must be at least 2 characters';
    if (!formData.email) errors.email = 'Email is required';
    else if (!VALIDATION_RULES.EMAIL.test(formData.email)) errors.email = 'Please enter a valid email address';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) errors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`;
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFormErrors(errors);
    return !errors.fullName && !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    const result = await signUp(formData.email, formData.password, formData.fullName.trim());
    if (result.success) router.replace('/(tabs)');
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const eyeToggle = (visible: boolean, toggle: () => void) => (
    <Pressable onPress={toggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
      <MaterialCommunityIcons name={visible ? 'eye-off' : 'eye'} size={22} color={colors.neutral[600]} />
    </Pressable>
  );

  return (
    <AuthScaffold
      title="Create Account"
      subtitle="Join MediMind to manage your medications"
      errorMessage={error || undefined}
      onDismissError={clearError}
      footer={
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            Already have an account?{' '}
          </Text>
          <Button variant="text" onPress={() => router.push('/(auth)/login')} disabled={loading} accessibilityHint="Navigate to sign in">
            Sign In
          </Button>
        </View>
      }
    >
      <Input
        label="Full Name"
        value={formData.fullName}
        onChangeText={(t) => updateFormData('fullName', t)}
        autoCapitalize="words"
        autoCorrect={false}
        error={formErrors.fullName || undefined}
        disabled={loading}
      />

      <Input
        label="Email"
        value={formData.email}
        onChangeText={(t) => updateFormData('email', t)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={formErrors.email || undefined}
        disabled={loading}
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
        right={eyeToggle(showPassword, () => setShowPassword(!showPassword))}
      />
      <PasswordStrength password={formData.password} />

      <Input
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(t) => updateFormData('confirmPassword', t)}
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
        autoCorrect={false}
        error={formErrors.confirmPassword || undefined}
        disabled={loading}
        right={eyeToggle(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
      />

      <Button
        variant="primary"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading}
        fullWidth
        style={styles.createButton}
      >
        Create Account
      </Button>

      <Text style={styles.tos}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  createButton: {
    marginTop: 16,
  },
  tos: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
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
