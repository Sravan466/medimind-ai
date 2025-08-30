// Notification Hook for MediMind AI

import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationData } from '../services/notifications';
import { Medicine } from '../types/database';

export interface NotificationState {
  isInitialized: boolean;
  hasPermission: boolean;
  scheduledCount: number;
  lastNotification: NotificationData | null;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    isInitialized: false,
    hasPermission: false,
    scheduledCount: 0,
    lastNotification: null,
  });

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    initializeNotifications();
    setupNotificationListeners();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      const hasPermission = await notificationService.initialize();
      const scheduledNotifications = await notificationService.getScheduledNotifications();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        hasPermission,
        scheduledCount: scheduledNotifications.length,
      }));
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as NotificationData;
      setState(prev => ({
        ...prev,
        lastNotification: data,
      }));
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as NotificationData;
      console.log('Notification tapped:', data);
      
      // Handle notification tap - you can navigate to specific screens here
      handleNotificationTap(data);
    });
  };

  const handleNotificationTap = (data: NotificationData) => {
    // You can implement navigation logic here based on notification type
    switch (data.type) {
      case 'reminder':
        // Navigate to medicine details or take medicine screen
        console.log('Reminder notification tapped for:', data.medicineName);
        break;
      case 'missed':
        // Navigate to take medicine screen
        console.log('Missed medicine notification tapped for:', data.medicineName);
        break;
      case 'overdue':
        // Navigate to take medicine screen with urgency
        console.log('Overdue medicine notification tapped for:', data.medicineName);
        break;
    }
  };

  const scheduleMedicineReminder = async (medicine: Medicine): Promise<string[]> => {
    try {
      const notificationIds = await notificationService.scheduleMedicineReminder(medicine);
      
      // Update scheduled count
      const scheduledNotifications = await notificationService.getScheduledNotifications();
      setState(prev => ({
        ...prev,
        scheduledCount: scheduledNotifications.length,
      }));

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling medicine reminder:', error);
      return [];
    }
  };

  const cancelMedicineNotifications = async (medicineId: string): Promise<void> => {
    try {
      console.log(`[HOOK] Cancelling notifications for medicine ${medicineId}`);
      await notificationService.cancelDose(medicineId);
      console.log(`[HOOK] Successfully cancelled notifications for medicine ${medicineId}`);
    } catch (error) {
      console.error('[HOOK] Error canceling medicine notifications:', error);
    }
  };

  const cancelAllNotifications = async (): Promise<void> => {
    try {
      await notificationService.cancelAllNotifications();
      setState(prev => ({
        ...prev,
        scheduledCount: 0,
      }));
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };

  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    try {
      return await notificationService.getScheduledNotifications();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  const scheduleTestNotification = async (): Promise<string | null> => {
    try {
      const testMedicine: Medicine = {
        id: 'test',
        user_id: 'test',
        name: 'Test Medicine',
        dosage: '1 tablet',
        frequency: 'daily',
        times: ['12:00'],
        days_of_week: [new Date().getDay()], // Today
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        notes: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const notificationIds = await scheduleMedicineReminder(testMedicine);
      return notificationIds.length > 0 ? notificationIds[0] : null;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      return null;
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const hasPermission = await notificationService.initialize();
      setState(prev => ({
        ...prev,
        hasPermission,
      }));
      return hasPermission;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  return {
    ...state,
    scheduleMedicineReminder,
    cancelMedicineNotifications,
    cancelAllNotifications,
    getScheduledNotifications,
    scheduleTestNotification,
    requestPermissions,
  };
};
