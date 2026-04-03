// AI Hook for MediMind AI

import React, { useState, useCallback } from 'react';
import { aiService, MedicineInfo, AIResponse } from '../services/ai';
import { medicineInfoCacheService } from '../services/supabase';

export interface AIState {
  loading: boolean;
  medicineInfo: MedicineInfo | null;
  error: string | null;
  lastSearched: string | null;
}

export const useAI = () => {
  const [state, setState] = useState<AIState>({
    loading: false,
    medicineInfo: null,
    error: null,
    lastSearched: null,
  });

  // Test API key on initialization
  React.useEffect(() => {
    const testAPI = async () => {
      const geminiWorking = await aiService.testGeminiAPI();
      if (!geminiWorking) {
        console.log('Gemini API key test failed - will use mock data');
      }
    };
    testAPI();
  }, []);

  const getMedicineInfo = useCallback(async (medicineName: string): Promise<MedicineInfo | null> => {
    if (!medicineName.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Please enter a medicine name',
        loading: false,
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastSearched: medicineName,
    }));

    // Add minimum loading time for better UX
    const startTime = Date.now();
    const minLoadingTime = 800; // 800ms minimum loading time

    try {
      // First, check cache
      const { data: cachedData } = await medicineInfoCacheService.getCachedInfo(medicineName);
      
      if (cachedData) {
        const medicineInfo = aiService.fromDatabaseFormat(cachedData);
        
        // Ensure minimum loading time
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }
        
        setState(prev => ({
          ...prev,
          loading: false,
          medicineInfo,
          error: null,
        }));
        return medicineInfo;
      }

      // If not in cache, get from AI service
      const aiResponse: AIResponse = await aiService.getMedicineInfo(medicineName);
      
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      if (aiResponse.success && aiResponse.data) {
        // Cache the result
        const cacheData = aiService.toDatabaseFormat(aiResponse.data);
        await medicineInfoCacheService.cacheMedicineInfo(cacheData);

        setState(prev => ({
          ...prev,
          loading: false,
          medicineInfo: aiResponse.data!,
          error: null,
        }));
        
        return aiResponse.data;
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: aiResponse.error || 'Failed to get medicine information',
        }));
        return null;
      }
    } catch (error) {
      console.error('Error getting medicine info:', error);
      
      // Ensure minimum loading time even for errors
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'An error occurred while fetching medicine information',
      }));
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const clearMedicineInfo = useCallback(() => {
    setState(prev => ({
      ...prev,
      medicineInfo: null,
      lastSearched: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      loading: false,
      medicineInfo: null,
      error: null,
      lastSearched: null,
    });
  }, []);

  return {
    ...state,
    getMedicineInfo,
    clearError,
    clearMedicineInfo,
    reset,
  };
};
