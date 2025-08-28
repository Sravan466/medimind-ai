import { supabase, medicineService, medicineLogService, chatHistoryService } from './supabase';

export interface AccountDeletionResult {
  success: boolean;
  error?: string;
  deletedData?: {
    medicines: number;
    medicineLogs: number;
    chatHistory: number;
    userProfile: boolean;
  };
}

export const accountDeletionService = {
  /**
   * Delete all user data and account
   */
  async deleteAccount(userId: string, password: string): Promise<AccountDeletionResult> {
    try {
      // First verify password
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.email) {
        throw new Error('User email not available');
      }

      // Verify password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: password,
      });

      if (signInError) {
        throw new Error('Password verification failed');
      }

      // Track deletion progress
      const deletionStats = {
        medicines: 0,
        medicineLogs: 0,
        chatHistory: 0,
        userProfile: false,
      };

      // 1. Delete all medicines
      const { data: medicines } = await medicineService.getMedicines(userId);
      if (medicines) {
        for (const medicine of medicines) {
          await medicineService.deleteMedicine(medicine.id);
        }
        deletionStats.medicines = medicines.length;
      }

      // 2. Delete all medicine logs
      const { data: logs } = await medicineLogService.getMedicineLogs(userId);
      if (logs) {
        for (const log of logs) {
          await supabase
            .from('medicine_logs')
            .delete()
            .eq('id', log.id);
        }
        deletionStats.medicineLogs = logs.length;
      }

      // 3. Delete chat history
      const { data: chatHistory } = await chatHistoryService.getUserChatHistory(userId);
      if (chatHistory) {
        await chatHistoryService.deleteChatHistory(chatHistory.id);
        deletionStats.chatHistory = 1;
      }

      // 4. Delete user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (!profileError) {
        deletionStats.userProfile = true;
      }

      // 5. Finally, delete the auth user (this will cascade delete related data)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        // If admin deletion fails, try user deletion
        const { error: userDeleteError } = await supabase.auth.deleteUser();
        if (userDeleteError) {
          throw new Error('Failed to delete user account');
        }
      }

      return {
        success: true,
        deletedData: deletionStats,
      };

    } catch (error: any) {
      console.error('Account deletion error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete account',
      };
    }
  },

  /**
   * Get summary of data that will be deleted
   */
  async getAccountDeletionSummary(userId: string) {
    try {
      const [medicines, logs, chatHistory, profile] = await Promise.all([
        medicineService.getMedicines(userId),
        medicineLogService.getMedicineLogs(userId),
        chatHistoryService.getUserChatHistory(userId),
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
      ]);

      return {
        medicines: medicines.data?.length || 0,
        medicineLogs: logs.data?.length || 0,
        chatHistory: chatHistory.data ? 1 : 0,
        hasProfile: !!profile.data,
        totalItems: (medicines.data?.length || 0) + (logs.data?.length || 0) + (chatHistory.data ? 1 : 0),
      };
    } catch (error) {
      console.error('Error getting deletion summary:', error);
      return {
        medicines: 0,
        medicineLogs: 0,
        chatHistory: 0,
        hasProfile: false,
        totalItems: 0,
      };
    }
  },

  /**
   * Export user data before deletion
   */
  async exportDataBeforeDeletion(userId: string) {
    try {
      const { exportUserData } = await import('../utils/dataExport');
      const { settings } = await import('../hooks/useSettings');
      
      // Get current settings (this is a simplified approach)
      const defaultSettings = {
        notifications_enabled: true,
        reminder_time: '09:00',
        theme: 'light' as const,
        privacy_mode: false,
        data_sharing: true,
        language: 'en',
        accessibility: {
          large_text: false,
          high_contrast: false,
          screen_reader: false,
        },
      };

      return await exportUserData(userId, defaultSettings);
    } catch (error) {
      console.error('Error exporting data before deletion:', error);
      throw error;
    }
  },
};
