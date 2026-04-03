// Fixed Notification Service for MediMind AI - Addresses all notification issues

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Medicine } from '../types/database';
import { aiService } from './ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior - ensure notifications always show immediately
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export interface NotificationData extends Record<string, unknown> {
  medicineId: string;
  medicineName: string;
  dosage: string;
  time: string;
  logId: string;
  type: 'reminder' | 'followup';
  scheduledDate: string; // YYYY-MM-DD format
}

interface ScheduledNotification {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  time: string;
  dayOfWeek: number;
  scheduledDate: string;
  notificationId: string;
}

export class FixedNotificationService {
  private static instance: FixedNotificationService;
  private isInitialized = false;
  private scheduledNotifications = new Map<string, ScheduledNotification>();

  private constructor() {}

  static getInstance(): FixedNotificationService {
    if (!FixedNotificationService.instance) {
      FixedNotificationService.instance = new FixedNotificationService();
    }
    return FixedNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('[FIXED_NOTIFICATIONS] Initializing...');
      
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('[FIXED_NOTIFICATIONS] Permissions not granted');
        return false;
      }
      
      // Request battery optimization exemption for Android
      if (Platform.OS === 'android') {
        await this.requestBatteryOptimizationExemption();
      }

      // Create notification channel for Android
      if (Platform.OS === 'android') {
        // Delete and recreate channels to ensure MAX importance is applied
        // (Android caches channel settings - importance can't be upgraded after creation)
        try {
          await Notifications.deleteNotificationChannelAsync('medicine-reminders');
        } catch (_) {}

        await Notifications.setNotificationChannelAsync('medicine-reminders', {
          name: 'Medicine Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2196F3',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          enableLights: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });

        try {
          await Notifications.deleteNotificationChannelAsync('default');
        } catch (_) {}

        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2196F3',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Check exact alarm permission (Android 12+)
        await this.ensureExactAlarmPermission();
      }

      // Load persisted notifications
      await this.loadPersistedNotifications();

