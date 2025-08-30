// Medicine Log Service for MediMind AI

import { supabase } from './supabase';
import { MedicineLog, Medicine } from '../types/database';
import { notificationService } from './notifications';

export interface TodayMedicine {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed' | 'due';
  takenTime?: string;
}

export class MedicineLogService {
  private static instance: MedicineLogService;

  private constructor() {}

  static getInstance(): MedicineLogService {
    if (!MedicineLogService.instance) {
      MedicineLogService.instance = new MedicineLogService();
    }
    return MedicineLogService.instance;
  }

  async getTodayMedicines(userId: string): Promise<TodayMedicine[]> {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = today.toTimeString().slice(0, 5); // HH:MM format
      
      // Get all active medicines for the user
      const { data: medicines, error: medicinesError } = await supabase
        .from('medicines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (medicinesError) {
        console.error('Error fetching medicines:', medicinesError);
        return [];
      }

      const todayMedicines: TodayMedicine[] = [];

      for (const medicine of medicines) {
        // Check if this medicine should be taken today
        if (medicine.days_of_week.includes(dayOfWeek)) {
          for (const time of medicine.times) {
            // Include ALL medicines scheduled for today, regardless of time
            // This ensures the checkbox stays visible until manually marked
            
            // Check if we already have a log for this medicine and time today
            const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
            const scheduledTimestamp = `${todayDate}T${time}:00.000Z`;
            
            // First, check for existing logs for this medicine today
            const { data: existingLogs } = await supabase
              .from('medicine_logs')
              .select('*')
              .eq('user_id', userId)
              .eq('medicine_id', medicine.id)
              .gte('created_at', today.toISOString().split('T')[0]);

            // Find a log that matches this time (normalized comparison)
            const normalizeTime = (timestamp: string) => timestamp.slice(11, 16); // Extract HH:MM
            const matchingLog = existingLogs?.find(log => normalizeTime(log.scheduled_time) === time);

            if (matchingLog) {
              todayMedicines.push({
                id: matchingLog.id,
                medicineId: medicine.id,
                medicineName: medicine.name,
                dosage: medicine.dosage,
                scheduledTime: time,
                status: matchingLog.status,
                takenTime: matchingLog.taken_time,
              });
            } else {
              // Create a new log entry for today
              const { data: newLog, error: createError } = await supabase
                .from('medicine_logs')
                .insert({
                  user_id: userId,
                  medicine_id: medicine.id,
                  scheduled_time: scheduledTimestamp,
                  status: 'pending',
                })
                .select()
                .single();

              if (!createError && newLog) {
                todayMedicines.push({
                  id: newLog.id,
                  medicineId: medicine.id,
                  medicineName: medicine.name,
                  dosage: medicine.dosage,
                  scheduledTime: time,
                  status: 'pending',
                });
              } else {
                console.error(`Failed to create log for ${medicine.name} at ${time}:`, createError);
              }
            }
          }
        }
      }

      // Sort by scheduled time
      return todayMedicines.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    } catch (error) {
      console.error('Error getting today medicines:', error);
      return [];
    }
  }

  async markMedicineAsTaken(logId: string): Promise<boolean> {
    try {
      console.log(`[MARK_AS_TAKEN] Marking log ${logId} as taken`);
      
      // Cancel any funny reminders for this log
      await notificationService.cancelFunnyChain(logId);
      console.log(`[MARK_AS_TAKEN] Cancelled funny reminders for log ${logId}`);
      
      const { error } = await supabase
        .from('medicine_logs')
        .update({
          status: 'taken',
          taken_time: new Date().toISOString(),
        })
        .eq('id', logId);

      if (error) {
        console.error('[MARK_AS_TAKEN] Error marking medicine as taken:', error);
        return false;
      }

      console.log(`[MARK_AS_TAKEN] Successfully marked log ${logId} as taken`);
      return true;
    } catch (error) {
      console.error('[MARK_AS_TAKEN] Error marking medicine as taken:', error);
      return false;
    }
  }

  async markMedicineAsSkipped(logId: string): Promise<boolean> {
    try {
      console.log(`[MARK_AS_SKIPPED] Marking log ${logId} as skipped`);
      
      // Cancel any funny reminders for this log
      await notificationService.cancelFunnyChain(logId);
      console.log(`[MARK_AS_SKIPPED] Cancelled funny reminders for log ${logId}`);
      
      const { error } = await supabase
        .from('medicine_logs')
        .update({
          status: 'skipped',
        })
        .eq('id', logId);

      if (error) {
        console.error('[MARK_AS_SKIPPED] Error marking medicine as skipped:', error);
        return false;
      }

      console.log(`[MARK_AS_SKIPPED] Successfully marked log ${logId} as skipped`);
      return true;
    } catch (error) {
      console.error('[MARK_AS_SKIPPED] Error marking medicine as skipped:', error);
      return false;
    }
  }

  async markAsTaken(logId: string): Promise<boolean> {
    try {
      console.log(`[MARK_AS_TAKEN] Marking log ${logId} as taken`);
      const { error } = await supabase
        .from('medicine_logs')
        .update({
          status: 'taken',
          taken_time: new Date().toISOString(),
        })
        .eq('id', logId);

      if (error) {
        console.error('[MARK_AS_TAKEN] Error marking medicine as taken:', error);
        return false;
      }

      // Cancel all funny reminders for this log
      await notificationService.cancelFunnyChain(logId);

      console.log(`[MARK_AS_TAKEN] Successfully marked log ${logId} as taken and cancelled funny reminders`);
      return true;
    } catch (error) {
      console.error('[MARK_AS_TAKEN] Error marking medicine as taken:', error);
      return false;
    }
  }

  async markAsSkipped(logId: string): Promise<boolean> {
    try {
      console.log(`[MARK_AS_SKIPPED] Marking log ${logId} as skipped`);
      const { error } = await supabase
        .from('medicine_logs')
        .update({
          status: 'skipped',
        })
        .eq('id', logId);

      if (error) {
        console.error('[MARK_AS_SKIPPED] Error marking medicine as skipped:', error);
        return false;
      }

      // Cancel all funny reminders for this log
      await notificationService.cancelFunnyChain(logId);

      console.log(`[MARK_AS_SKIPPED] Successfully marked log ${logId} as skipped and cancelled funny reminders`);
      return true;
    } catch (error) {
      console.error('[MARK_AS_SKIPPED] Error marking medicine as skipped:', error);
      return false;
    }
  }

  // NEW: Mark medicine as due when primary notification fires
  async markAsDue(logId: string): Promise<boolean> {
    try {
      console.log(`[MARK_AS_DUE] Marking log ${logId} as due`);
      const { error } = await supabase
        .from('medicine_logs')
        .update({
          status: 'due',
        })
        .eq('id', logId);

      if (error) {
        console.error('[MARK_AS_DUE] Error marking medicine as due:', error);
        return false;
      }

      console.log(`[MARK_AS_DUE] Successfully marked log ${logId} as due`);
      return true;
    } catch (error) {
      console.error('[MARK_AS_DUE] Error marking medicine as due:', error);
      return false;
    }
  }

  // NEW: Get a specific log by ID
  async getLog(logId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('medicine_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (error) {
        console.error('[GET_LOG] Error getting log:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[GET_LOG] Error getting log:', error);
      return null;
    }
  }

  async cancelFunnyReminders(logId: string): Promise<void> {
    try {
      console.log(`[CANCEL_FUNNY] Cancelling funny reminders for log ${logId}`);
      // This will be handled by the notification service
      await notificationService.cancelFunnyChain(logId);
    } catch (error) {
      console.error('[CANCEL_FUNNY] Error in cancelFunnyReminders:', error);
    }
  }

  async getPendingMedicines(userId: string): Promise<TodayMedicine[]> {
    try {
      const today = new Date();
      const { data: logs, error } = await supabase
        .from('medicine_logs')
        .select(`
          *,
          medicines (
            name,
            dosage
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('created_at', today.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching pending medicines:', error);
        return [];
      }

      return logs.map(log => ({
        id: log.id,
        medicineId: log.medicine_id,
        medicineName: log.medicines.name,
        dosage: log.medicines.dosage,
        scheduledTime: log.scheduled_time,
        status: log.status,
        takenTime: log.taken_time,
      }));
    } catch (error) {
      console.error('Error getting pending medicines:', error);
      return [];
    }
  }

  async getPendingMedicinesByMedicineId(medicineId: string, timeString: string): Promise<TodayMedicine[]> {
    try {
      const today = new Date();
      
      // Normalize time strings for comparison (HH:mm format)
      const normalizeTime = (time: string) => time.slice(0, 5);
      const normalizedTimeString = normalizeTime(timeString);
      
      console.log(`[LOOKUP] Looking for medicine ${medicineId} at time ${timeString} (normalized: ${normalizedTimeString})`);
      
      const { data: logs, error } = await supabase
        .from('medicine_logs')
        .select(`
          *,
          medicines (
            name,
            dosage
          )
        `)
        .eq('medicine_id', medicineId)
        .in('status', ['pending', 'due'])
        .gte('created_at', today.toISOString().split('T')[0]);

      if (error) {
        console.error('[LOOKUP] Error fetching pending medicines by medicine ID:', error);
        return [];
      }

      // Filter by normalized time
      const matchingLogs = logs.filter(log => {
        // CRITICAL FIX: Extract HH:MM from full timestamp
        const logTime = log.scheduled_time.slice(11, 16); // Extract HH:MM from "2025-01-27T19:02:00.000Z"
        const matches = logTime === normalizedTimeString;
        console.log(`[LOOKUP] Comparing ${logTime} with ${normalizedTimeString}: ${matches}`);
        return matches;
      });

      console.log(`[LOOKUP] Found ${matchingLogs.length} matching logs for ${medicineId} at ${timeString}`);

      return matchingLogs.map(log => ({
        id: log.id,
        medicineId: log.medicine_id,
        medicineName: log.medicines.name,
        dosage: log.medicines.dosage,
        scheduledTime: log.scheduled_time,
        status: log.status,
        takenTime: log.taken_time,
      }));
    } catch (error) {
      console.error('[LOOKUP] Error getting pending medicines by medicine ID:', error);
      return [];
    }
  }

  // Clean up old logs when medicine is edited
  async cleanupOldLogsForMedicine(medicineId: string, userId: string): Promise<void> {
    try {
      console.log(`[CLEANUP] Cleaning up old logs for medicine ${medicineId}`);
      
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      
      // Delete all logs for this medicine from today that are still pending
      const { error } = await supabase
        .from('medicine_logs')
        .delete()
        .eq('medicine_id', medicineId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('created_at', todayDate);
      
      if (error) {
        console.error('[CLEANUP] Error cleaning up old logs:', error);
      } else {
        console.log(`[CLEANUP] Successfully cleaned up old logs for medicine ${medicineId}`);
      }
    } catch (error) {
      console.error('[CLEANUP] Error in cleanupOldLogsForMedicine:', error);
    }
  }
}

export const medicineLogService = MedicineLogService.getInstance();
