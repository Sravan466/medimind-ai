// Login Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, HelperText, TextInput, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../../src/utils/constants';
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

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
    };

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

    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    const result = await signIn(formData.email, formData.password);
    
    if (result.success) {
      // Navigation will be handled by the auth state change
      router.replace('/(tabs)');
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/register');
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
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
              Welcome Back
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Sign in to your MediMind account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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

            {/* Error Message */}
            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : null}

            {/* Sign In Button */}
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

            {/* Forgot Password Link */}
            <Button
              variant="text"
              onPress={handleForgotPassword}
              disabled={loading}
              style={styles.forgotPasswordButton}
            >
              Forgot Password?
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <Button
              variant="text"
              onPress={handleSignUp}
              disabled={loading}
              style={styles.signUpButton}
            >
              Sign Up
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
  signInButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  forgotPasswordButton: {
    marginTop: 8,
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
  signUpButton: {
    marginLeft: 4,
  },
});
