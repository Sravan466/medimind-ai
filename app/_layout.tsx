// Root Layout for MediMind AI

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { useAppTheme } from '../src/styles/theme';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SettingsProvider, useSettingsContext } from '../src/contexts/SettingsContext';

import { notificationService } from '../src/services/notifications';
import { healthTipsService } from '../src/services/healthTips';
import { medicineLogService } from '../src/services/medicineLogService';
import { supabase } from '../src/services/supabase';

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
        
        // Clear ALL existing notifications to prevent cascades
        await notificationService.cancelAllNotifications();
        console.log('[INIT] Cleared all existing notifications');
        
        await notificationService.initialize();
        await healthTipsService.initialize();
        // Alarm service initializes automatically in constructor
        
        console.log('[INIT] Notification initialization completed');
      } catch (error) {
        console.log('[INIT] Error initializing services:', error);
      }
    };


    
    // Single notification listener for handling medicine reminders
    const notificationListener = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data as any;
      
      // Only handle medicine reminders, ignore other notification types
      if (data?.type === 'reminder') {
        console.log('[FIRE] Primary medicine reminder received:', notification.request.content.title);
        
        // Find the log entry for this medicine and time
        try {
          console.log(`[FIRE_PRIMARY] Looking for medicine ${data.medicineId} at time ${data.time}`);
          const pendingMedicines = await medicineLogService.getPendingMedicinesByMedicineId(data.medicineId, data.time);
          const matchingLog = pendingMedicines.find(med => 
            med.medicineId === data.medicineId
          );
          
          if (matchingLog) {
            console.log(`[FIRE_PRIMARY] Found matching log ${matchingLog.id}, marking as due and scheduling funny reminder`);
            
            // Mark as due so it shows in Today Medicines with checkbox
            await medicineLogService.markAsDue(matchingLog.id);
            console.log(`[FIRE_PRIMARY] Marked log ${matchingLog.id} as due`);
            
            // Schedule the first funny reminder
            await notificationService.scheduleFunnyReminder(
              matchingLog.id,
              data.medicineName,
              data.dosage,
              data.time
            );
            console.log(`[FIRE_FOLLOWUP] Scheduled first funny reminder for log ${matchingLog.id}`);
          } else {
            console.log(`[FIRE_PRIMARY] No matching log found for medicine ${data.medicineId} at time ${data.time}`);
          }
        } catch (error) {
          console.error('[FIRE_PRIMARY] Error handling primary notification:', error);
        }
      } else if (data?.type === 'funny_reminder') {
        console.log('[FIRE] Funny reminder received:', notification.request.content.title);
        
        // Check if the log is still due (user hasn't taken action yet)
        try {
          const logId = data.logId;
          console.log(`[FIRE_FUNNY] Checking if log ${logId} is still due`);
          
          // Get the current status of the log
          const { data: logData, error } = await supabase
            .from('medicine_logs')
            .select('status')
            .eq('id', logId)
            .single();
          
          if (logData && !error && (logData as any).status === 'due') {
            console.log(`[FIRE_FUNNY] Log ${logId} is still due, scheduling next funny reminder`);
            
            // Schedule the next funny reminder
            await notificationService.scheduleFunnyReminder(
              logId,
              data.medicineName,
              data.dosage,
              data.time
            );
            console.log(`[FIRE_FUNNY] Scheduled next funny reminder for log ${logId}`);
          } else {
            const status = (logData as any)?.status || 'unknown';
            console.log(`[FIRE_FUNNY] Log ${logId} is no longer due (status: ${status}), stopping funny reminders`);
          }
        } catch (error) {
          console.error('[FIRE_FUNNY] Error handling funny reminder:', error);
        }
      } else {
        // Log other notification types but don't process them
        console.log('[FIRE] Other notification received:', notification.request.content.title, 'Type:', data?.type);
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
