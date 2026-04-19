// Forgot Password Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { AuthScaffold } from '../../src/components/auth/AuthScaffold';
import { VALIDATION_RULES } from '../../src/utils/constants';
import { colors } from '../../src/styles/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword, loading, error, clearError } = useAuthContext();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { clearError(); }, []);

  const validateEmail = () => {
    if (!email) { setEmailError('Email is required'); return false; }
    if (!VALIDATION_RULES.EMAIL.test(email)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    const result = await resetPassword(email);
    if (result.success) setSuccess(true);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  if (success) {
    return (
      <AuthScaffold title="Check Your Email" subtitle="We sent a password reset link">
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check" size={36} color={colors.primary[600]} />
          </View>
          <Text style={styles.successEmail}>{email}</Text>
          <Text style={styles.successInstructions}>
            Please check your email and click the link to reset your password.
            If you don't see it, check your spam folder.
          </Text>
        </View>
        <Button
          variant="text"
          onPress={handleResetPassword}
          disabled={loading}
          loading={loading}
          style={styles.resendButton}
        >
          Resend Link
        </Button>
        <Button
          variant="primary"
          onPress={() => router.push('/(auth)/login')}
          fullWidth
          style={styles.backButton}
        >
          Back to Sign In
        </Button>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
      logo={require('../../assets/icon.png')}
      errorMessage={error || undefined}
      onDismissError={clearError}
      footer={
        <View style={styles.footer}>
          <Button
            variant="text"
            onPress={() => router.push('/(auth)/login')}
            disabled={loading}
            accessibilityHint="Navigate back to sign in"
          >
            Back to Sign In
          </Button>
        </View>
      }
    >
      <Input
        label="Email"
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={emailError || undefined}
        disabled={loading}
        accessibilityLabel="Email address"
      />

      <Button
        variant="primary"
        onPress={handleResetPassword}
        loading={loading}
        disabled={loading}
        fullWidth
        style={styles.resetButton}
      >
        Send Reset Link
      </Button>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  resetButton: {
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successEmail: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 16,
  },
  successInstructions: {
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },
  resendButton: {
    marginBottom: 12,
  },
  backButton: {
    marginTop: 4,
  },
  footer: {
    paddingTop: 24,
    alignItems: 'center',
  },
});
