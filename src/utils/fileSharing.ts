import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { ExportData, formatExportData, generateExportSummary } from './dataExport';

export interface ShareResult {
  success: boolean;
  error?: string;
  filePath?: string;
}

export const fileSharing = {
  /**
   * Export data to a JSON file
   */
  async exportAndShareData(data: ExportData): Promise<ShareResult> {
    try {
      const fileName = `medimind-backup-${new Date().toISOString().split('T')[0]}.json`;
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error('Document directory not available');
      }
      const fileUri = `${documentDir}${fileName}`;
      
      // Format the data as JSON
      const jsonData = formatExportData(data);
      
      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Show success message with file location
      Alert.alert(
        'Export Complete',
        `Data exported to: ${fileUri}\n\nYou can find this file in your app's documents folder.`,
        [{ text: 'OK' }]
      );
      
      return { success: true, filePath: fileUri };
    } catch (error: any) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export data',
      };
    }
  },

  /**
   * Export settings to a JSON file
   */
  async exportAndShareSettings(settings: any): Promise<ShareResult> {
    try {
      const fileName = `medimind-settings-${new Date().toISOString().split('T')[0]}.json`;
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error('Document directory not available');
      }
      const fileUri = `${documentDir}${fileName}`;
      
      const settingsData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        type: 'settings',
        settings: settings,
      };
      
      const jsonData = JSON.stringify(settingsData, null, 2);
      
      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert(
        'Settings Export Complete',
        `Settings exported to: ${fileUri}`,
        [{ text: 'OK' }]
      );
      
      return { success: true, filePath: fileUri };
    } catch (error: any) {
      console.error('Settings export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export settings',
      };
    }
  },

  /**
   * Read a file from the file system
   */
  async readFile(fileUri: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        return { success: false, error: 'File does not exist' };
      }

      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return { success: true, data: content };
    } catch (error: any) {
      console.error('Read file error:', error);
      return {
        success: false,
        error: error.message || 'Failed to read file',
      };
    }
  },

  /**
   * Get list of exported files
   */
  async getExportedFiles(): Promise<{ files: string[]; error?: string }> {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error('Document directory not available');
      }
      const files = await FileSystem.readDirectoryAsync(documentDir);
      const exportFiles = files.filter(file => 
        file.startsWith('medimind-') && file.endsWith('.json')
      );
      
      return { files: exportFiles };
    } catch (error: any) {
      console.error('Get exported files error:', error);
      return {
        files: [],
        error: error.message || 'Failed to get exported files',
      };
    }
  },

  /**
   * Delete an exported file
   */
  async deleteExportedFile(fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error('Document directory not available');
      }
      const fileUri = `${documentDir}${fileName}`;
      await FileSystem.deleteAsync(fileUri);
      
      return { success: true };
    } catch (error: any) {
      console.error('Delete file error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete file',
      };
    }
  },

  /**
   * Create a text summary of exported data
   */
  async exportDataSummaryAsText(data: ExportData): Promise<ShareResult> {
    try {
      const fileName = `medimind-summary-${new Date().toISOString().split('T')[0]}.txt`;
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error('Document directory not available');
      }
      const fileUri = `${documentDir}${fileName}`;
      
      const summary = generateExportSummary(data);
      
      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, summary, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert(
        'Summary Export Complete',
        `Summary exported to: ${fileUri}`,
        [{ text: 'OK' }]
      );
      
      return { success: true, filePath: fileUri };
    } catch (error: any) {
      console.error('Summary export error:', error);
      return {
        success: false,
        error: error.message || 'Failed to export summary',
      };
    }
  },

  /**
   * Get file information
   */
  async getFileInfo(fileName: string) {
    try {
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error('Document directory not available');
      }
      const fileUri = `${documentDir}${fileName}`;
      const info = await FileSystem.getInfoAsync(fileUri);
      
      return {
        exists: info.exists,
        size: info.size,
        modificationTime: info.modificationTime,
        uri: fileUri,
      };
    } catch (error) {
      console.error('Get file info error:', error);
      return {
        exists: false,
        size: 0,
        modificationTime: 0,
        uri: '',
      };
    }
  },
};
