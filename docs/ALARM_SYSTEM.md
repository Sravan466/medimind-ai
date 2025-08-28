# 🔔 Alarm System Documentation

## Overview

The MediMind AI app now features a comprehensive alarm system that replaces the previous notification system. This system provides persistent, reliable alarms that work even when the app is in the background or minimized.

## 🎯 Key Features

### 1. **Persistent Alarms**
- Alarms continue to work even when the app is in the background
- Uses Android's AlarmManager and iOS background processing
- Alarms persist across app restarts and device reboots

### 2. **Full-Screen Alarm Popup**
- Clean, modern UI matching the app's design aesthetic
- Shows medicine name, dosage, and scheduled time
- Two action buttons: **Snooze** and **Dismiss**

### 3. **Smart Snooze System**
- Configurable snooze duration (default: 5 minutes)
- Maximum snooze count limit (default: 3 times)
- Visual indicator showing snooze count

### 4. **Vibration & Sound**
- Continuous vibration pattern when alarm rings
- Uses system default alarm sounds (no custom files needed)
- Three sound options: System Default, Alarm Sound, Notification
- Vibration can be enabled/disabled

### 5. **Background Processing**
- Alarms trigger even when app is minimized
- Automatic medicine logging when dismissed
- Persistent storage of alarm settings

## 🏗️ Architecture

### Core Components

#### 1. **AlarmService** (`src/services/alarmService.ts`)
- Singleton service managing all alarm operations
- Handles scheduling, cancellation, and persistence
- Manages alarm settings and active alarms

#### 2. **AlarmPopup** (`src/components/alarm/AlarmPopup.tsx`)
- Full-screen modal component
- Handles snooze and dismiss actions
- Integrates with medicine logging

#### 3. **useAlarms Hook** (`src/hooks/useAlarms.ts`)
- React hook providing alarm functionality
- Manages alarm state and settings
- Handles app state changes

#### 4. **AlarmSettings** (`src/components/alarm/AlarmSettings.tsx`)
- Settings UI component
- Allows configuration of alarm preferences
- Includes test alarm functionality

### Data Flow

```
Medicine Created → AlarmService.scheduleMedicineAlarm() → 
Notification Scheduled → Alarm Triggers → 
AlarmPopup Shows → User Action (Snooze/Dismiss) → 
Medicine Logged → Alarm Updated/Cancelled
```

## 🔧 Configuration

### Alarm Settings

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `snoozeDuration` | 5 minutes | 1-60 minutes | Time to wait before alarm rings again |
| `maxSnoozeCount` | 3 times | 1-10 times | Maximum number of snoozes allowed |
| `alarmSound` | "default" | "default", "alarm", "notification" | Uses system alarm sounds |
| `vibrationEnabled` | true | boolean | Enable/disable vibration |

### Storage

Alarm data is persisted using:
- **AsyncStorage**: Settings and active alarms
- **Expo Notifications**: Scheduled notification triggers
- **Supabase**: Medicine logs when alarms are dismissed

## 📱 User Interface

### Alarm Popup Design

The alarm popup follows the reference design with:

- **Clean white background** with subtle shadows
- **Centered content** with proper spacing
- **Medicine icon** at the top
- **Large, bold text** for medicine name and dosage
- **Two prominent buttons**:
  - **Blue "Snooze for 5 min"** button (primary action)
  - **White "Stop"** button with grey border (secondary action)
- **Snooze count indicator** (when applicable)

### Settings Screen

Located in the Profile tab, includes:
- Snooze duration input
- Max snooze count input
- Vibration toggle
- Alarm sound selection
- Test alarm button
- Save settings button

## 🚀 Implementation Details

### Scheduling Alarms

```typescript
// Schedule alarms for a medicine
const alarmIds = await alarmService.scheduleMedicineAlarm(medicine);

// Each medicine can have multiple times and days
// Creates separate alarms for each time/day combination
```

### Handling Alarm Triggers

```typescript
// When alarm notification is received
if (data?.type === 'medicine_alarm') {
  await alarmService.handleAlarmTrigger(data);
  // This stores the alarm data and shows the popup
}
```

### Snooze Functionality

```typescript
// Snooze alarm for configured duration
const success = await alarmService.snoozeAlarm(alarmId);
if (success) {
  // Alarm rescheduled for later
} else {
  // Max snooze count reached
}
```

