// Profile Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, Card, Avatar, IconButton, Switch, Divider, ActivityIndicator, Portal, Dialog, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { useSettingsContext } from '../../src/contexts/SettingsContext';
import { userService } from '../../src/services/supabase';
import { colors } from '../../src/styles/theme';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { PasswordChangeForm } from '../../src/components/auth/PasswordChangeForm';
import { AccountDeletionForm } from '../../src/components/auth/AccountDeletionForm';
import { useHealthTips } from '../../src/hooks/useHealthTips';

export default function ProfileScreen() {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuthContext();
  const { settings, updateSetting, updateNotificationSetting, updateNotificationCategorySetting, resetSettings } = useSettingsContext();
  const { scheduleDailyTips, cancelDailyTips, isScheduled } = useHealthTips();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const parseDob = (dob: string): Date => {
    const d = dob ? new Date(dob) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  };
  const formatDob = (d: Date): string => d.toISOString().slice(0, 10);
  
  const theme = useTheme();

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    date_of_birth: profile?.date_of_birth || '',
    emergency_contact: profile?.emergency_contact || '',
    emergency_phone: profile?.emergency_phone || '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        date_of_birth: profile.date_of_birth || '',
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await userService.updateUserProfile(user.id, profileData);
      
      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        return;
      }
      
      // Update local user context
      await updateProfile(profileData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      date_of_birth: profile?.date_of_birth || '',
      emergency_contact: profile?.emergency_contact || '',
      emergency_phone: profile?.emergency_phone || '',
    });
    setEditing(false);
  };

  const handleSignOut = () => setShowSignOutDialog(true);

  const confirmSignOut = () => {
    setShowSignOutDialog(false);
    signOut();
  };

  const handleResetSettings = () => setShowResetDialog(true);

  const confirmResetSettings = () => {
    setShowResetDialog(false);
    resetSettings();
  };

  const handleToggleHealthTips = async (value: boolean) => {
    try {
      await updateNotificationCategorySetting('health_tips', value);
      
      if (value) {
        // Enable health tips and schedule random notifications
        const success = await scheduleDailyTips();
        if (success) {
          Alert.alert(
            'Health Tips Enabled',
            'Daily health tips are now enabled! You will receive 2-3 notifications at random times between 5 AM and 12 AM daily.'
          );
        } else {
          Alert.alert('Health Tips Enabled', 'Daily health tips are now enabled, but scheduling failed. Please try again later.');
        }
      } else {
        // Disable health tips
        await cancelDailyTips();
        Alert.alert('Health Tips Disabled', 'Daily health tips have been disabled.');
      }
    } catch (error) {
      console.error('Error toggling health tips:', error);
      Alert.alert('Error', 'Failed to update health tips settings.');
    }
  };

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Profile & Settings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your account and preferences
            </Text>
          </View>
          <View style={styles.headerRight}>
            {editing ? (
              <View style={styles.editActions}>
                <IconButton
                  icon="check"
                  size={24}
                  onPress={handleSaveProfile}
                  disabled={loading}
                  iconColor={colors.success[500]}
                  style={styles.actionButton}
                  accessibilityLabel="Save profile changes"
                />
                <IconButton
                  icon="close"
                  size={24}
                  onPress={handleCancelEdit}
                  disabled={loading}
                  iconColor={colors.error[500]}
                  style={styles.actionButton}
                  accessibilityLabel="Cancel editing"
                />
              </View>
            ) : (
              <IconButton
                icon="pencil"
                size={24}
                onPress={() => setEditing(true)}
                iconColor={colors.primary[500]}
                style={styles.actionButton}
                accessibilityLabel="Edit profile"
              />
            )}
          </View>
        </View>
      </View>
        {/* Profile Section */}
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={90}
                label={profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
                labelStyle={styles.profileAvatarLabel}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
                  {profile?.full_name || 'User'}
                </Text>
                <Text style={[styles.profileEmail, { color: theme.colors.onSurfaceVariant }]}>{user?.email}</Text>
                <Text style={[styles.profileMemberSince, { color: theme.colors.onSurfaceVariant }]}>
                  Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary[50] }]}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Personal Information</Text>
            </View>
            
            <View style={styles.formFields}>
              <Input
                label="Full Name"
                value={profileData.full_name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, full_name: text }))}
                disabled={!editing}
                style={styles.input}
              />
              
              <Input
                label="Phone Number"
                value={profileData.phone_number}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone_number: text }))}
                disabled={!editing}
                style={styles.input}
                keyboardType="phone-pad"
              />
              
              <Pressable
                onPress={() => editing && setShowDobPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Date of birth"
                accessibilityHint={editing ? 'Opens a date picker' : undefined}
              >
                <View pointerEvents="none">
                  <Input
                    label="Date of Birth"
                    value={profileData.date_of_birth}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, date_of_birth: text }))}
                    disabled={true}
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </Pressable>
              {showDobPicker && (
                <DateTimePicker
                  value={parseDob(profileData.date_of_birth)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_event, selected) => {
                    setShowDobPicker(Platform.OS === 'ios');
                    if (selected) {
                      setProfileData(prev => ({ ...prev, date_of_birth: formatDob(selected) }));
                    }
                  }}
                />
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Emergency Contacts */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.warning[50] }]}>
                <MaterialCommunityIcons 
                  name="phone-alert" 
                  size={20} 
                  color={colors.warning[600]} 
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Emergency Contact</Text>
            </View>
            
            <View style={styles.formFields}>
              <Input
                label="Emergency Contact Name"
                value={profileData.emergency_contact}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, emergency_contact: text }))}
                disabled={!editing}
                style={styles.input}
              />
              
              <Input
                label="Emergency Contact Phone"
                value={profileData.emergency_phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, emergency_phone: text }))}
                disabled={!editing}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.info[50] }]}>
                <MaterialCommunityIcons 
                  name="cog" 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>App Settings</Text>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Medicine Reminders</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Receive notifications for medicine reminders
                </Text>
              </View>
              <Switch
                value={settings?.notifications?.sound_enabled || false}
                onValueChange={(value) => updateNotificationSetting('sound_enabled', value)}
                color={theme.colors.primary}
                accessibilityLabel="Medicine Reminders"
                accessibilityRole="switch"
              />
            </View>
            
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Vibration</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Vibrate for notifications
                </Text>
              </View>
              <Switch
                value={settings?.notifications?.vibration_enabled || false}
                onValueChange={(value) => updateNotificationSetting('vibration_enabled', value)}
                color={theme.colors.primary}
                accessibilityLabel="Vibration"
                accessibilityRole="switch"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Health Tips Settings */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.warning[50] }]}>
                <MaterialCommunityIcons 
                  name="lightbulb" 
                  size={20} 
                  color={colors.warning[600]} 
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Health Tips</Text>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Daily Health Tips</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                  Receive 2-3 daily health tips at random times between 5 AM and 12 AM
                </Text>
              </View>
              <Switch
                value={settings?.notifications?.categories?.health_tips || false}
                onValueChange={handleToggleHealthTips}
                color={theme.colors.primary}
                accessibilityLabel="Daily Health Tips"
                accessibilityRole="switch"
              />
            </View>
            
            {settings?.notifications?.categories?.health_tips && isScheduled && (
              <>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Status</Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                      Daily health tips are scheduled and will be sent at random times
                    </Text>
                  </View>
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={24} 
                    color={colors.success[500]} 
                  />
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Account Actions */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.error[50] }]}>
                <MaterialCommunityIcons 
                  name="shield-account" 
                  size={20} 
                  color={colors.error[600]} 
                />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Account Actions</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <Button
                variant="outline"
                onPress={() => setShowPasswordForm(true)}
                style={styles.profileActionButton}
                icon="lock-outline"
              >
                Change Password
              </Button>
              
              <Button
                variant="outline"
                onPress={handleResetSettings}
                style={styles.profileActionButton}
                icon="refresh"
              >
                Reset Settings
              </Button>
              
              <Button
                variant="outline"
                onPress={handleSignOut}
                style={styles.profileActionButton}
                icon="logout"
              >
                Sign Out
              </Button>
              
              <Button
                variant="danger"
                onPress={() => setShowDeleteForm(true)}
                style={styles.profileActionButton}
                icon="delete-outline"
              >
                Delete Account
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modals */}
      {showPasswordForm && (
        <PasswordChangeForm
          onSuccess={() => setShowPasswordForm(false)}
          onCancel={() => setShowPasswordForm(false)}
        />
      )}
      
      {showDeleteForm && (
        <AccountDeletionForm
          onSuccess={() => setShowDeleteForm(false)}
          onCancel={() => setShowDeleteForm(false)}
        />
      )}

      {/* Sign Out Confirmation */}
      <Portal>
        <Dialog visible={showSignOutDialog} onDismiss={() => setShowSignOutDialog(false)} style={styles.dialog}>
          <Dialog.Icon icon="logout" color={colors.error[600]} />
          <Dialog.Title style={styles.dialogTitle}>Sign Out</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogBody}>Are you sure you want to sign out?</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button variant="outline" size="sm" onPress={() => setShowSignOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onPress={confirmSignOut}>
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Reset Settings Confirmation */}
      <Portal>
        <Dialog visible={showResetDialog} onDismiss={() => setShowResetDialog(false)} style={styles.dialog}>
          <Dialog.Icon icon="refresh" color={colors.warning[600]} />
          <Dialog.Title style={styles.dialogTitle}>Reset Settings</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogBody}>Are you sure you want to reset all settings to default?</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button variant="outline" size="sm" onPress={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onPress={confirmResetSettings}>
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  loadingText: {
    marginTop: 16,
    color: colors.neutral[600],
    fontSize: 16,
  },
  header: {
    backgroundColor: colors.neutral[50],
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
  profileActionButton: {
    justifyContent: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  profileContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: 20,
    elevation: 2,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileAvatarLabel: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  profileMemberSince: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  formFields: {
    gap: 20,
  },
  input: {
    backgroundColor: colors.neutral[50],
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  divider: {
    marginVertical: 12,
  },
  actionButtons: {
    gap: 16,
  },
  deleteButton: {
    borderColor: colors.error[300],
  },
  deleteActionButton: {},
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  dialogBody: {
    textAlign: 'center',
    fontSize: 15,
    color: colors.neutral[600],
    lineHeight: 22,
  },
  dialogActions: {
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
});