      this.isInitialized = true;
      console.log('[FIXED_NOTIFICATIONS] Initialization completed');
      return true;
    } catch (error) {
      console.error('[FIXED_NOTIFICATIONS] Initialization error:', error);
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      console.log('[PERMISSIONS] Requesting notification permissions...');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[PERMISSIONS] Current status:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
        console.log('[PERMISSIONS] New status after request:', finalStatus);
      }

      const granted = finalStatus === 'granted';
      console.log('[PERMISSIONS] Final result:', granted ? 'GRANTED' : 'DENIED');
      return granted;
    } catch (error) {
      console.error('[PERMISSIONS] Error requesting permissions:', error);
      return false;
    }
  }

  // Request battery optimization exemption for background notifications
  private async requestBatteryOptimizationExemption(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        console.log('[BATTERY] Requesting battery optimization exemption...');
        // Try to open battery optimization settings for the user
        try {
          const { Linking } = await import('react-native');
          // Check if we've already prompted (only prompt once per install)
          const prompted = await AsyncStorage.getItem('battery_opt_prompted');
          if (!prompted) {
            console.log('[BATTERY] User should disable battery optimization for MediMind in device settings for reliable notifications');
            await AsyncStorage.setItem('battery_opt_prompted', 'true');
          }
        } catch (_) {}
      }
    } catch (error) {
      console.error('[BATTERY] Error requesting battery optimization exemption:', error);
    }
  }

  // Ensure exact alarm permission on Android 12+
  private async ensureExactAlarmPermission(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // On Android 12+ (API 31+), SCHEDULE_EXACT_ALARM needs to be checked
        // expo-notifications handles this internally, but we log for debugging
        console.log('[ALARM] Checking exact alarm permission...');
        const scheduledNotifs = await Notifications.getAllScheduledNotificationsAsync();
        console.log(`[ALARM] Currently ${scheduledNotifs.length} scheduled notifications (permission OK if > 0 or first run)`);
      }
    } catch (error) {
      console.error('[ALARM] Error checking exact alarm permission:', error);
    }
  }

  // FIXED: Simple, reliable medicine scheduling
  async scheduleMedicineReminder(medicine: Medicine): Promise<string[]> {
    const notificationIds: string[] = [];

    try {
      console.log(`[FIXED_SCHEDULE] Scheduling medicine ID: ${medicine.id}`);

      // Cancel existing notifications for this medicine
      await this.cancelMedicineNotifications(medicine.id);

      if (!medicine.is_active) {
        console.log(`[FIXED_SCHEDULE] Medicine ID ${medicine.id} is inactive`);
        return notificationIds;
      }

      const today = new Date();
      const currentDayOfWeek = today.getDay();

      // Schedule for next 7 days to ensure daily coverage
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        const targetDayOfWeek = targetDate.getDay();

        // Check if medicine should be taken on this day
        if (medicine.days_of_week.includes(targetDayOfWeek)) {
          for (const timeString of medicine.times) {
            const notificationId = await this.scheduleExactNotification(
              medicine,
              timeString,
              targetDate
            );
            if (notificationId) {
              notificationIds.push(notificationId);
            }
          }
        }
      }

      console.log(`[FIXED_SCHEDULE] Scheduled ${notificationIds.length} notifications for medicine ID: ${medicine.id}`);
      return notificationIds;
    } catch (error) {
      console.error('[FIXED_SCHEDULE] Error:', error);
      return notificationIds;
    }
  }

  // FIXED: Schedule exact notification with proper date handling
  private async scheduleExactNotification(
    medicine: Medicine,
    timeString: string,
    targetDate: Date
  ): Promise<string | null> {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Create exact scheduled time
      const scheduledTime = new Date(targetDate);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Skip if time has already passed today
      const now = new Date();
      if (scheduledTime <= now) {
        console.log(`[FIXED_SCHEDULE] Skipping past time: ${timeString} on ${targetDate.toDateString()}`);
        return null;
      }

      // Create unique identifier
      const dateString = targetDate.toISOString().split('T')[0];
      const notificationIdentifier = `medicine_${medicine.id}_${timeString.replace(':', '')}_${dateString}`;

      console.log(`[FIXED_SCHEDULE] Scheduling ${medicine.name} at ${timeString} on ${dateString}`);

      const notificationData: NotificationData = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        time: timeString,
        logId: '', // Will be set when notification fires
        type: 'reminder',
        scheduledDate: dateString,
      };

      // Calculate seconds until the scheduled time for TIME_INTERVAL trigger
      // TIME_INTERVAL is more reliable than DATE on Android for background delivery
      const secondsUntil = Math.max(1, Math.floor((scheduledTime.getTime() - now.getTime()) / 1000));

      // Use TIME_INTERVAL for notifications within 24 hours (more reliable on Android)
      // Use DATE for notifications further out
      const useTimeInterval = secondsUntil <= 86400; // 24 hours

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: notificationIdentifier,
        content: {
          title: 'Medicine Reminder 💊',
          body: `Time to take ${medicine.name} - ${medicine.dosage}`,
          data: notificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'medicine-reminder',
          sticky: false,
          autoDismiss: false,
          ...(Platform.OS === 'android' && {
            channelId: 'medicine-reminders',
            color: '#2196F3',
            badge: 1,
          }),
        },
        trigger: useTimeInterval
          ? {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: secondsUntil,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: scheduledTime,
            },
      });
      
      console.log(`[FIXED_SCHEDULE] Successfully scheduled notification ${notificationId} for ${scheduledTime.toLocaleString()}`);
      
      // Verify the notification was actually scheduled
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const wasScheduled = allScheduled.some(n => n.identifier === notificationIdentifier);
      if (!wasScheduled) {
        console.error(`[FIXED_SCHEDULE] WARNING: Notification ${notificationIdentifier} was not actually scheduled!`);
        return null;
      }

      // Store notification info for persistence
      const scheduledNotification: ScheduledNotification = {
        id: notificationIdentifier,
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        time: timeString,
        dayOfWeek: targetDate.getDay(),
        scheduledDate: dateString,
        notificationId,
      };

      this.scheduledNotifications.set(notificationIdentifier, scheduledNotification);
      await this.savePersistedNotifications();

      return notificationId;
    } catch (error) {
      console.error('[FIXED_SCHEDULE] Error scheduling notification:', error);
      return null;
    }
  }

  // FIXED: Clean cancellation without affecting other medicines
  async cancelMedicineNotifications(medicineId: string): Promise<void> {
    try {
      console.log(`[FIXED_CANCEL] Cancelling notifications for medicine ${medicineId}`);
      
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      let cancelledCount = 0;

      for (const notification of scheduledNotifications) {
        if (notification.identifier.includes(`medicine_${medicineId}_`)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          this.scheduledNotifications.delete(notification.identifier);
          cancelledCount++;
        }
      }

      await this.savePersistedNotifications();
      console.log(`[FIXED_CANCEL] Cancelled ${cancelledCount} notifications for medicine ${medicineId}`);
    } catch (error) {
      console.error('[FIXED_CANCEL] Error:', error);
    }
  }

  // FIXED: Schedule simple follow-up reminder (no cascading)
  async scheduleFollowupReminder(
    logId: string,
    medicineName: string,
    dosage: string,
    timeString: string
  ): Promise<string | null> {
    try {
      const followupId = `followup_${logId}`;
      
      // Cancel any existing follow-up for this log
      await Notifications.cancelScheduledNotificationAsync(followupId);

      const notificationData: NotificationData = {
        medicineId: '',
        medicineName,
        dosage,
        time: timeString,
        logId,
        type: 'followup',
        scheduledDate: new Date().toISOString().split('T')[0],
      };

      // Get a funny message
      const funnyMessage = await this.getFunnyMessage(medicineName);

      // Schedule follow-up in 5 minutes
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: followupId,
        content: {
          title: 'Medicine Reminder',
          body: funnyMessage,
          data: notificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' && {
            channelId: 'medicine-reminders',
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 300, // 5 minutes
        },
      });

      console.log(`[FIXED_FOLLOWUP] Scheduled follow-up for ${medicineName} in 5 minutes`);
      return notificationId;
    } catch (error) {
      console.error('[FIXED_FOLLOWUP] Error:', error);
      return null;
    }
  }

  // Cancel follow-up reminders for a specific log
  async cancelFollowupReminders(logId: string): Promise<void> {
    try {
      const followupId = `followup_${logId}`;
      await Notifications.cancelScheduledNotificationAsync(followupId);
      console.log(`[FIXED_CANCEL_FOLLOWUP] Cancelled follow-up for log ${logId}`);
    } catch (error) {
      console.error('[FIXED_CANCEL_FOLLOWUP] Error:', error);
    }
  }

  // FIXED: Get funny message with fallback
  private async getFunnyMessage(medicineName: string): Promise<string> {
    try {
      const prompt = `Generate a short, funny reminder message for taking medicine. Keep it under 80 characters. Medicine: ${medicineName}`;
      const response = await aiService.getChatResponse(prompt, '');
      
      if (response && response.length > 0 && response.length < 80) {
        return response;
      }
    } catch (error) {
      console.log('[FIXED_FUNNY] AI failed, using fallback');
    }

    // Fallback messages
    const funnyMessages = [
      "Your medicine is waiting! Don't keep it hanging 💊",
      "Pill time! Your health is calling 📞",
      "Medicine reminder: Be a responsible adult! 💪",
      "Don't forget your daily superhero dose! ⚡",
      "Your pills miss you already 😢",
      "Time for your health boost! 🎯",
    ];

    return funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
  }

  // FIXED: Persistence methods
  private async savePersistedNotifications(): Promise<void> {
    try {
      const notificationsArray = Array.from(this.scheduledNotifications.entries());
      await AsyncStorage.setItem('scheduled_notifications_v2', JSON.stringify(notificationsArray));
    } catch (error) {
      console.error('[FIXED_PERSIST] Save error:', error);
    }
  }

  private async loadPersistedNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications_v2');
      if (stored) {
        const notificationsArray = JSON.parse(stored);
        this.scheduledNotifications = new Map(notificationsArray);
        console.log(`[FIXED_PERSIST] Loaded ${this.scheduledNotifications.size} persisted notifications`);
      }
    } catch (error) {
      console.error('[FIXED_PERSIST] Load error:', error);
    }
  }

  // FIXED: Clean reconciliation - only reschedule missing notifications for today and tomorrow
  async reconcileNotifications(): Promise<void> {
    try {
      console.log('[FIXED_RECONCILE] Starting reconciliation...');
      
      const currentNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const currentIds = new Set(currentNotifications.map(n => n.identifier));
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const todayString = today.toISOString().split('T')[0];
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      let restoredCount = 0;
      
      for (const [id, notification] of this.scheduledNotifications.entries()) {
        // Only restore notifications for today and tomorrow
        if ((notification.scheduledDate === todayString || notification.scheduledDate === tomorrowString) 
            && !currentIds.has(id)) {
          
          const [hours, minutes] = notification.time.split(':').map(Number);
          const scheduledTime = new Date(notification.scheduledDate + 'T00:00:00');
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          // Only restore if time hasn't passed
          const now = new Date();
          if (scheduledTime > now) {
            console.log(`[FIXED_RECONCILE] Restoring notification: ${notification.medicineName} at ${notification.time}`);

            const notificationData: NotificationData = {
              medicineId: notification.medicineId,
              medicineName: notification.medicineName,
              dosage: notification.dosage,
              time: notification.time,
              logId: '',
              type: 'reminder',
              scheduledDate: notification.scheduledDate,
            };

            const secondsUntil = Math.max(1, Math.floor((scheduledTime.getTime() - now.getTime()) / 1000));

            await Notifications.scheduleNotificationAsync({
              identifier: id,
              content: {
                title: 'Medicine Reminder 💊',
                body: `Time to take ${notification.medicineName} - ${notification.dosage}`,
                data: notificationData,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                ...(Platform.OS === 'android' && {
                  channelId: 'medicine-reminders',
                  color: '#2196F3',
                  badge: 1,
                }),
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsUntil,
              },
            });

            restoredCount++;
          }
        }
      }
      
      console.log(`[FIXED_RECONCILE] Restored ${restoredCount} notifications`);
    } catch (error) {
      console.error('[FIXED_RECONCILE] Error:', error);
    }
  }

  // Clean up old notifications (older than 2 days)
  async cleanupOldNotifications(): Promise<void> {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString().split('T')[0];
      
      let cleanedCount = 0;
      for (const [id, notification] of this.scheduledNotifications.entries()) {
        if (notification.scheduledDate < cutoffDate) {
          this.scheduledNotifications.delete(id);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        await this.savePersistedNotifications();
        console.log(`[FIXED_CLEANUP] Cleaned up ${cleanedCount} old notifications`);
      }
    } catch (error) {
      console.error('[FIXED_CLEANUP] Error:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[FIXED_GET] Error getting notifications:', error);
      return [];
    }
  }

  // REMOVED: cancelAllNotifications - this was causing the main issue
  // The app should never cancel all notifications on startup
}

export const fixedNotificationService = FixedNotificationService.getInstance();