// Health Tips Service for MediMind AI

import { aiService } from './ai';
import { notificationService } from './notifications';
import * as Notifications from 'expo-notifications';

export interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: 'nutrition' | 'exercise' | 'mental_health' | 'medication' | 'general';
  timestamp: Date;
}

export interface HealthTipNotificationData {
  tipId: string;
  type: 'health_tip';
  [key: string]: unknown;
}

export class HealthTipsService {
  private static instance: HealthTipsService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): HealthTipsService {
    if (!HealthTipsService.instance) {
      HealthTipsService.instance = new HealthTipsService();
    }
    return HealthTipsService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Initialize notification service
      await notificationService.initialize();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing health tips service:', error);
      return false;
    }
  }

  async generateDailyHealthTip(userId?: string): Promise<HealthTip | null> {
    try {
      const prompt = this.buildHealthTipPrompt(userId);
      
      // Use the AI service to generate a health tip
      const response = await aiService.getChatResponse(prompt, userId || '');
      
      if (!response) {
        throw new Error('Failed to generate health tip');
      }

      // Parse the response into a structured health tip
      const healthTip = this.parseHealthTipResponse(response);
      
      return healthTip;
    } catch (error) {
      console.error('Error generating health tip:', error);
      return this.getFallbackHealthTip();
    }
  }

  private buildHealthTipPrompt(userId?: string): string {
    const categories = ['nutrition', 'exercise', 'mental_health', 'medication', 'general'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    let prompt = `Generate a daily health tip in the following JSON format:

{
  "title": "Short, engaging title (max 50 characters)",
  "content": "Practical health tip with actionable advice (max 200 characters)",
  "category": "${randomCategory}"
}

Requirements:
- Make it practical and actionable
- Keep it simple and easy to understand
- Focus on general wellness and prevention
- Avoid specific medical advice
- Make it encouraging and positive
- Keep content under 200 characters for notification display

Category focus:
- nutrition: healthy eating, hydration, meal planning
- exercise: physical activity, movement, fitness
- mental_health: stress management, mindfulness, emotional wellness
- medication: medicine safety, adherence, storage
- general: overall wellness, lifestyle, preventive care

Please respond with only the JSON object.`;

    return prompt;
  }

  private parseHealthTipResponse(response: string): HealthTip {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: `tip_${Date.now()}`,
          title: parsed.title || 'Daily Health Tip',
          content: parsed.content || 'Stay healthy and take care of yourself!',
          category: parsed.category || 'general',
          timestamp: new Date(),
        };
      }

      // If no JSON found, create a structured tip from the text
      return {
        id: `tip_${Date.now()}`,
        title: 'Daily Health Tip',
        content: response.substring(0, 200),
        category: 'general',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error parsing health tip response:', error);
      return this.getFallbackHealthTip();
    }
  }

  private getFallbackHealthTip(): HealthTip {
    const fallbackTips = [
      {
        title: 'Stay Hydrated',
        content: 'Drink 8 glasses of water daily to maintain good health and energy levels.',
        category: 'nutrition' as const,
      },
      {
        title: 'Take a Walk',
        content: 'A 30-minute daily walk can improve your mood and overall health.',
        category: 'exercise' as const,
      },
      {
        title: 'Practice Gratitude',
        content: 'Take a moment each day to appreciate the good things in your life.',
        category: 'mental_health' as const,
      },
      {
        title: 'Medicine Safety',
        content: 'Always store your medicines in a cool, dry place away from children.',
        category: 'medication' as const,
      },
      {
        title: 'Get Enough Sleep',
        content: 'Aim for 7-9 hours of quality sleep each night for optimal health.',
        category: 'general' as const,
      },
    ];

    const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
    
    return {
      id: `tip_${Date.now()}`,
      title: randomTip.title,
      content: randomTip.content,
      category: randomTip.category,
      timestamp: new Date(),
    };
  }

  async scheduleDailyHealthTip(): Promise<string[]> {
    try {
      // Cancel any existing daily health tip notifications
      await this.cancelDailyHealthTipNotifications();

      const notificationIds: string[] = [];
      
      // Generate 2-3 random times between 5 AM and 12 AM (midnight)
      const numNotifications = Math.floor(Math.random() * 2) + 2; // 2 or 3 notifications
      const times = this.generateRandomTimes(numNotifications);

      for (const time of times) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Daily Health Tip',
            body: 'Your personalized health tip is ready! Tap to view.',
            data: {
              tipId: 'daily_tip',
              type: 'health_tip',
            } as HealthTipNotificationData,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            hour: time.hour,
            minute: time.minute,
            repeats: true,
          } as any,
        });

        notificationIds.push(notificationId);
        console.log('Daily health tip notification scheduled for', `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling daily health tips:', error);
      return [];
    }
  }

  private generateRandomTimes(count: number): Array<{hour: number, minute: number}> {
    const times: Array<{hour: number, minute: number}> = [];
    const usedMinutes: Set<number> = new Set();

    // Generate times between 5 AM (5) and 12 AM (0) - actually 24 hours, but we'll use 5-23 for better distribution
    const startHour = 5;
    const endHour = 23;

    for (let i = 0; i < count; i++) {
      let hour: number;
      let minute: number;
      let minuteKey: number;

      do {
        hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
        minute = Math.floor(Math.random() * 60);
        minuteKey = hour * 60 + minute;
      } while (usedMinutes.has(minuteKey));

      usedMinutes.add(minuteKey);
      times.push({ hour, minute });
    }

    // Sort times chronologically
    return times.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
  }

  async cancelDailyHealthTipNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const data = notification.content.data as HealthTipNotificationData;
        if (data?.type === 'health_tip') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling daily health tip notifications:', error);
    }
  }

  async sendImmediateHealthTip(userId?: string): Promise<HealthTip | null> {
    try {
      console.log('[HEALTHTIP_SEND] Starting immediate health tip generation for userId:', userId);
      
      const healthTip = await this.generateDailyHealthTip(userId);
      
      if (!healthTip) {
        console.log('[HEALTHTIP_SEND] Failed to generate health tip');
        return null;
      }

      console.log('[HEALTHTIP_SEND] Generated health tip:', healthTip.title);

      // Send immediate notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: healthTip.title,
          body: healthTip.content,
          data: {
            tipId: healthTip.id,
            type: 'health_tip',
          } as HealthTipNotificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          seconds: 1,
        } as any,
      });

      console.log('[HEALTHTIP_SEND] Successfully scheduled health tip notification:', notificationId);
      return healthTip;
    } catch (error) {
      console.error('[HEALTHTIP_SEND] Error sending immediate health tip:', error);
      return null;
    }
  }

  getCategoryEmoji(category: string): string {
    switch (category) {
      case 'nutrition':
        return '🥗';
      case 'exercise':
        return '🏃‍♂️';
      case 'mental_health':
        return '🧘‍♀️';
      case 'medication':
        return '💊';
      case 'general':
        return '💪';
      default:
        return '💡';
    }
  }

  getCategoryName(category: string): string {
    switch (category) {
      case 'nutrition':
        return 'Nutrition';
      case 'exercise':
        return 'Exercise';
      case 'mental_health':
        return 'Mental Health';
      case 'medication':
        return 'Medication';
      case 'general':
        return 'General Wellness';
      default:
        return 'Health Tip';
    }
  }

  // Handle notification response - generate and send actual health tip
  async handleDailyHealthTipNotification(userId?: string): Promise<HealthTip | null> {
    try {
      // Generate a new health tip
      const healthTip = await this.generateDailyHealthTip(userId);
      
      if (!healthTip) {
        return null;
      }

      // Send the actual health tip notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: healthTip.title,
          body: healthTip.content,
          data: {
            tipId: healthTip.id,
            type: 'health_tip',
          } as HealthTipNotificationData,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          seconds: 1, // Send immediately
        } as any,
      });

      return healthTip;
    } catch (error) {
      console.error('Error handling daily health tip notification:', error);
      return null;
    }
  }
}

export const healthTipsService = HealthTipsService.getInstance();
