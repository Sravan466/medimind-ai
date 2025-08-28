// Authentication Hook for MediMind AI

import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { authService, userService } from '../services/supabase';
import { User as UserProfile } from '../types/database';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get current session
      const { session, error: sessionError } = await authService.getCurrentSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: ERROR_MESSAGES.NETWORK_ERROR 
        }));
        return;
      }

      if (session?.user) {
        // Get user profile
        const { data: profile, error: profileError } = await userService.getUserProfile(session.user.id);
        
        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "not found" - user profile doesn't exist yet
          console.error('Profile error:', profileError);
        }

        setState({
          user: session.user,
          session,
          profile: profile || null,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: ERROR_MESSAGES.NETWORK_ERROR 
      }));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await authService.signIn(email, password);

      if (error) {
        const errorMessage = error.message === 'Invalid login credentials'
          ? ERROR_MESSAGES.INVALID_CREDENTIALS
          : error.message;
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage 
        }));
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        // Get user profile
        const { data: profile } = await userService.getUserProfile(data.user.id);
        
        setState({
          user: data.user,
          session: data.session,
          profile: profile || null,
          loading: false,
          error: null,
        });
        return { success: true };
      }

      return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR };
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await authService.signUp(email, password, fullName);

      if (error) {
        const errorMessage = error.message.includes('already registered')
          ? ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
          : error.message;
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage 
        }));
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        // Create user profile
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName || null,
        };

        const { error: profileError } = await userService.updateUserProfile(data.user.id, profileData);
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        setState({
          user: data.user,
          session: data.session,
          profile: profileData as UserProfile,
          loading: false,
          error: null,
        });
        return { success: true };
      }

      return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR };
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await authService.signOut();

      if (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return { success: false, error: error.message };
      }

      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await authService.resetPassword(email);

      if (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      if (!state.user) {
        return { success: false, error: 'User not authenticated' };
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await authService.updatePassword(newPassword);

      if (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!state.user) {
        return { success: false, error: 'User not authenticated' };
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await userService.updateUserProfile(state.user.id, updates);

      if (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return { success: false, error: error.message };
      }

      setState(prev => ({ 
        ...prev, 
        profile: data,
        loading: false 
      }));
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
  };
};
