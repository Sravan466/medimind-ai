// Register Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, HelperText, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../../src/utils/constants';
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

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const validateForm = () => {
    const errors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!VALIDATION_RULES.EMAIL.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return !errors.fullName && !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    const result = await signUp(formData.email, formData.password, formData.fullName.trim());
    
    if (result.success) {
      // Navigation will be handled by the auth state change
      router.replace('/(tabs)');
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Surface style={styles.surface} elevation={2}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Create Account
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Join MediMind to manage your medications
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <TextInput
              mode="outlined"
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) => updateFormData('fullName', text)}
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
              error={!!formErrors.fullName}
              disabled={loading}
            />
            {formErrors.fullName ? (
              <HelperText type="error" visible={!!formErrors.fullName}>
                {formErrors.fullName}
              </HelperText>
            ) : null}

                        {/* Email Input */}
            <TextInput
              mode="outlined"
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              error={!!formErrors.email}
              disabled={loading}
            />
            {formErrors.email ? (
              <HelperText type="error" visible={!!formErrors.email}>
                {formErrors.email}
              </HelperText>
            ) : null}

            {/* Password Input */}
            <TextInput
              mode="outlined"
              label="Password"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.neutral[600]}
                    />
                  )}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
              error={!!formErrors.password}
              disabled={loading}
            />
            {formErrors.password ? (
              <HelperText type="error" visible={!!formErrors.password}>
                {formErrors.password}
              </HelperText>
            ) : null}

            {/* Confirm Password Input */}
            <TextInput
              mode="outlined"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              right={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={colors.neutral[600]}
                    />
                  )}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={styles.input}
              error={!!formErrors.confirmPassword}
              disabled={loading}
            />
            {formErrors.confirmPassword ? (
              <HelperText type="error" visible={!!formErrors.confirmPassword}>
                {formErrors.confirmPassword}
              </HelperText>
            ) : null}

            {/* Error Message */}
            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : null}

            {/* Sign Up Button */}
            <Button
              variant="primary"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              fullWidth
              style={styles.signUpButton}
              labelStyle={styles.signUpButtonText}
            >
              Create Account
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <Button
              variant="text"
              onPress={handleSignIn}
              disabled={loading}
              style={styles.signInButton}
            >
              Sign In
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  surface: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: 'white',
  },
  input: {
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: colors.primary[700],
    marginBottom: 8,
  },
  subtitle: {
    color: colors.neutral[600],
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  signUpButton: {
    marginTop: 16,
  },
  signUpButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.neutral[900],
    paddingTop: 24,
  },
  footerText: {
    color: colors.neutral[600],
  },
  signInButton: {
    marginLeft: 4,
  },
});
