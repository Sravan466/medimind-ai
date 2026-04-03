// Notification Test Utility for MediMind AI

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fixedNotificationService } from '../services/notifications_fixed';

export class NotificationTest {
  // Test basic notification functionality
  static async testBasicNotification(): Promise<boolean> {
    try {
      console.log('[TEST] Testing basic notification...');
      
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      console.log('[TEST] Permission status:', status);
      
      if (status !== 'granted') {
        console.log('[TEST] Requesting permissions...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('[TEST] Permissions denied');
          return false;
        }
      }
      
      // Schedule a test notification for 10 seconds from now
      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MediMind Test',
          body: 'This is a test notification. If you see this, notifications are working!',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' && {
            channelId: 'medicine-reminders',
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
        },
      });
      
      console.log('[TEST] Scheduled test notification:', testId);
      
      // Verify it was scheduled
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const testNotification = scheduled.find(n => n.identifier === testId);
      
      if (testNotification) {
        console.log('[TEST] Test notification successfully scheduled');
        return true;
      } else {
        console.log('[TEST] Test notification was NOT scheduled');
        return false;
      }
    } catch (error) {
      console.error('[TEST] Error testing notification:', error);
      return false;
    }
  }
  
  // Test medicine notification scheduling
  static async testMedicineNotification(): Promise<boolean> {
    try {
      console.log('[TEST] Testing medicine notification...');
      
      // Initialize the service
      const initialized = await fixedNotificationService.initialize();
      if (!initialized) {
        console.log('[TEST] Failed to initialize notification service');
        return false;
      }
      
      // Create a test medicine for 2 minutes from now
      const now = new Date();
      const testTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
      const timeString = testTime.toTimeString().slice(0, 5); // HH:MM format
      
      const testMedicine = {
        id: 'test-medicine-123',
        user_id: 'test-user',
        name: 'Test Medicine',
        dosage: '1 tablet',
        frequency: 'daily',
        times: [timeString],
        days_of_week: [testTime.getDay()],
        start_date: now.toISOString().split('T')[0],
        end_date: null,
        notes: null,
        is_active: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      
      // Schedule the medicine
      const notificationIds = await fixedNotificationService.scheduleMedicineReminder(testMedicine);
      
      if (notificationIds.length > 0) {
        console.log('[TEST] Medicine notification scheduled successfully:', notificationIds);
        return true;
      } else {
        console.log('[TEST] Failed to schedule medicine notification');
        return false;
      }
    } catch (error) {
      console.error('[TEST] Error testing medicine notification:', error);
      return false;
    }
  }
  
  // Get current notification status
  static async getNotificationStatus(): Promise<void> {
    try {
      console.log('[STATUS] === NOTIFICATION STATUS ===');
      
      // Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log('[STATUS] Permission status:', status);
      
      // Get scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('[STATUS] Scheduled notifications count:', scheduled.length);
      
      // List all scheduled notifications
      scheduled.forEach((notification, index) => {
        console.log(`[STATUS] ${index + 1}. ${notification.identifier}`);
        console.log(`  Title: ${notification.content.title}`);
        console.log(`  Body: ${notification.content.body}`);
        if (notification.trigger.type === 'date') {
          console.log(`  Scheduled for: ${new Date(notification.trigger.value).toLocaleString()}`);
        } else if (notification.trigger.type === 'timeInterval') {
          console.log(`  Interval: ${notification.trigger.seconds} seconds`);
        }
      });
      
      console.log('[STATUS] === END STATUS ===');
    } catch (error) {
      console.error('[STATUS] Error getting notification status:', error);
    }
  }
  
  // Clear all test notifications
  static async clearTestNotifications(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const testNotifications = scheduled.filter(n => 
        n.identifier.includes('test') || 
        n.content.title?.includes('Test') ||
        n.content.title?.includes('MediMind Test')
      );
      
      for (const notification of testNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log('[CLEAR] Cancelled test notification:', notification.identifier);
      }
      
      console.log(`[CLEAR] Cleared ${testNotifications.length} test notifications`);
    } catch (error) {
      console.error('[CLEAR] Error clearing test notifications:', error);
    }
  }
}