import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  notifications_enabled: boolean;
  reminder_time: string;
  theme: 'light' | 'dark' | 'auto';
  privacy_mode: boolean;
  data_sharing: boolean;
  language: string;
  accessibility: {
    large_text: boolean;
    high_contrast: boolean;
    screen_reader: boolean;
  };
  notifications: {
    sound_enabled: boolean;
    vibration_enabled: boolean;
    badge_enabled: boolean;
    reminder_frequency: 'once' | 'daily' | 'custom';
    snooze_duration: number; // minutes
    quiet_hours: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string; // HH:mm format
    };
    categories: {
      medicine_reminders: boolean;
      missed_doses: boolean;
      refill_alerts: boolean;
      health_tips: boolean;
    };
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications_enabled: true,
  reminder_time: '09:00',
  theme: 'light',
  privacy_mode: false,
  data_sharing: true,
  language: 'en',
  accessibility: {
    large_text: false,
    high_contrast: false,
    screen_reader: false,
  },
  notifications: {
    sound_enabled: true,
    vibration_enabled: true,
    badge_enabled: true,
    reminder_frequency: 'daily',
    snooze_duration: 10,
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    categories: {
      medicine_reminders: true,
      missed_doses: true,
      refill_alerts: true,
      health_tips: true,
    },
  },
};

const SETTINGS_STORAGE_KEY = '@medimind_settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      } else {
        // Save default settings if none exist
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  }, [settings]);

  const updateAccessibilitySetting = useCallback(async (
    key: keyof AppSettings['accessibility'],
    value: boolean
  ) => {
    try {
      const newAccessibility = { ...settings.accessibility, [key]: value };
      const newSettings = { ...settings, accessibility: newAccessibility };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating accessibility setting:', error);
    }
  }, [settings]);

  const updateNotificationSetting = useCallback(async <K extends keyof AppSettings['notifications']>(
    key: K,
    value: AppSettings['notifications'][K]
  ) => {
    try {
      const newNotifications = { ...settings.notifications, [key]: value };
      const newSettings = { ...settings, notifications: newNotifications };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating notification setting:', error);
    }
  }, [settings]);

  const updateNotificationCategorySetting = useCallback(async (
    key: keyof AppSettings['notifications']['categories'],
    value: boolean
  ) => {
    try {
      const newCategories = { ...settings.notifications.categories, [key]: value };
      const newNotifications = { ...settings.notifications, categories: newCategories };
      const newSettings = { ...settings, notifications: newNotifications };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating notification category setting:', error);
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }, []);

  const exportSettings = useCallback(() => {
    return {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  }, [settings]);

  const importSettings = useCallback(async (importedSettings: Partial<AppSettings>) => {
    try {
      const newSettings = { ...DEFAULT_SETTINGS, ...importedSettings };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    updateAccessibilitySetting,
    updateNotificationSetting,
    updateNotificationCategorySetting,
    resetSettings,
    exportSettings,
    importSettings,
  };
};
