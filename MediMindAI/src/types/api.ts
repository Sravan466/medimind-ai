// API Types for MediMind AI

// Medicine Information Response
export interface MedicineInfoResponse {
  medicine: string;
  uses: string;
  side_effects: string;
  description: string;
  dosage_info?: string;
  interactions?: string;
}

// AI Chat Response
export interface ChatResponse {
  message: string;
  response: string;
  timestamp: string;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface MedicineFormData {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  daysOfWeek: number[];
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface ProfileFormData {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

// Authentication Data
export interface AuthData {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// Notification Data
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledTime?: Date;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response Wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}

// Success Response
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Medicine Schedule
export interface MedicineSchedule {
  id: string;
  medicineId: string;
  medicineName: string;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  isOverdue: boolean;
}

// Daily Medicine Summary
export interface DailyMedicineSummary {
  date: string;
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  pending: number;
  medicines: MedicineSchedule[];
}

// Medicine Statistics
export interface MedicineStatistics {
  totalMedicines: number;
  activeMedicines: number;
  todayScheduled: number;
  todayTaken: number;
  todayMissed: number;
  adherenceRate: number;
  streakDays: number;
}

// Search Results
export interface SearchResult<T> {
  query: string;
  results: T[];
  total: number;
  page: number;
  limit: number;
}

// Filter Options
export interface FilterOptions {
  status?: string;
  frequency?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// Sort Options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Export Data
export interface ExportData {
  medicines: any[];
  logs: any[];
  format: 'csv' | 'json' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
}
