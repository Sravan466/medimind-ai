import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Card, 
  Checkbox, 
  List, 
  Divider,
  ProgressBar,
  Chip 
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../styles/theme';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useAuthContext } from '../../contexts/AuthContext';
import { accountDeletionService } from '../../services/accountDeletion';
import { colors } from '../../styles/theme';

interface AccountDeletionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface DeletionSummary {
  medicines: number;
  medicineLogs: number;
  chatHistory: number;
  hasProfile: boolean;
  totalItems: number;
}

export const AccountDeletionForm: React.FC<AccountDeletionFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { settings } = useSettingsContext();
  const theme = useAppTheme(settings?.theme || 'light');
  const { user, signOut } = useAuthContext();
  
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [exportData, setExportData] = useState(false);
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [summary, setSummary] = useState<DeletionSummary | null>(null);
  const [step, setStep] = useState<'summary' | 'confirm' | 'deleting'>('summary');

  const CONFIRM_TEXT = 'DELETE MY ACCOUNT';

  useEffect(() => {
    loadDeletionSummary();
  }, []);

  const loadDeletionSummary = async () => {
    if (!user) return;
    
    try {
      const summaryData = await accountDeletionService.getAccountDeletionSummary(user.id);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading deletion summary:', error);
    }
  };

  const validateForm = (): string | null => {
    if (!password.trim()) {
      return 'Password is required to confirm account deletion';
    }
    
    if (confirmText !== CONFIRM_TEXT) {
      return `Please type "${CONFIRM_TEXT}" to confirm`;
    }
    
    if (!confirmDeletion) {
      return 'Please confirm that you understand this action cannot be undone';
    }
    
    return null;
  };

  const handleExportData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const exportedData = await accountDeletionService.exportDataBeforeDeletion(user.id);
      
      Alert.alert(
        'Data Exported',
        'Your data has been exported successfully. In a production app, this would be saved to your device or shared.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data. You can still proceed with deletion.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    // Final confirmation
    Alert.alert(
      'Final Confirmation',
      'This is your last chance to cancel. Are you absolutely sure you want to delete your account and all data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: proceedWithDeletion,
        },
      ]
    );
  };

  const proceedWithDeletion = async () => {
    if (!user) return;
    
    setStep('deleting');
    setLoading(true);

    try {
      // Export data if requested
      if (exportData) {
        await handleExportData();
      }

      // Delete account
      const result = await accountDeletionService.deleteAccount(user.id, password);

      if (result.success) {
        Alert.alert(
          'Account Deleted',
          'Your account and all associated data have been permanently deleted.',
          [
            {
              text: 'OK',
              onPress: () => {
                signOut(); // Sign out the user
                onSuccess?.();
              },
            },
          ]
        );
      } else {
        throw new Error(result.error || 'Failed to delete account');
      }

    } catch (error: any) {
      console.error('Account deletion error:', error);
      Alert.alert(
        'Deletion Failed',
        error.message || 'Failed to delete account. Please try again or contact support.'
      );
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setConfirmText('');
    setConfirmDeletion(false);
    setExportData(false);
    setStep('summary');
    onCancel?.();
  };

  if (step === 'deleting') {
    return (
      <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.deletingContainer}>
          <Text variant="titleLarge" style={[styles.deletingTitle, { color: theme.colors.error }]}>
            Deleting Account...
          </Text>
          <ProgressBar indeterminate style={styles.progressBar} />
          <Text variant="bodyMedium" style={[styles.deletingText, { color: theme.colors.onSurfaceVariant }]}>
            Please wait while we permanently delete your account and all associated data.
            This process cannot be interrupted.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (step === 'summary') {
    return (
      <ScrollView>
        <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.error }]}>
              Delete Account
            </Text>
            
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              This action will permanently delete your account and all associated data.
            </Text>

            {summary && (
              <View style={styles.summaryContainer}>
                <Text variant="titleSmall" style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
                  Data to be deleted:
                </Text>
                
                <List.Section>
                  <List.Item
                    title="Medicines"
                    description={`${summary.medicines} entries`}
                    left={(props) => <List.Icon {...props} icon="pill" />}
                    right={() => <Chip textStyle={styles.chipText}>{summary.medicines}</Chip>}
                  />
                  <List.Item
                    title="Medicine Logs"
                    description={`${summary.medicineLogs} entries`}
                    left={(props) => <List.Icon {...props} icon="history" />}
                    right={() => <Chip textStyle={styles.chipText}>{summary.medicineLogs}</Chip>}
                  />
                  <List.Item
                    title="Chat History"
                    description={`${summary.chatHistory} conversation`}
                    left={(props) => <List.Icon {...props} icon="chat" />}
                    right={() => <Chip textStyle={styles.chipText}>{summary.chatHistory}</Chip>}
                  />
                  <List.Item
                    title="Profile Data"
                    description={summary.hasProfile ? 'Personal information' : 'No profile data'}
                    left={(props) => <List.Icon {...props} icon="account" />}
                    right={() => <Chip textStyle={styles.chipText}>{summary.hasProfile ? '1' : '0'}</Chip>}
                  />
                </List.Section>

                <View style={[styles.totalContainer, { backgroundColor: theme.colors.errorContainer }]}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onErrorContainer }}>
                    Total: {summary.totalItems + (summary.hasProfile ? 1 : 0)} items will be permanently deleted
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.button}
              >
                Cancel
              </Button>
              
              <Button
                mode="contained"
                onPress={() => setStep('confirm')}
                style={styles.button}
                buttonColor={theme.colors.error}
              >
                Continue
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.error }]}>
            Confirm Account Deletion
          </Text>
          
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Please confirm your password and type the confirmation text to proceed.
          </Text>

          <View style={styles.form}>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={exportData ? 'checked' : 'unchecked'}
                onPress={() => setExportData(!exportData)}
              />
              <Text 
                variant="bodyMedium" 
                style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}
                onPress={() => setExportData(!exportData)}
              >
                Export my data before deletion
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
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
              disabled={loading}
            />

            <TextInput
              mode="outlined"
              label={`Type "${CONFIRM_TEXT}" to confirm`}
              value={confirmText}
              onChangeText={setConfirmText}
              style={styles.input}
              disabled={loading}
              error={confirmText.length > 0 && confirmText !== CONFIRM_TEXT}
            />

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={confirmDeletion ? 'checked' : 'unchecked'}
                onPress={() => setConfirmDeletion(!confirmDeletion)}
              />
              <Text 
                variant="bodySmall" 
                style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}
                onPress={() => setConfirmDeletion(!confirmDeletion)}
              >
                I understand that this action cannot be undone and all my data will be permanently deleted
              </Text>
            </View>

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
                onPress={handleDeleteAccount}
                style={styles.button}
                loading={loading}
                disabled={loading}
                buttonColor={theme.colors.error}
              >
                Delete Account
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
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
  summaryContainer: {
    marginBottom: 24,
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  totalContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  form: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 8,
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
  deletingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  deletingTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    marginBottom: 16,
  },
  deletingText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
