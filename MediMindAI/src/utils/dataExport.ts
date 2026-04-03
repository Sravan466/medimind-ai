import { medicineService, medicineLogService, userService } from '../services/supabase';
import { useSettingsContext } from '../contexts/SettingsContext';

export interface ExportData {
  exportDate: string;
  version: string;
  user: any;
  medicines: any[];
  medicineLogs: any[];
  settings: any;
  chatHistory?: any[];
}

export const exportUserData = async (userId: string, settings: any): Promise<ExportData> => {
  try {
    // Fetch all user data
    const [userProfile, medicines, medicineLogs] = await Promise.all([
      userService.getUserProfile(userId),
      medicineService.getMedicines(userId),
      medicineLogService.getMedicineLogs(userId),
    ]);

    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      user: userProfile.data || {},
      medicines: medicines.data || [],
      medicineLogs: medicineLogs.data || [],
      settings: settings,
    };

    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new Error('Failed to export user data');
  }
};

export const generateExportSummary = (data: ExportData): string => {
  const summary = `
MediMind AI - Data Export Summary
================================

Export Date: ${new Date(data.exportDate).toLocaleDateString()}
Version: ${data.version}

User Information:
- Name: ${data.user.full_name || 'Not set'}
- Email: ${data.user.email || 'Not set'}
- Phone: ${data.user.phone_number || 'Not set'}

Data Summary:
- Medicines: ${data.medicines.length} entries
- Medicine Logs: ${data.medicineLogs.length} entries
- Settings: ${Object.keys(data.settings).length} settings

Emergency Contacts:
- Contact: ${data.user.emergency_contact || 'Not set'}
- Phone: ${data.user.emergency_phone || 'Not set'}
  `;

  return summary;
};

export const validateImportData = (data: any): boolean => {
  try {
    // Check if data has required structure
    if (!data.exportDate || !data.version || !data.user) {
      return false;
    }

    // Check if medicines array exists
    if (!Array.isArray(data.medicines)) {
      return false;
    }

    // Check if medicine logs array exists
    if (!Array.isArray(data.medicineLogs)) {
      return false;
    }

    // Check if settings object exists
    if (typeof data.settings !== 'object') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating import data:', error);
    return false;
  }
};

export const formatExportData = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const parseImportData = (jsonString: string): ExportData | null => {
  try {
    const data = JSON.parse(jsonString);
    
    if (validateImportData(data)) {
      return data as ExportData;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing import data:', error);
    return null;
  }
};
