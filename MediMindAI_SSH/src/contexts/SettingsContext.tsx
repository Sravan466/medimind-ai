import React, { createContext, useContext, ReactNode } from 'react';
import { useSettings, AppSettings } from '../hooks/useSettings';

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  updateAccessibilitySetting: (key: keyof AppSettings['accessibility'], value: boolean) => Promise<void>;
  updateNotificationSetting: <K extends keyof AppSettings['notifications']>(key: K, value: AppSettings['notifications'][K]) => Promise<void>;
  updateNotificationCategorySetting: (key: keyof AppSettings['notifications']['categories'], value: boolean) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => any;
  importSettings: (importedSettings: Partial<AppSettings>) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const settingsHook = useSettings();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
