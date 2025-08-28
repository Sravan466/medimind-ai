// Add Medicine Screen for MediMind AI

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, HelperText, Chip, Button as PaperButton, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { medicineService } from '../../src/services/supabase';
import { notificationService } from '../../src/services/notifications';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { VALIDATION_RULES, ERROR_MESSAGES, SUCCESS_MESSAGES, MEDICINE_FREQUENCIES, DAYS_OF_WEEK } from '../../src/utils/constants';
import { colors } from '../../src/styles/theme';

export default function AddMedicineScreen() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
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
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: '',
    daysOfWeek: '',
  });

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
    if (!validateForm() || !user) return;

    try {
      setLoading(true);

      const medicineData = {
        user_id: user.id,
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency,
        times: formData.times,
        days_of_week: formData.daysOfWeek,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        notes: formData.notes.trim() || null,
        is_active: true,
      };

      const { data, error } = await medicineService.createMedicine(medicineData);

             if (error) {
         console.error('Error creating medicine:', error);
         return;
       }

       // Schedule notifications for the new medicine
       if (data) {
         try {
           const medicine = data as any; // Type assertion for now
           // Add a small delay to prevent rapid successive calls
           await new Promise(resolve => setTimeout(resolve, 500));
           await notificationService.scheduleMedicineReminder(medicine);
           console.log(`Scheduled notifications for ${medicine.name}`);
         } catch (alarmError) {
           console.error('Error scheduling notifications:', alarmError);
         }
       }

       // Success - navigate back to medicines screen
       router.replace('/(tabs)/medicines');
    } catch (error) {
      console.error('Error creating medicine:', error);
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
              name="pill" 
              size={32} 
              color={colors.primary[600]} 
            />
            <Text style={styles.headerTitle}>Add New Medicine</Text>
            <Text style={styles.headerSubtitle}>
              Enter the details of your medicine to set up reminders
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
            Add
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
