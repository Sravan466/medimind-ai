// Notification Service for MediMind AI - EAS BUILD FIXED VERSION

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Medicine } from '../types/database';
import { aiService } from './ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior for EAS builds
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData extends Record<string, unknown> {
  medicineId: string;
  medicineName: string;
  dosage: string;
  time: string;
  logId: string;
  type: 'reminder' | 'funny_reminder' | 'missed' | 'overdue';
  funnyReminderCount?: number;
  scheduledTimestamp?: number; // Store exact scheduled time for reconciliation
}

export interface HealthTipNotificationData {
  tipId: string;
  type: 'health_tip';
}

interface ScheduledFollowup {
  logId: string;
  attempt: number;
  scheduledTime: number;
  medicineName: string;
  dosage: string;
  timeString: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private scheduledNotificationIds = new Map<string, Set<string>>();
  private funnyReminderCounts = new Map<string, number>();
  private funnyReminderGuards = new Set<string>();
  private scheduledFollowups = new Map<string, ScheduledFollowup[]>();

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('[INIT] Starting notification service initialization...');
      
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('[INIT] Notification permissions not granted');
        return false;
      }

      // Create high-importance notification channel for medicine reminders
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medicine-reminders', {
          name: 'Medicine Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: false,
        });
        
        console.log('[INIT] Created high-importance notification channel for medicine reminders');
      }

      // Load persisted scheduled followups
      await this.loadScheduledFollowups();

      // Get push token (for future push notifications) - only if project ID is available
      if (Device.isDevice && process.env.EXPO_PUBLIC_PROJECT_ID) {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
          });
          console.log('[INIT] Push token:', token.data);
        } catch (tokenError) {
          console.log('[INIT] Could not get push token (project ID may be missing):', tokenError);
        }
      } else {
        console.log('[INIT] Skipping push token - project ID not available or not on device');
      }

      this.isInitialized = true;
      console.log('[INIT] Notification service initialization completed');
      return true;
    } catch (error) {
      console.error('[INIT] Error initializing notifications:', error);
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  // NEW: Persistence methods for scheduled followups
  private async saveScheduledFollowups(): Promise<void> {
    try {
      const followupsArray = Array.from(this.scheduledFollowups.entries());
      await AsyncStorage.setItem('scheduled_followups', JSON.stringify(followupsArray));
      console.log('[PERSIST] Saved scheduled followups to storage');
    } catch (error) {
      console.error('[PERSIST] Error saving scheduled followups:', error);
    }
  }

  private async loadScheduledFollowups(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduled_followups');
      if (stored) {
        const followupsArray = JSON.parse(stored);
        this.scheduledFollowups = new Map(followupsArray);
        console.log(`[PERSIST] Loaded ${this.scheduledFollowups.size} scheduled followup groups`);
      }
    } catch (error) {
      console.error('[PERSIST] Error loading scheduled followups:', error);
    }
  }

  // NEW: Reconciliation method to restore missing notifications after app restart
  async reconcile(): Promise<void> {
    try {
      console.log('[RECONCILE] Starting notification reconciliation...');
      
      // Get all currently scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const scheduledIds = new Set(scheduledNotifications.map(n => n.identifier));
      
      // Check each scheduled followup and reschedule if missing
      for (const [logId, followups] of this.scheduledFollowups.entries()) {
        for (const followup of followups) {
          const expectedId = `funny_${logId}_${followup.attempt}`;
          if (!scheduledIds.has(expectedId)) {
            console.log(`[RECONCILE] Missing notification ${expectedId}, rescheduling...`);
            await this.scheduleFunnyReminder(
              followup.logId,
              followup.medicineName,
              followup.dosage,
              followup.timeString,
              240000
            );
          }
        }
      }
      
      console.log('[RECONCILE] Notification reconciliation completed');
    } catch (error) {
      console.error('[RECONCILE] Error during reconciliation:', error);
    }
  }

  // IMPROVED: Schedule medicine reminders with deterministic IDs
  async scheduleMedicineReminder(medicine: Medicine): Promise<string[]> {
    const notificationIds: string[] = [];

    console.log(`[SCHEDULE] Starting for ${medicine.name} (ID: ${medicine.id})`);

    try {
      // Cancel any existing notifications for this medicine FIRST
      await this.cancelDose(medicine.id);

      if (!medicine.is_active) {
        console.log(`[SCHEDULE] Medicine ${medicine.name} is inactive, skipping`);
        return notificationIds;
      }

      const today = new Date();
      const startDate = new Date(medicine.start_date);
      const endDate = medicine.end_date ? new Date(medicine.end_date) : null;

      // Check if medicine is currently active
      if (today < startDate || (endDate && today > endDate)) {
        console.log(`[SCHEDULE] Medicine ${medicine.name} is outside active date range, skipping`);
        return notificationIds;
      }

      // Get current time for comparison
      const currentTime = today.toTimeString().slice(0, 5); // HH:MM format
      const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

      console.log(`[SCHEDULE] Processing ${medicine.name} - Current time: ${currentTime}, Day: ${currentDayOfWeek}`);
      console.log(`[SCHEDULE] Medicine times: ${medicine.times}, Days: ${medicine.days_of_week}`);

      // Schedule notifications for each time
      for (const timeString of medicine.times) {
        if (medicine.days_of_week.includes(currentDayOfWeek)) {
          // Today - check if time is in the future
          const timeDiff = this.getTimeDifferenceInMinutes(timeString, currentTime);
          
          if (timeDiff > 0) {
            // Future time today
            console.log(`[SCHEDULE] Future time today: ${timeString} (${timeDiff} minutes from now)`);
            const notificationId = await this.scheduleExactTimeNotification(
              medicine,
              timeString,
              today
            );
            if (notificationId) {
              notificationIds.push(notificationId);
            }
          } else if (timeDiff >= -60) {
            // Within the last hour - schedule missed reminder
            console.log(`[SCHEDULE] Recent/missed time: ${timeString} (${Math.abs(timeDiff)} minutes ago)`);
            const missedNotificationId = await this.scheduleMissedReminder(
              medicine,
              timeString
            );
            if (missedNotificationId) {
              notificationIds.push(missedNotificationId);
            }
          } else {
            console.log(`[SCHEDULE] Skipping past time: ${timeString} (${Math.abs(timeDiff)} minutes ago)`);
          }
        }
        
        // Schedule weekly notifications for future days
        for (const dayOfWeek of medicine.days_of_week) {
          if (dayOfWeek !== currentDayOfWeek) {
            const daysUntilTarget = (dayOfWeek - currentDayOfWeek + 7) % 7;
            if (daysUntilTarget > 0) {
              console.log(`[SCHEDULE] Weekly notification for day ${dayOfWeek} at ${timeString} (${daysUntilTarget} days from now)`);
              const notificationId = await this.scheduleWeeklyNotification(
                medicine,
                timeString,
                dayOfWeek
              );
              if (notificationId) {
                notificationIds.push(notificationId);
              }
            }
          }
        }
      }

      console.log(`[SCHEDULE] Completed ${notificationIds.length} notifications for ${medicine.name}`);
      
      // Store notification IDs for this medicine
      this.scheduledNotificationIds.set(medicine.id, new Set(notificationIds));
      
      return notificationIds;
    } catch (error) {
      console.error('[SCHEDULE] Error scheduling medicine reminder:', error);
      return notificationIds;
    }
  }

  private getTimeDifferenceInMinutes(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    return minutes1 - minutes2;
  }

  // IMPROVED: Schedule exact time notification with deterministic ID and exact timestamp
  private async scheduleExactTimeNotification(
    medicine: Medicine,
    timeString: string,
    baseDate: Date
  ): Promise<string | null> {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Create exact scheduled time for today
      const scheduledTime = new Date(baseDate);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // Calculate seconds until the scheduled time
      const now = new Date();
      const secondsUntilNotification = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
      
      // Ensure we don't schedule for the past
      if (secondsUntilNotification <= 0) {
        console.log(`[SCHEDULE] Time ${timeString} has already passed, skipping`);
        return null;
      }
      
      // Create deterministic notification identifier
      const dateString = baseDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const notificationIdentifier = `medicine_${medicine.id}_${timeString.replace(':', '')}_${dateString}`;
      
      console.log(`[SCHEDULE] Exact time notification for ${medicine.name} at ${timeString} in ${secondsUntilNotification}s (ID: ${notificationIdentifier})`);
      
      // Create notification content
      const title = `Medicine Reminder`;
      const body = `Time to take ${medicine.name} - ${medicine.dosage}`;
      
      const notificationData: NotificationData = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        time: timeString,
        logId: '', // Will be set when notification is received
        type: 'reminder',
        scheduledTimestamp: scheduledTime.getTime(),
      };

      // Use exact timestamp trigger for precise timing in EAS builds
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: notificationIdentifier,
        content: {
          title,
          body,
          data: notificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledTime,
        },
      });

      console.log(`[SCHEDULE] Successfully scheduled notification ${notificationId} for ${medicine.name} at ${timeString}`);
      return notificationId;
    } catch (error) {
      console.error('[SCHEDULE] Error scheduling exact time notification:', error);
      return null;
    }
  }

  // IMPROVED: Schedule weekly notification with deterministic ID
  private async scheduleWeeklyNotification(
    medicine: Medicine,
    timeString: string,
    dayOfWeek: number
  ): Promise<string | null> {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Create deterministic notification identifier for weekly notifications
      const notificationIdentifier = `weekly_${medicine.id}_${timeString.replace(':', '')}_${dayOfWeek}`;
      
      console.log(`[SCHEDULE] Weekly notification for ${medicine.name} at ${timeString} on day ${dayOfWeek} (ID: ${notificationIdentifier})`);
      
      // Create notification content
      const title = `Medicine Reminder`;
      const body = `Time to take ${medicine.name} - ${medicine.dosage}`;
      
      const notificationData: NotificationData = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        time: timeString,
        logId: '', // Will be set when notification is received
        type: 'reminder',
      };

      // Calculate next occurrence of this day and time
      const now = new Date();
      const targetDay = dayOfWeek; // 0 = Sunday, 1 = Monday, etc.
      const currentDay = now.getDay();
      
      // Calculate days until next occurrence
      let daysUntilNext = (targetDay - currentDay + 7) % 7;
      if (daysUntilNext === 0) {
        // If it's today, check if the time has passed
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const targetTime = hours * 60 + minutes;
        if (currentTime >= targetTime) {
          daysUntilNext = 7; // Schedule for next week
        }
      }
      
      // Calculate seconds until the next occurrence
      const nextOccurrence = new Date(now);
      nextOccurrence.setDate(now.getDate() + daysUntilNext);
      nextOccurrence.setHours(hours, minutes, 0, 0);
      
      const secondsUntilNotification = Math.floor((nextOccurrence.getTime() - now.getTime()) / 1000);
      
      // Use time interval trigger for Android compatibility
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: notificationIdentifier,
        content: {
          title,
          body,
          data: notificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilNotification,
          repeats: true,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('[SCHEDULE] Error scheduling weekly notification:', error);
      return null;
    }
  }

  // IMPROVED: Cancel all notifications for a medicine with deterministic IDs
  async cancelDose(medicineId: string): Promise<void> {
    try {
      console.log(`[CANCEL] Starting for medicine ${medicineId}`);
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      let cancelledCount = 0;
      
      for (const notification of scheduledNotifications) {
        // Check if notification identifier matches our patterns
        if (notification.identifier.includes(`_${medicineId}_`)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          cancelledCount++;
          console.log(`[CANCEL] Cancelled notification ${notification.identifier}`);
        }
      }
      
      // Clear stored notification IDs for this medicine
      this.scheduledNotificationIds.delete(medicineId);
      
      console.log(`[CANCEL] Completed ${cancelledCount} notifications for medicine ${medicineId}`);
    } catch (error) {
      console.error('[CANCEL] Error canceling medicine notifications:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      console.log('[CANCEL_ALL] Starting to cancel all notifications...');
      const beforeCount = (await Notifications.getAllScheduledNotificationsAsync()).length;
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Clear all tracking
      this.scheduledNotificationIds.clear();
      this.funnyReminderCounts.clear();
      this.funnyReminderGuards.clear();
      this.scheduledFollowups.clear();
      
      const afterCount = (await Notifications.getAllScheduledNotificationsAsync()).length;
      console.log(`[CANCEL_ALL] Cancelled ${beforeCount - afterCount} notifications (${beforeCount} → ${afterCount})`);
    } catch (error) {
      console.error('[CANCEL_ALL] Error canceling all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async scheduleMissedReminder(medicine: Medicine, timeString: string): Promise<string | null> {
    try {
      const title = `Missed Medicine Reminder`;
      const body = `You missed taking ${medicine.name} at ${timeString}. Please take it now.`;
      
      const notificationData: NotificationData = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        time: timeString,
        logId: '',
        type: 'missed',
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: notificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 30, // Send after 30 seconds
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling missed reminder:', error);
      return null;
    }
  }

  async scheduleOverdueReminder(medicine: Medicine, timeString: string): Promise<string | null> {
    try {
      const title = `Overdue Medicine Alert`;
      const body = `${medicine.name} is overdue by more than 1 hour. Please take it immediately.`;
      
      const notificationData: NotificationData = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        time: timeString,
        logId: '',
        type: 'overdue',
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: notificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 60, // Send after 1 minute
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling overdue reminder:', error);
      return null;
    }
  }

  // IMPROVED: Implement stable repeatUntilTaken function
  async repeatUntilTaken(logId: string, medicineName: string, dosage: string, timeString: string, intervalMs: number = 240000): Promise<void> {
    try {
      console.log(`[REPEAT_UNTIL_TAKEN] Starting repeat loop for logId: ${logId}, interval: ${intervalMs}ms`);
      
      // Schedule the first funny reminder
      await this.scheduleFunnyReminder(logId, medicineName, dosage, timeString, intervalMs);
      
      console.log(`[REPEAT_UNTIL_TAKEN] Initial funny reminder scheduled for logId: ${logId}`);
    } catch (error) {
      console.error('[REPEAT_UNTIL_TAKEN] Error starting repeat loop:', error);
    }
  }

  // IMPROVED: Schedule funny reminder with Gemini integration and deterministic IDs
  async scheduleFunnyReminder(logId: string, medicineName: string, dosage: string, timeString: string, intervalMs: number = 240000): Promise<string | null> {
    try {
      // Get current funny reminder count for this log
      const currentCount = this.funnyReminderCounts.get(logId) || 0;
      const newCount = currentCount + 1;
      
      // Store the new count
      this.funnyReminderCounts.set(logId, newCount);
      
      // Create deterministic notification identifier
      const notificationIdentifier = `funny_${logId}_${newCount}`;
      
      // Check if this reminder is already scheduled (idempotency guard)
      if (this.funnyReminderGuards.has(notificationIdentifier)) {
        console.log(`[SCHEDULE_FUNNY] Reminder ${notificationIdentifier} already scheduled, skipping`);
        return null;
      }
      
      console.log(`[SCHEDULE_FUNNY] attempt=${newCount} logId=${logId} identifier=${notificationIdentifier}`);
      
      const notificationData: NotificationData = {
        medicineId: '',
        medicineName,
        dosage,
        time: timeString,
        logId,
        type: 'funny_reminder',
        funnyReminderCount: newCount,
      };

      // Calculate exact time for funny reminder
      const now = new Date();
      const funnyReminderTime = new Date(now.getTime() + intervalMs);
      
      console.log(`[SCHEDULE_FUNNY] Scheduling funny reminder #${newCount} for logId: ${logId} at ${funnyReminderTime.toLocaleTimeString()}`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: notificationIdentifier,
        content: {
          title: `Medicine Reminder`,
          body: await this.getFunnyMessage(medicineName), // Get funny message from Gemini or fallback
          data: notificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.floor(intervalMs / 1000),
          repeats: false,
        },
      });

      // Mark as scheduled to prevent duplicates
      this.funnyReminderGuards.add(notificationIdentifier);
      
      // Store followup for persistence
      const followup: ScheduledFollowup = {
        logId,
        attempt: newCount,
        scheduledTime: funnyReminderTime.getTime(),
        medicineName,
        dosage,
        timeString,
      };
      
      if (!this.scheduledFollowups.has(logId)) {
        this.scheduledFollowups.set(logId, []);
      }
      this.scheduledFollowups.get(logId)!.push(followup);
      await this.saveScheduledFollowups();
      
      console.log(`[SCHEDULE_FUNNY] Scheduled funny reminder #${newCount} for logId: ${logId} in ${Math.floor(intervalMs / 1000)}s`);
      return notificationId;
    } catch (error) {
      console.error('[SCHEDULE_FUNNY] Error scheduling funny reminder:', error);
      return null;
    }
  }

  // NEW: Get funny message from Gemini API or fallback to local array
  private async getFunnyMessage(medicineName: string): Promise<string> {
    try {
      // Try to get funny message from Gemini API
      const prompt = `Generate a funny, encouraging reminder message for taking medicine. Keep it under 100 characters, be playful but not medical advice. Medicine name: ${medicineName}`;
      const response = await aiService.getChatResponse(prompt, '');
      
      if (response && response.length > 0 && response.length < 100) {
        console.log(`[FUNNY_MESSAGE] Generated from Gemini: ${response}`);
        return response;
      }
    } catch (error) {
      console.log('[FUNNY_MESSAGE] Gemini failed, using fallback');
    }

    // Fallback to local funny messages
    const funnyMessages = [
      "Oops! You forgot your medicine 🕒",
      "Did you just ghost your pills? Tick that box now 😅",
      "Your medicine is waiting… don't keep it hanging!",
      "Pill check! Your medicine is getting lonely 😂",
      "Time for your daily dose of responsibility! 💊",
      "Your medicine called, it said 'where are you?' 📞",
      "Tick that checkbox or your medicine will be sad 😢",
      "Medicine time! Don't make your pills wait ⏰",
      "Your pills are getting impatient! ⏰",
      "Medicine reminder: Your health is calling! 📱",
      "Don't forget your daily superhero dose! 💪",
      "Your medicine is doing a waiting dance 🕺",
      "Time to be a responsible adult! 💊",
      "Your pills miss you already 😢",
      "Medicine check-in time! ✅",
      "Your health routine is incomplete without this! 🎯",
      "Don't let your medicine feel abandoned! 🏠",
      "Time for your daily health boost! ⚡",
      "Your medicine is getting worried about you 😰",
      "Tick that box and make your medicine happy! 😊"
    ];

    const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    console.log(`[FUNNY_MESSAGE] Using fallback: ${randomMessage}`);
    return randomMessage;
  }

  // IMPROVED: Cancel all funny reminders for a specific log with deterministic IDs
  async cancelFunnyChain(logId: string): Promise<void> {
    try {
      console.log(`[CANCEL_FUNNY_CHAIN] Cancelling all funny reminders for logId: ${logId}`);
      
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      let cancelledCount = 0;
      
      for (const notification of scheduledNotifications) {
        // Check if notification identifier matches funny reminder pattern for this log
        if (notification.identifier.startsWith(`funny_${logId}_`)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          cancelledCount++;
          console.log(`[CANCEL_FUNNY_CHAIN] Cancelled notification ${notification.identifier}`);
          
          // Remove from guards
          this.funnyReminderGuards.delete(notification.identifier);
        }
      }
      
      // Clear the funny reminder count for this log
      this.funnyReminderCounts.delete(logId);
      
      // Clear from scheduled followups
      this.scheduledFollowups.delete(logId);
      await this.saveScheduledFollowups();
      
      console.log(`[CANCEL_FUNNY_CHAIN] Cancelled ${cancelledCount} funny reminders for logId: ${logId}`);
    } catch (error) {
      console.error('[CANCEL_FUNNY_CHAIN] Error canceling funny reminders:', error);
    }
  }

  // NEW: Get funny reminder count for a log
  getFunnyReminderCount(logId: string): number {
    return this.funnyReminderCounts.get(logId) || 0;
  }
}

export const notificationService = NotificationService.getInstance();
