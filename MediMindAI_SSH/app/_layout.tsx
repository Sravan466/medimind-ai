// Root Layout for MediMind AI

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { useAppTheme } from '../src/styles/theme';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SettingsProvider, useSettingsContext } from '../src/contexts/SettingsContext';

import { fixedNotificationService } from '../src/services/notifications_fixed';
import { healthTipsService } from '../src/services/healthTips';
import { medicineLogService } from '../src/services/medicineLogService';
import { supabase } from '../src/services/supabase';
import { NotificationMigration } from '../src/utils/notificationMigration';

// Theme wrapper component
function ThemedApp({ children }: { children: React.ReactNode }) {
  const { settings } = useSettingsContext();
  const theme = useAppTheme(settings?.theme || 'light', settings?.accessibility);
  
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
}

export default function RootLayout() {
  // Initialize notifications and handle notification responses when app starts
  useEffect(() => {
    const initNotifications = async () => {
      try {
        console.log('[INIT] Starting notification initialization...');
        
        // Check if migration is needed
        const migrationComplete = await NotificationMigration.isMigrationComplete();
        if (!migrationComplete) {
          await NotificationMigration.migrateToFixedSystem();
        }
        
        // Initialize services
        await fixedNotificationService.initialize();
        await healthTipsService.initialize();
        
        // Reconcile and cleanup
        await fixedNotificationService.reconcileNotifications();
        await fixedNotificationService.cleanupOldNotifications();
        
        console.log('[INIT] Notification initialization completed');
      } catch (error) {
        console.log('[INIT] Error initializing services:', error);
      }
    };


    
    // FIXED: Simplified notification listener to prevent cascading issues
    const notificationListener = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data as any;
      
      if (data?.type === 'reminder') {
        console.log('[FIRE] Medicine reminder received:', notification.request.content.title);
        
        // Find the log entry for this medicine and time
        try {
          const pendingMedicines = await medicineLogService.getPendingMedicinesByMedicineId(data.medicineId, data.time);
          const matchingLog = pendingMedicines.find(med => med.medicineId === data.medicineId);
          
          if (matchingLog) {
            console.log(`[FIRE] Found matching log ${matchingLog.id}, marking as due`);
            
            // Mark as due so it shows in Today Medicines with checkbox
            await medicineLogService.markAsDue(matchingLog.id);
            
            // FIXED: Schedule only ONE follow-up reminder (no cascading)
            await fixedNotificationService.scheduleFollowupReminder(
              matchingLog.id,
              data.medicineName,
              data.dosage,
              data.time
            );
            
            console.log(`[FIRE] Scheduled single follow-up for log ${matchingLog.id}`);
          }
        } catch (error) {
          console.error('[FIRE] Error handling notification:', error);
        }
      } else if (data?.type === 'followup') {
        console.log('[FIRE] Follow-up reminder received:', notification.request.content.title);
        // Follow-up notifications don't trigger additional notifications
        // User needs to manually mark as taken in the app
      }
    });

    // Separate listener for user taps (to open app)
    const responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('[TAP] Notification tapped:', response.notification.request.content.title);
      
      // Handle medicine reminder notifications when user taps
      const data = response.notification.request.content.data as any;
      if (data?.type === 'reminder') {
        console.log('[TAP] Medicine reminder notification tapped - user opened app');
        // No need to schedule funny reminder here since user is actively using the app
      }
    });

    // Initialize notifications first, then set up listeners after a delay
    initNotifications().then(() => {
      // Add a small delay to ensure all notifications are cleared before setting up listeners
      setTimeout(() => {
        console.log('[INIT] Setting up notification listeners...');
      }, 1000);
    });

    // Cleanup listeners
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemedApp>
          <Stack>
            <Stack.Screen 
              name="(auth)" 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                gestureEnabled: false,
              }} 
            />
          </Stack>
        </ThemedApp>
      </SettingsProvider>
    </AuthProvider>
  );
}
