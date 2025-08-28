// Navigation Types for MediMind AI

import { Medicine } from './database';

// Root Stack Parameters
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'medicine-details': { medicineId: string };
  'add-medicine': undefined;
  'edit-medicine': { medicine: Medicine };
  'medicine-info': { medicineName: string };
  'profile-settings': undefined;
  'notification-settings': undefined;
  'about': undefined;
  'help': undefined;
  'privacy-policy': undefined;
  'terms-of-service': undefined;
};

// Auth Stack Parameters
export type AuthStackParamList = {
  'login': undefined;
  'register': undefined;
  'forgot-password': undefined;
};

// Tab Stack Parameters
export type TabStackParamList = {
  'index': undefined;
  'medicines': undefined;
  'info': undefined;
  'chat': undefined;
  'profile': undefined;
};

// Medicine Stack Parameters
export type MedicineStackParamList = {
  'list': undefined;
  'add': undefined;
  'details': { medicineId: string };
  'edit': { medicine: Medicine };
  'schedule': { medicineId: string };
  'history': { medicineId: string };
};

// Profile Stack Parameters
export type ProfileStackParamList = {
  'main': undefined;
  'settings': undefined;
  'edit-profile': undefined;
  'change-password': undefined;
  'notifications': undefined;
  'privacy': undefined;
  'about': undefined;
  'help': undefined;
  'logout': undefined;
};

// Chat Stack Parameters
export type ChatStackParamList = {
  'main': undefined;
  'history': undefined;
  'settings': undefined;
};

// Info Stack Parameters
export type InfoStackParamList = {
  'main': undefined;
  'search': undefined;
  'medicine-info': { medicineName: string };
  'favorites': undefined;
  'recent': undefined;
};

// Modal Parameters
export type ModalParamList = {
  'medicine-reminder': { medicineId: string; scheduledTime: string };
  'medicine-taken': { medicineId: string; logId: string };
  'medicine-skipped': { medicineId: string; logId: string };
  'add-note': { medicineId: string; logId: string };
  'confirm-delete': { medicineId: string; medicineName: string };
  'confirm-logout': undefined;
  'error': { title: string; message: string };
  'success': { title: string; message: string };
  'loading': { message: string };
};

// Navigation Props
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: {
    navigate: (screen: T, params?: RootStackParamList[T]) => void;
    goBack: () => void;
    push: (screen: T, params?: RootStackParamList[T]) => void;
    pop: () => void;
    popToTop: () => void;
    reset: (state: any) => void;
    setOptions: (options: any) => void;
  };
  route: {
    params: RootStackParamList[T];
    name: T;
  };
};

// Tab Navigation Props
export type TabNavigationProps<T extends keyof TabStackParamList> = {
  navigation: {
    navigate: (screen: T, params?: TabStackParamList[T]) => void;
    goBack: () => void;
    push: (screen: T, params?: TabStackParamList[T]) => void;
    pop: () => void;
    popToTop: () => void;
    reset: (state: any) => void;
    setOptions: (options: any) => void;
  };
  route: {
    params: TabStackParamList[T];
    name: T;
  };
};

// Route Names
export const ROUTES = {
  // Auth Routes
  LOGIN: 'login' as const,
  REGISTER: 'register' as const,
  FORGOT_PASSWORD: 'forgot-password' as const,
  
  // Tab Routes
  HOME: 'index' as const,
  MEDICINES: 'medicines' as const,
  INFO: 'info' as const,
  CHAT: 'chat' as const,
  PROFILE: 'profile' as const,
  
  // Medicine Routes
  MEDICINE_DETAILS: 'medicine-details' as const,
  ADD_MEDICINE: 'add-medicine' as const,
  EDIT_MEDICINE: 'edit-medicine' as const,
  MEDICINE_INFO: 'medicine-info' as const,
  
  // Profile Routes
  PROFILE_SETTINGS: 'profile-settings' as const,
  NOTIFICATION_SETTINGS: 'notification-settings' as const,
  ABOUT: 'about' as const,
  HELP: 'help' as const,
  PRIVACY_POLICY: 'privacy-policy' as const,
  TERMS_OF_SERVICE: 'terms-of-service' as const,
} as const;

// Navigation Options
export interface NavigationOptions {
  title?: string;
  headerShown?: boolean;
  headerTitle?: string;
  headerTitleStyle?: any;
  headerStyle?: any;
  headerTintColor?: string;
  headerBackTitle?: string;
  headerBackTitleVisible?: boolean;
  headerLeft?: () => React.ReactNode;
  headerRight?: () => React.ReactNode;
  tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  tabBarLabel?: string;
  tabBarBadge?: string | number;
  tabBarBadgeStyle?: any;
  tabBarStyle?: any;
  tabBarActiveTintColor?: string;
  tabBarInactiveTintColor?: string;
  gestureEnabled?: boolean;
  animationEnabled?: boolean;
  presentation?: 'modal' | 'card' | 'transparentModal';
}
