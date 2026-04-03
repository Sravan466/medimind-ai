// Migration utility to clean up old notification system and initialize the fixed one

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fixedNotificationService } from '../services/notifications_fixed';

export class NotificationMigration {
  static async migrateToFixedSystem(): Promise<void> {
    try {
      console.log('[MIGRATION] Starting notification system migration...');
      
      // Step 1: Cancel ALL existing notifications to start fresh
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[MIGRATION] Cancelled all existing notifications');
      
      // Step 2: Clear old notification storage
      await AsyncStorage.removeItem('scheduled_followups');
      await AsyncStorage.removeItem('scheduled_notifications');
      await AsyncStorage.removeItem('scheduled_notifications_v2');
      console.log('[MIGRATION] Cleared old notification storage');
      
      // Step 3: Initialize the fixed notification service
      await fixedNotificationService.initialize();
      console.log('[MIGRATION] Initialized fixed notification service');
      
      // Step 4: Mark migration as complete
      await AsyncStorage.setItem('notification_migration_v2_complete', 'true');
      console.log('[MIGRATION] Migration completed successfully');
      
      // NOTE: Active medicines will be rescheduled when the user opens the medicines screen
      // or when the app calls scheduleMedicineReminder for each active medicine
      
    } catch (error) {
      console.error('[MIGRATION] Error during migration:', error);
    }
  }
  
  static async isMigrationComplete(): Promise<boolean> {
    try {
      const migrationComplete = await AsyncStorage.getItem('notification_migration_v2_complete');
      return migrationComplete === 'true';
    } catch (error) {
      console.error('[MIGRATION] Error checking migration status');
      // If we can't check migration status, assume it needs to be done
      return false;
    }
  }
}