### Dismiss Functionality

```typescript
// Dismiss alarm and log medicine as taken
await alarmService.dismissAlarm(alarmId);
// Automatically logs medicine as taken in database
```

## 🔄 Migration from Notifications

The alarm system replaces the previous notification system:

### Before (Notifications)
- Simple notifications that could be missed
- No persistent alarm functionality
- Limited snooze options
- No full-screen popup

### After (Alarms)
- Persistent alarms that work in background
- Full-screen popup requiring user interaction
- Configurable snooze system
- Automatic medicine logging
- Better reliability and user experience

## 🧪 Testing

### Test Alarm Function
- Available in Profile → Alarm Settings
- Triggers a test alarm in 5 seconds
- Useful for testing alarm popup and settings

### Manual Testing
1. Create a medicine with current time
2. Wait for alarm to trigger
3. Test snooze functionality
4. Test dismiss functionality
5. Verify medicine logging

## 🔒 Permissions

The alarm system requires:
- **Notification permissions** (for alarm triggers)
- **Background app refresh** (iOS)
- **Battery optimization exceptions** (Android)

## 🔊 System Alarm Sounds

### Sound Options

The alarm system uses your phone's built-in alarm sounds to save storage space and provide familiar audio:

1. **System Default** (`"default"`)
   - Uses the phone's default notification sound
   - Familiar and non-intrusive

2. **Alarm Sound** (`"alarm"`)
   - Uses the phone's default alarm sound
   - More attention-grabbing and persistent

3. **Notification** (`"notification"`)
   - Uses the phone's notification sound
   - Quick and subtle

### Benefits of System Sounds

- **No storage overhead**: No need to bundle custom MP3 files
- **Familiar experience**: Users recognize their phone's sounds
- **Consistent behavior**: Works across different devices and OS versions
- **Accessibility**: Respects user's system sound preferences

### Technical Implementation

```typescript
// In AlarmService
sound: this.alarmSettings.alarmSound, // Uses system alarm sound
```

The `expo-notifications` library automatically maps these sound names to the appropriate system sounds on both Android and iOS.

## 🐛 Troubleshooting

### Common Issues

1. **Alarms not triggering**
   - Check notification permissions
   - Verify battery optimization settings
   - Ensure app is not force-closed

2. **Alarm popup not showing**
   - Check if app is in foreground
   - Verify alarm data is properly stored
   - Check for JavaScript errors

3. **Snooze not working**
   - Verify snooze count hasn't reached maximum
   - Check snooze duration settings
   - Ensure alarm service is properly initialized

### Debug Information

Enable debug logging by checking console output:
- Alarm scheduling confirmations
- Trigger events
- Snooze/dismiss actions
- Error messages

## 📈 Future Enhancements

### Planned Features
- **Custom alarm sounds** (user upload)
- **Gradual volume increase**
- **Multiple alarm tones**
- **Alarm history tracking**
- **Advanced snooze patterns**
- **Emergency contact notifications**

### Technical Improvements
- **Background service optimization**
- **Battery usage optimization**
- **Cross-platform consistency**
- **Offline alarm support**

## 📚 API Reference

### AlarmService Methods

```typescript
// Core alarm operations
scheduleMedicineAlarm(medicine: Medicine): Promise<string[]>
cancelMedicineAlarms(medicineId: string): Promise<void>
snoozeAlarm(alarmId: string): Promise<boolean>
dismissAlarm(alarmId: string): Promise<void>

// Settings management
updateAlarmSettings(settings: Partial<AlarmSettings>): Promise<void>
getAlarmSettings(): AlarmSettings

// Utility methods
testAlarm(): Promise<string | null>
getScheduledAlarms(): Promise<NotificationRequest[]>
getActiveAlarms(): ActiveAlarm[]
```

### useAlarms Hook

```typescript
const {
  // State
  activeAlarms,
  scheduledCount,
  isAlarmVisible,
  currentAlarmData,
  settings,
  
  // Actions
  scheduleMedicineAlarm,
  cancelMedicineAlarms,
  snoozeAlarm,
  dismissAlarm,
  updateAlarmSettings,
  testAlarm,
  showAlarmPopup,
  hideAlarmPopup,
} = useAlarms();
```

---

This alarm system provides a robust, user-friendly solution for medicine reminders that ensures users never miss their medications while maintaining a clean, professional interface.
