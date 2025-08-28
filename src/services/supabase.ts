// Supabase Service for MediMind AI

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if environment variables are properly configured
const isConfigured = supabaseUrl !== 'https://your-project.supabase.co' && 
                    supabaseAnonKey !== 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Add configuration check
export const checkSupabaseConfig = () => {
  if (!isConfigured) {
    console.warn('⚠️ Supabase is not properly configured. Please set up your .env file with valid Supabase credentials.');
    return false;
  }
  return true;
};

// Authentication Service
export const authService = {
  async signUp(email: string, password: string, fullName?: string) {
    if (!checkSupabaseConfig()) {
      return { 
        data: null, 
        error: { 
          message: 'Supabase is not configured. Please set up your environment variables.' 
        } 
      };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    if (!checkSupabaseConfig()) {
      return { 
        data: null, 
        error: { 
          message: 'Supabase is not configured. Please set up your environment variables.' 
        } 
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  },
};

// User Service
export const userService = {
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // If table doesn't exist or user not found, create a default profile
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('User profile not found, creating default profile...');
          return await this.createUserProfile(userId);
        }
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return { data: null, error };
    }
  },

  async createUserProfile(userId: string) {
    try {
      // Get current user to get email
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { 
          data: null, 
          error: { message: 'Unable to get current user information' } 
        };
      }

      const defaultProfile = {
        id: userId,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        phone_number: '',
        date_of_birth: '',
        emergency_contact: '',
        emergency_phone: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        // Return the default profile even if insert fails
        return { data: defaultProfile, error: null };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      return { data: null, error };
    }
  },

  async updateUserProfile(userId: string, updates: any) {
    try {
      // First check if user profile exists
      const { data: existingProfile, error: getError } = await this.getUserProfile(userId);
      
      if (getError && getError.code !== 'PGRST116') {
        return { data: null, error: getError };
      }

      // If profile doesn't exist, create it first
      if (!existingProfile) {
        await this.createUserProfile(userId);
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { data: null, error };
    }
  },
};

// Medicine Service
export const medicineService = {
  async getMedicines(userId: string) {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getMedicine(medicineId: string) {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('id', medicineId)
      .single();
    return { data, error };
  },

  async createMedicine(medicineData: any) {
    const { data, error } = await supabase
      .from('medicines')
      .insert(medicineData)
      .select()
      .single();
    return { data, error };
  },

  async updateMedicine(medicineId: string, updates: any) {
    const { data, error } = await supabase
      .from('medicines')
      .update(updates)
      .eq('id', medicineId)
      .select()
      .single();
    return { data, error };
  },

  async deleteMedicine(medicineId: string) {
    const { error } = await supabase
      .from('medicines')
      .delete()
      .eq('id', medicineId);
    return { error };
  },
};

// Medicine Log Service
export const medicineLogService = {
  async getMedicineLogs(userId: string, date?: string) {
    let query = supabase
      .from('medicine_logs')
      .select('*, medicines(*)')
      .eq('user_id', userId);
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  async createMedicineLog(logData: any) {
    const { data, error } = await supabase
      .from('medicine_logs')
      .insert(logData)
      .select()
      .single();
    return { data, error };
  },

  async updateMedicineLog(logId: string, updates: any) {
    const { data, error } = await supabase
      .from('medicine_logs')
      .update(updates)
      .eq('id', logId)
      .select()
      .single();
    return { data, error };
  },
};

// Chat History Service
export const chatHistoryService = {
  async getUserChatHistory(userId: string) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    return { data, error };
  },

  async createChatHistory(userId: string) {
    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        messages: [],
      })
      .select()
      .single();
    return { data, error };
  },

  async updateChatHistory(chatId: string, updates: Partial<ChatHistory>) {
    const { data, error } = await supabase
      .from('chat_history')
      .update(updates)
      .eq('id', chatId)
      .select()
      .single();
    return { data, error };
  },

  async deleteChatHistory(chatId: string) {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('id', chatId);
    return { error };
  },
};

// Medicine Info Cache Service
export const medicineInfoCacheService = {
  async getCachedInfo(medicineName: string) {
    const { data, error } = await supabase
      .from('medicine_info_cache')
      .select('*')
      .eq('medicine_name', medicineName.toLowerCase())
      .single();
    return { data, error };
  },

  async cacheMedicineInfo(cacheData: any) {
    const { data, error } = await supabase
      .from('medicine_info_cache')
      .upsert(cacheData)
      .select()
      .single();
    return { data, error };
  },

  async searchMedicineInfo(query: string) {
    const { data, error } = await supabase
      .from('medicine_info_cache')
      .select('*')
      .ilike('medicine_name', `%${query}%`)
      .limit(10);
    return { data, error };
  },
};

// Storage Test Service
export const storageTestService = {
  async testStorageConnection() {
    try {
      // Test basic connection
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: 'Authentication failed', details: authError };
      }

      // Test storage bucket access
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.error('Bucket list error:', bucketError);
        return { success: false, error: 'Cannot access storage buckets', details: bucketError };
      }

      console.log('Available buckets:', buckets);

      // Check if alarm-ringtones bucket exists
      const alarmRingtonesBucket = buckets.find(bucket => bucket.name === 'alarm-ringtones');
      if (!alarmRingtonesBucket) {
        return { 
          success: false, 
          error: 'alarm-ringtones bucket not found', 
          details: 'Please create the storage bucket first',
          buckets: buckets.map(b => b.name)
        };
      }

      return { 
        success: true, 
        message: 'Storage connection successful',
        user: user?.email,
        bucket: alarmRingtonesBucket
      };
    } catch (error: any) {
      console.error('Storage test error:', error);
      return { success: false, error: 'Storage test failed', details: error };
    }
  },

  async testFileUpload() {
    try {
      // Create a small test file
      const testContent = 'test file content';
      const testFileName = `test-${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('alarm-ringtones')
        .upload(testFileName, testContent, {
          contentType: 'text/plain',
          upsert: false
        });

      if (error) {
        console.error('Upload test error:', error);
        return { success: false, error: 'Upload test failed', details: error };
      }

      // Clean up test file
      await supabase.storage
        .from('alarm-ringtones')
        .remove([testFileName]);

      return { success: true, message: 'Upload test successful', data };
    } catch (error: any) {
      console.error('Upload test error:', error);
      return { success: false, error: 'Upload test failed', details: error };
    }
  }
};
