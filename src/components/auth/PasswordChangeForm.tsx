import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Pressable } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../styles/theme';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { colors } from '../../styles/theme';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { settings } = useSettingsContext();
  const theme = useAppTheme(settings?.theme || 'light');
  const { user, updatePassword } = useAuthContext();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): string | null => {
    if (!currentPassword.trim()) {
      return 'Current password is required';
    }
    
    if (!newPassword.trim()) {
      return 'New password is required';
    }
    
    if (newPassword.length < 6) {
      return 'New password must be at least 6 characters';
    }
    
    if (newPassword !== confirmPassword) {
      return 'New passwords do not match';
    }
    
    if (currentPassword === newPassword) {
      return 'New password must be different from current password';
    }
    
    return null;
  };

  const handlePasswordChange = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setLoading(true);
    
    try {
      // Update the password using the auth context
      const { success, error } = await updatePassword(newPassword);

      if (!success) {
        throw new Error(error || 'Failed to update password');
      }

      Alert.alert(
        'Success',
        'Your password has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              onSuccess?.();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Password change error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onCancel?.();
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          Change Password
        </Text>
        
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Enter your current password and choose a new one.
        </Text>

        <View style={styles.form}>
          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            disabled={loading}
            autoCapitalize="none"
            autoCorrect={false}
            right={
              <Pressable
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                <MaterialCommunityIcons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.neutral[600]}
                />
              </Pressable>
            }
          />

          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            disabled={loading}
            autoCapitalize="none"
            autoCorrect={false}
            right={
              <Pressable
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                <MaterialCommunityIcons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.neutral[600]}
                />
              </Pressable>
            }
          />

          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            disabled={loading}
            autoCapitalize="none"
            autoCorrect={false}
            right={
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.neutral[600]}
                />
              </Pressable>
            }
          />

          <View style={styles.buttonContainer}>
            <Button
              variant="secondary"
              onPress={handleCancel}
              style={styles.button}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onPress={handlePasswordChange}
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Update Password
            </Button>
          </View>
        </View>

        <View style={[styles.securityTips, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="labelMedium" style={[styles.securityTitle, { color: theme.colors.onSurfaceVariant }]}>
            Password Security Tips:
          </Text>
          <Text variant="bodySmall" style={[styles.securityTip, { color: theme.colors.onSurfaceVariant }]}>
            • Use at least 8 characters
          </Text>
          <Text variant="bodySmall" style={[styles.securityTip, { color: theme.colors.onSurfaceVariant }]}>
            • Include uppercase and lowercase letters
          </Text>
          <Text variant="bodySmall" style={[styles.securityTip, { color: theme.colors.onSurfaceVariant }]}>
            • Include numbers and special characters
          </Text>
          <Text variant="bodySmall" style={[styles.securityTip, { color: theme.colors.onSurfaceVariant }]}>
            • Avoid common words or personal information
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  form: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  securityTips: {
    padding: 12,
    borderRadius: 8,
  },
  securityTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  securityTip: {
    marginBottom: 4,
    paddingLeft: 8,
  },
});
