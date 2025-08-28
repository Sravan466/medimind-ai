// Forgot Password Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, HelperText, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { VALIDATION_RULES } from '../../src/utils/constants';
import { colors } from '../../src/styles/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword, loading, error, clearError } = useAuthContext();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!VALIDATION_RULES.EMAIL.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    const result = await resetPassword(email);
    
    if (result.success) {
      setSuccess(true);
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/login');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError('');
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Surface style={styles.surface} elevation={2}>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.title}>
                Check Your Email
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                We've sent a password reset link to:
              </Text>
              <Text variant="bodyLarge" style={styles.email}>
                {email}
              </Text>
            </View>

            <View style={styles.content}>
              <Text variant="bodyMedium" style={styles.instructions}>
                Please check your email and click the link to reset your password. 
                If you don't see the email, check your spam folder.
              </Text>
            </View>

            <Button
              variant="primary"
              onPress={handleBackToLogin}
              fullWidth
              style={styles.backButton}
              labelStyle={styles.backButtonText}
            >
              Back to Login
            </Button>
          </Surface>
        </ScrollView>
      </View>
    );
  }

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
              Reset Password
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              error={!!emailError}
              disabled={loading}
            />
            {emailError ? (
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>
            ) : null}

            {/* Error Message */}
            {error ? (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            ) : null}

            {/* Reset Password Button */}
            <Button
              variant="primary"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              fullWidth
              style={styles.resetButton}
              labelStyle={styles.resetButtonText}
            >
              Send Reset Link
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="text"
              onPress={handleBackToLogin}
              disabled={loading}
              style={styles.backToLoginButton}
              labelStyle={styles.backButtonText}
            >
              Back to Login
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
    marginBottom: 8,
  },
  email: {
    color: colors.primary[600],
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  resetButton: {
    marginTop: 16,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    marginBottom: 24,
  },
  instructions: {
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    borderTopWidth: 2,
    borderTopColor: colors.neutral[900],
    paddingTop: 24,
  },
  backButton: {
    marginTop: 16,
  },
  backToLoginButton: {
    alignSelf: 'center',
  },
});
