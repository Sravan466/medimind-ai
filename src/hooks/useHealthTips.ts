import { useState, useEffect, useCallback } from 'react';
import { healthTipsService, HealthTip } from '../services/healthTips';
import { useSettingsContext } from '../contexts/SettingsContext';
import { useAuthContext } from '../contexts/AuthContext';

export const useHealthTips = () => {
  const [currentTip, setCurrentTip] = useState<HealthTip | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const { settings } = useSettingsContext();
  const { user } = useAuthContext();

  // Check if health tips are enabled
  const isHealthTipsEnabled = settings.notifications.categories.health_tips;

  // Load current health tip on mount
  useEffect(() => {
    loadCurrentTip();
    checkScheduledStatus();
  }, []);

  // Check if daily health tip is scheduled
  const checkScheduledStatus = useCallback(async () => {
    try {
      const scheduledNotifications = await healthTipsService['cancelDailyHealthTipNotifications']();
      // If we can cancel notifications, they exist
      setIsScheduled(true);
    } catch (error) {
      setIsScheduled(false);
    }
  }, []);

  // Load current health tip
  const loadCurrentTip = useCallback(async () => {
    try {
      setLoading(true);
      const tip = await healthTipsService.generateDailyHealthTip(user?.id);
      setCurrentTip(tip);
    } catch (error) {
      console.error('Error loading health tip:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Generate a new health tip
  const generateNewTip = useCallback(async () => {
    try {
      setLoading(true);
      const tip = await healthTipsService.generateDailyHealthTip(user?.id);
      setCurrentTip(tip);
      return tip;
    } catch (error) {
      console.error('Error generating new health tip:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Schedule daily health tip notifications
  const scheduleDailyTips = useCallback(async () => {
    try {
      if (!isHealthTipsEnabled) {
        console.log('Health tips are disabled in settings');
        return false;
      }

      const notificationIds = await healthTipsService.scheduleDailyHealthTip();
      if (notificationIds.length > 0) {
        setIsScheduled(true);
        console.log(`Daily health tips scheduled successfully (${notificationIds.length} notifications)`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error scheduling daily health tips:', error);
      return false;
    }
  }, [isHealthTipsEnabled]);

  // Cancel daily health tip notifications
  const cancelDailyTips = useCallback(async () => {
    try {
      await healthTipsService.cancelDailyHealthTipNotifications();
      setIsScheduled(false);
      console.log('Daily health tips canceled');
      return true;
    } catch (error) {
      console.error('Error canceling daily health tips:', error);
      return false;
    }
  }, []);

  // Send immediate health tip notification
  const sendImmediateTip = useCallback(async () => {
    try {
      if (!isHealthTipsEnabled) {
        console.log('Health tips are disabled in settings');
        return null;
      }

      const tip = await healthTipsService.sendImmediateHealthTip(user?.id);
      if (tip) {
        setCurrentTip(tip);
        console.log('Immediate health tip sent');
      }
      return tip;
    } catch (error) {
      console.error('Error sending immediate health tip:', error);
      return null;
    }
  }, [isHealthTipsEnabled, user?.id]);

  // Get category emoji
  const getCategoryEmoji = useCallback((category: string) => {
    return healthTipsService.getCategoryEmoji(category);
  }, []);

  // Get category name
  const getCategoryName = useCallback((category: string) => {
    return healthTipsService.getCategoryName(category);
  }, []);

  return {
    currentTip,
    loading,
    isScheduled,
    isHealthTipsEnabled,
    generateNewTip,
    scheduleDailyTips,
    cancelDailyTips,
    sendImmediateTip,
    getCategoryEmoji,
    getCategoryName,
  };
};
