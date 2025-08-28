// Hook for managing today's medicines

import { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { medicineLogService, TodayMedicine } from '../services/medicineLogService';
import { notificationService } from '../services/notifications';

export const useTodayMedicines = () => {
  const { user } = useAuthContext();
  const [todayMedicines, setTodayMedicines] = useState<TodayMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTodayMedicines = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('[TODAY_MEDICINES] Loading medicines for user:', user.id);
      const medicines = await medicineLogService.getTodayMedicines(user.id);
      console.log('[TODAY_MEDICINES] Loaded medicines:', medicines.length);
      
      // Filter to show only pending and due medicines in the main list
      const activeMedicines = medicines.filter(med => med.status === 'pending' || med.status === 'due');
      console.log('[TODAY_MEDICINES] Active medicines (pending/due):', activeMedicines.length);
      
      setTodayMedicines(medicines); // Keep all medicines for completed summary
    } catch (error) {
      console.error('[TODAY_MEDICINES] Error loading today medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (logId: string) => {
    try {
      console.log(`[TAKEN] Marking medicine as taken (logId: ${logId})`);
      const success = await medicineLogService.markMedicineAsTaken(logId);
      if (success) {
        // Cancel any funny reminders for this medicine
        await notificationService.cancelFunnyReminders(logId);
        console.log(`[TAKEN] Cancelled funny reminders for logId: ${logId}`);
        
        // Update local state
        setTodayMedicines(prev => 
          prev.map(medicine => 
            medicine.id === logId 
              ? { ...medicine, status: 'taken', takenTime: new Date().toISOString() }
              : medicine
          )
        );
      }
      return success;
    } catch (error) {
      console.error('[TAKEN] Error marking medicine as taken:', error);
      return false;
    }
  };

  const markAsSkipped = async (logId: string) => {
    try {
      console.log(`[SKIPPED] Marking medicine as skipped (logId: ${logId})`);
      const success = await medicineLogService.markMedicineAsSkipped(logId);
      if (success) {
        // Cancel any funny reminders for this medicine
        await notificationService.cancelFunnyReminders(logId);
        console.log(`[SKIPPED] Cancelled funny reminders for logId: ${logId}`);
        
        // Update local state
        setTodayMedicines(prev => 
          prev.map(medicine => 
            medicine.id === logId 
              ? { ...medicine, status: 'skipped' }
              : medicine
          )
        );
      }
      return success;
    } catch (error) {
      console.error('[SKIPPED] Error marking medicine as skipped:', error);
      return false;
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadTodayMedicines();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTodayMedicines();
  }, [user]);

  return {
    todayMedicines,
    loading,
    refreshing,
    markAsTaken,
    markAsSkipped,
    refresh,
  };
};
