// Database Types for MediMind AI

// User Table
export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at: string;
  updated_at: string;
}

// Medicine Table
export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  days_of_week: number[];
  days?: string[]; // For backward compatibility
  start_date: string;
  end_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Medicine Log Table
export interface MedicineLog {
  id: string;
  user_id: string;
  medicine_id: string;
  scheduled_time: string;
  taken_time?: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed' | 'due';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Chat History Table
export interface ChatHistory {
  id: string;
  user_id: string;
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  created_at: string;
}

// Medicine Info Cache Table
export interface MedicineInfoCache {
  id: string;
  medicine_name: string;
  uses: string;
  side_effects: string;
  description: string;
  dosage_info?: string;
  interactions?: string;
  created_at: string;
  updated_at: string;
}

// Database Schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      medicines: {
        Row: Medicine;
        Insert: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Medicine, 'id' | 'created_at' | 'updated_at'>>;
      };
      medicine_logs: {
        Row: MedicineLog;
        Insert: Omit<MedicineLog, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MedicineLog, 'id' | 'created_at' | 'updated_at'>>;
      };
      chat_history: {
        Row: ChatHistory;
        Insert: Omit<ChatHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<ChatHistory, 'id' | 'created_at'>>;
      };
      medicine_info_cache: {
        Row: MedicineInfoCache;
        Insert: Omit<MedicineInfoCache, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MedicineInfoCache, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper Types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific Table Types
export type UserRow = Tables<'users'>;
export type UserInsert = Inserts<'users'>;
export type UserUpdate = Updates<'users'>;

export type MedicineRow = Tables<'medicines'>;
export type MedicineInsert = Inserts<'medicines'>;
export type MedicineUpdate = Updates<'medicines'>;

export type MedicineLogRow = Tables<'medicine_logs'>;
export type MedicineLogInsert = Inserts<'medicine_logs'>;
export type MedicineLogUpdate = Updates<'medicine_logs'>;

export type ChatHistoryRow = Tables<'chat_history'>;
export type ChatHistoryInsert = Inserts<'chat_history'>;
export type ChatHistoryUpdate = Updates<'chat_history'>;

export type MedicineInfoCacheRow = Tables<'medicine_info_cache'>;
export type MedicineInfoCacheInsert = Inserts<'medicine_info_cache'>;
export type MedicineInfoCacheUpdate = Updates<'medicine_info_cache'>;
