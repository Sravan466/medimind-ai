// Edit Medicine Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, HelperText, Chip, Button as PaperButton, Divider, ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { medicineService } from '../../src/services/supabase';
import { useNotifications } from '../../src/hooks/useNotifications';
import { notificationService } from '../../src/services/notifications';
import { medicineLogService } from '../../src/services/medicineLogService';
import { Medicine } from '../../src/types/database';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { VALIDATION_RULES, ERROR_MESSAGES, SUCCESS_MESSAGES, MEDICINE_FREQUENCIES, DAYS_OF_WEEK } from '../../src/utils/constants';
import { colors } from '../../src/styles/theme';

export default function EditMedicineScreen() {
  const { user } = useAuthContext();
  const { scheduleMedicineReminder } = useNotifications();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(-1);
  
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: [] as string[],
    daysOfWeek: [] as number[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: '',
    daysOfWeek: '',
  });

  // Load medicine data on mount
  useEffect(() => {
    loadMedicineData();
  }, []);

  const loadMedicineData = async () => {
    try {
      setInitialLoading(true);
      
      // Get medicine data from params
      const medicineParam = params.medicine as string;
      if (!medicineParam) {
        console.error('No medicine data provided');
        router.back();
        return;
      }

      const medicine: Medicine = JSON.parse(medicineParam);
      
      // Populate form with existing data
      setFormData({
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        times: medicine.times,
        daysOfWeek: medicine.days_of_week,
        startDate: medicine.start_date,
        endDate: medicine.end_date || '',
        notes: medicine.notes || '',
        isActive: medicine.is_active,
      });
    } catch (error) {
      console.error('Error loading medicine data:', error);
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {
      name: '',
      dosage: '',
      frequency: '',
      times: '',
      daysOfWeek: '',
    };

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Medicine name is required';
    } else if (formData.name.trim().length < VALIDATION_RULES.NAME_MIN_LENGTH) {
      errors.name = `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`;
    }

    // Dosage validation
    if (!formData.dosage.trim()) {
      errors.dosage = 'Dosage is required';
    }

    // Times validation
    if (formData.times.length === 0) {
      errors.times = 'At least one time is required';
    }

    // Days validation
    if (formData.daysOfWeek.length === 0) {
      errors.daysOfWeek = 'At least one day is required';
    }

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user || !params.medicine) return;

    try {
      setLoading(true);

      const medicineParam = params.medicine as string;
      const originalMedicine: Medicine = JSON.parse(medicineParam);

      const updateData = {
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency,
        times: formData.times,
        days_of_week: formData.daysOfWeek,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        notes: formData.notes.trim() || null,
        is_active: formData.isActive,
      };

      const { data, error } = await medicineService.updateMedicine(originalMedicine.id, updateData);

      if (error) {
        console.error('Error updating medicine:', error);
        return;
      }

      // Update notifications for the medicine
      if (data) {
        try {
          const medicine = data as any; // Type assertion for now
          console.log(`[EDIT] Updating notifications for ${medicine.name} (ID: ${medicine.id})`);
          
          // CRITICAL FIX: Cancel old notifications before rescheduling
          console.log(`[CANCEL] Cancelling old notifications for ${medicine.name} (ID: ${medicine.id})`);
          await notificationService.cancelMedicineNotifications(medicine.id);
          
          // CRITICAL FIX: Clean up old logs for this medicine
          console.log(`[CLEANUP] Cleaning up old logs for ${medicine.name} (ID: ${medicine.id})`);
          await medicineLogService.cleanupOldLogsForMedicine(medicine.id, user?.id || '');
          
          // CRITICAL FIX: Force refresh today medicines to create new logs
          console.log(`[REFRESH] Refreshing today medicines for ${medicine.name}`);
          await medicineLogService.getTodayMedicines(user?.id || '');
          
          // CRITICAL FIX: Add a longer delay to ensure logs are created before scheduling
          console.log(`[REFRESH] Waiting for logs to be created...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Add a delay to prevent rapid successive calls
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const notificationIds = await scheduleMedicineReminder(medicine);
          console.log(`[EDIT] Updated ${notificationIds.length} notifications for ${medicine.name}`);
        } catch (notificationError) {
          console.error('[EDIT] Error updating notifications:', notificationError);
        }
      }

      // Success - navigate back
      router.back();
    } catch (error) {
      console.error('Error updating medicine:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTime = () => {
    setCurrentTimeIndex(-1);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime && event.type !== 'dismissed') {
      const timeString = selectedTime.toTimeString().slice(0, 5); // HH:MM format
      
      if (currentTimeIndex >= 0) {
        // Edit existing time
        const newTimes = [...formData.times];
        newTimes[currentTimeIndex] = timeString;
        updateFormData('times', newTimes);
      } else {
        // Add new time
        updateFormData('times', [...formData.times, timeString]);
      }
    }
  };

  const handleRemoveTime = (index: number) => {
    const newTimes = formData.times.filter((_, i) => i !== index);
    updateFormData('times', newTimes);
  };

  const handleEditTime = (index: number) => {
    setCurrentTimeIndex(index);
    setShowTimePicker(true);
  };

  const handleDayToggle = (dayValue: number) => {
    const newDays = formData.daysOfWeek.includes(dayValue)
      ? formData.daysOfWeek.filter(day => day !== dayValue)
      : [...formData.daysOfWeek, dayValue];
    
    updateFormData('daysOfWeek', newDays.sort());
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading medicine data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons 
              name="pencil" 
              size={32} 
              color={colors.primary[600]} 
            />
            <Text style={styles.headerTitle}>Edit Medicine</Text>
            <Text style={styles.headerSubtitle}>
              Update the details of your medicine
            </Text>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Basic Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="information" 
                size={20} 
                color={colors.neutral[700]} 
              />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.formFields}>
              {/* Medicine Name */}
              <View style={styles.field}>
                <View style={styles.fieldLabelContainer}>
                  <Text style={styles.fieldLabel}>Medicine Name</Text>
                  <Text style={styles.requiredIndicator}>*</Text>
                </View>
                <Input
                  value={formData.name}
                  onChangeText={(text) => updateFormData('name', text)}
                  error={!!formErrors.name}
                  variant="outlined"
                  placeholder="Enter medicine name"
                  style={[styles.input, formErrors.name && styles.inputError]}
                />
                {formErrors.name ? (
                  <HelperText type="error" visible={!!formErrors.name} style={styles.errorText}>
                    {formErrors.name}
                  </HelperText>
                ) : null}
              </View>

              {/* Dosage */}
              <View style={styles.field}>
                <View style={styles.fieldLabelContainer}>
                  <Text style={styles.fieldLabel}>Dosage</Text>
                  <Text style={styles.requiredIndicator}>*</Text>
                </View>
                <Input
                  value={formData.dosage}
                  onChangeText={(text) => updateFormData('dosage', text)}
                  error={!!formErrors.dosage}
                  variant="outlined"
                  placeholder="e.g., 500mg, 1 tablet"
                  style={[styles.input, formErrors.dosage && styles.inputError]}
                />
                {formErrors.dosage ? (
                  <HelperText type="error" visible={!!formErrors.dosage} style={styles.errorText}>
                    {formErrors.dosage}
                  </HelperText>
                ) : null}
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Schedule Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={20} 
                color={colors.neutral[700]} 
              />
              <Text style={styles.sectionTitle}>Schedule</Text>
            </View>
            
            <View style={styles.formFields}>
              {/* Frequency */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Frequency</Text>
                <View style={styles.frequencyContainer}>
                  {MEDICINE_FREQUENCIES.map((freq) => (
                    <Chip
                      key={freq.value}
                      selected={formData.frequency === freq.value}
                      onPress={() => updateFormData('frequency', freq.value)}
                      style={[
                        styles.frequencyChip,
                        formData.frequency === freq.value && styles.selectedChip
                      ]}
                      mode="outlined"
                      textStyle={[
                        styles.chipText,
                        formData.frequency === freq.value && styles.selectedChipText
                      ]}
                    >
                      {freq.label}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Times */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <View style={styles.fieldLabelContainer}>
                    <Text style={styles.fieldLabel}>Times</Text>
                    <Text style={styles.requiredIndicator}>*</Text>
                  </View>
                  <PaperButton
                    mode="text"
                    onPress={handleAddTime}
                    icon="plus"
                    compact
                    style={styles.addButton}
                    labelStyle={styles.addButtonText}
                  >
                    Add Time
                  </PaperButton>
                </View>
                
                {formData.times.length > 0 ? (
                  <View style={styles.timesContainer}>
                    {formData.times.map((time, index) => (
                      <Chip
                        key={index}
                        onPress={() => handleEditTime(index)}
                        onClose={() => handleRemoveTime(index)}
                        style={styles.timeChip}
                        mode="outlined"
                        textStyle={styles.chipText}
                      >
                        {formatTime(time)}
                      </Chip>
                    ))}
                  </View>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <MaterialCommunityIcons 
                      name="clock-outline" 
                      size={24} 
                      color={colors.neutral[400]} 
                    />
                    <Text style={styles.placeholderText}>
                      No times added yet
                    </Text>
                  </View>
                )}
                
                {formErrors.times ? (
                  <HelperText type="error" visible={!!formErrors.times} style={styles.errorText}>
                    {formErrors.times}
                  </HelperText>
                ) : null}
              </View>

              {/* Days of Week */}
              <View style={styles.field}>
                <View style={styles.fieldLabelContainer}>
                  <Text style={styles.fieldLabel}>Days of Week</Text>
                  <Text style={styles.requiredIndicator}>*</Text>
                </View>
                <View style={styles.daysContainer}>
                  {DAYS_OF_WEEK.map((day) => (
                    <Chip
                      key={day.value}
                      selected={formData.daysOfWeek.includes(day.value)}
                      onPress={() => handleDayToggle(day.value)}
                      style={[
                        styles.dayChip,
                        formData.daysOfWeek.includes(day.value) && styles.selectedChip
                      ]}
                      mode="outlined"
                      textStyle={[
                        styles.chipText,
                        formData.daysOfWeek.includes(day.value) && styles.selectedChipText
                      ]}
                    >
                      {day.short}
                    </Chip>
                  ))}
                </View>
                
                {formErrors.daysOfWeek ? (
                  <HelperText type="error" visible={!!formErrors.daysOfWeek} style={styles.errorText}>
                    {formErrors.daysOfWeek}
                  </HelperText>
                ) : null}
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Additional Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="note-text" 
                size={20} 
                color={colors.neutral[700]} 
              />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>
            
            <View style={styles.formFields}>
              {/* Start Date */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Start Date</Text>
                <Input
                  value={formData.startDate}
                  onChangeText={(text) => updateFormData('startDate', text)}
                  variant="outlined"
                  placeholder="YYYY-MM-DD"
                  style={styles.input}
                />
              </View>

              {/* End Date (Optional) */}
              <View style={styles.field}>
                <View style={styles.fieldLabelContainer}>
                  <Text style={styles.fieldLabel}>End Date</Text>
                  <Text style={styles.optionalIndicator}>Optional</Text>
                </View>
                <Input
                  value={formData.endDate}
                  onChangeText={(text) => updateFormData('endDate', text)}
                  variant="outlined"
                  placeholder="YYYY-MM-DD"
                  style={styles.input}
                />
              </View>

              {/* Notes */}
              <View style={styles.field}>
                <View style={styles.fieldLabelContainer}>
                  <Text style={styles.fieldLabel}>Notes</Text>
                  <Text style={styles.optionalIndicator}>Optional</Text>
                </View>
                <Input
                  value={formData.notes}
                  onChangeText={(text) => updateFormData('notes', text)}
                  variant="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Any additional notes about this medicine"
                  style={styles.input}
                />
              </View>

              {/* Active Status */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusContainer}>
                  <Chip
                    selected={formData.isActive}
                    onPress={() => updateFormData('isActive', true)}
                    style={[
                      styles.statusChip,
                      formData.isActive && styles.selectedChip
                    ]}
                    mode="outlined"
                    textStyle={[
                      styles.chipText,
                      formData.isActive && styles.selectedChipText
                    ]}
                  >
                    Active
                  </Chip>
                  <Chip
                    selected={!formData.isActive}
                    onPress={() => updateFormData('isActive', false)}
                    style={[
                      styles.statusChip,
                      !formData.isActive && styles.selectedChip
                    ]}
                    mode="outlined"
                    textStyle={[
                      styles.chipText,
                      !formData.isActive && styles.selectedChipText
                    ]}
                  >
                    Inactive
                  </Chip>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
            labelStyle={styles.submitButtonText}

          >
            Update
          </Button>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={false}
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  loadingText: {
    marginTop: 16,
    color: colors.neutral[600],
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.neutral[50],
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral[900],
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
    marginLeft: 8,
  },
  formFields: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral[900],
  },
  requiredIndicator: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error[500],
    marginLeft: 4,
  },
  optionalIndicator: {
    fontSize: 14,
    color: colors.neutral[500],
    marginLeft: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
  },
  inputError: {
    borderColor: colors.error[300],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[500],
    marginTop: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addButton: {
    margin: 0,
    padding: 0,
  },
  addButtonText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyChip: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[300],
  },
  selectedChip: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  chipText: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  selectedChipText: {
    color: colors.primary[700],
    fontWeight: '500',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[300],
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[300],
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[300],
  },
  placeholderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.neutral[500],
    marginLeft: 8,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: colors.neutral[200],
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 20,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.neutral[300],
  },
  submitButton: {
    flex: 1,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonContent: {
    paddingHorizontal: 12,
  },
});
