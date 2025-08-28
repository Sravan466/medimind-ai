import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
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
          <TextInput
            mode="outlined"
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            right={
              <TextInput.Icon
                icon={() => (
                  <MaterialCommunityIcons
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.neutral[600]}
                  />
                )}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            }
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            mode="outlined"
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            right={
              <TextInput.Icon
                icon={() => (
                  <MaterialCommunityIcons
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.neutral[600]}
                  />
                )}
                onPress={() => setShowNewPassword(!showNewPassword)}
              />
            }
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            mode="outlined"
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
            disabled={loading}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.button}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              mode="contained"
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
