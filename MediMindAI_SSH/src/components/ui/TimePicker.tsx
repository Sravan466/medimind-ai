import React, { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Text, Card } from 'react-native-paper';
import { useAppTheme } from '../../styles/theme';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { accessibilityHelper } from '../../utils/accessibility';

interface TimePickerProps {
  value: string; // Time in HH:mm format
  onTimeChange: (time: string) => void;
  label?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onTimeChange,
  label = 'Select Time'
}) => {
  const { settings } = useSettingsContext();
  const theme = useAppTheme(settings?.theme || 'light', settings?.accessibility);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('time');

  // Convert string time to Date object
  const getDateFromTimeString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  // Convert Date object to string time
  const getTimeStringFromDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || getDateFromTimeString(value);
    setShow(Platform.OS === 'ios');
    
    if (selectedDate) {
      const timeString = getTimeStringFromDate(selectedDate);
      onTimeChange(timeString);
    }
  };

  const showTimePicker = () => {
    setShow(true);
  };

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
      )}
      
      <Card style={[styles.timeCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Content style={styles.timeContent}>
          <View style={styles.timeDisplay}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {formatTime12Hour(value)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              24h: {value}
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={showTimePicker}
            style={styles.selectButton}
            {...accessibilityHelper.getButtonAccessibilityProps(
              `Change time, currently ${formatTime12Hour(value)}`,
              settings,
              { hint: 'Opens time picker to select a new time' }
            )}
          >
            Change
          </Button>
        </Card.Content>
      </Card>

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={getDateFromTimeString(value)}
          mode={mode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
          themeVariant={settings.theme === 'dark' ? 'dark' : 'light'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  timeCard: {
    elevation: 2,
  },
  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeDisplay: {
    flex: 1,
  },
  selectButton: {
    marginLeft: 16,
  },
});
