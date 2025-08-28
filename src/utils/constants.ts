// Constants for MediMind AI

// App Configuration
export const APP_CONFIG = {
  NAME: 'MediMind AI',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered Medicine Reminder & Info App',
  AI_ASSISTANT: {
    NAME: 'Cura',
    TAGLINE: 'Guiding your health, every step',
  },
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  REQUIRED_FIELD: 'This field is required.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  MEDICINE_NOT_FOUND: 'Medicine not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Account created successfully!',
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PASSWORD_RESET_SENT: 'Password reset email sent.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  MEDICINE_ADDED: 'Medicine added successfully.',
  MEDICINE_UPDATED: 'Medicine updated successfully.',
  MEDICINE_DELETED: 'Medicine deleted successfully.',
  MEDICINE_TAKEN: 'Medicine marked as taken.',
  MEDICINE_SKIPPED: 'Medicine marked as skipped.',
} as const;

// Days of the Week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

// Medicine Frequencies
export const MEDICINE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: 'Three Times Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As Needed' },
  { value: 'custom', label: 'Custom' },
] as const;

// Medicine Status
export const MEDICINE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
} as const;

// Medicine Log Status
export const MEDICINE_LOG_STATUS = {
  PENDING: 'pending',
  TAKEN: 'taken',
  SKIPPED: 'skipped',
  MISSED: 'missed',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  MEDICINE_REMINDER: 'medicine_reminder',
  MEDICINE_OVERDUE: 'medicine_overdue',
  MEDICINE_INFO: 'medicine_info',
  GENERAL: 'general',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  DEEPSEEK: 'https://api.deepseek.com/v1/chat/completions',
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PROFILE: 'user_profile',
  MEDICINE_CACHE: 'medicine_cache',
  NOTIFICATION_SETTINGS: 'notification_settings',
  THEME_PREFERENCE: 'theme_preference',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Time Formats
export const TIME_FORMATS = {
  DISPLAY: 'HH:mm',
  DATABASE: 'HH:mm:ss',
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE_ONLY: 'YYYY-MM-DD',
} as const;

// Medicine Dosage Units
export const DOSAGE_UNITS = [
  'mg',
  'g',
  'ml',
  'tablet',
  'capsule',
  'drop',
  'spray',
  'injection',
  'patch',
  'suppository',
] as const;

// Medicine Routes
export const MEDICINE_ROUTES = [
  'oral',
  'sublingual',
  'topical',
  'inhalation',
  'injection',
  'rectal',
  'vaginal',
  'nasal',
  'ophthalmic',
  'otic',
] as const;
