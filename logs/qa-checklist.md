# EAS Notification Fixes - QA Checklist

## Pre-Testing Setup

### 1. Build and Install
- [ ] Run `eas build --platform android --profile preview`
- [ ] Download APK from EAS dashboard
- [ ] Uninstall old app from test device
- [ ] Reboot device (important for icon cache clearing)
- [ ] Install new APK

### 2. Device Preparation
- [ ] Enable Developer Options
- [ ] Enable USB Debugging
- [ ] Disable battery optimization for the app
- [ ] Grant all notification permissions
- [ ] Grant exact alarm permission (Android 12+)

## Test Scenarios

### Primary Notification Test
**Objective**: Verify primary notifications fire on time in EAS build

**Steps**:
1. Open app and create a test medicine
2. Set time to 2 minutes from current time
3. Save medicine
4. Wait for notification to fire
5. Check logs for timing accuracy

**Expected Results**:
- [ ] Notification fires within ±30 seconds of scheduled time
- [ ] Log shows `[FIRE_PRIMARY]` and `[MARK_AS_DUE]`
- [ ] Today Medicines list shows pending item with checkbox
- [ ] No duplicate notifications

**Log Commands**:
```bash
adb logcat | grep "com.medimind.ai" | grep -E "(SCHEDULE|FIRE_PRIMARY|MARK_AS_DUE)"
```

### Funny Reminder Chain Test
**Objective**: Verify funny reminders repeat until action taken

**Steps**:
1. Let primary notification fire
2. Ignore the notification (don't tap checkbox)
3. Wait 4 minutes for first funny reminder
4. Continue ignoring for multiple cycles
5. Finally tap checkbox to mark as taken

**Expected Results**:
- [ ] First funny reminder fires after 4 minutes
- [ ] Subsequent reminders fire every 4 minutes
- [ ] Log shows `[FIRE_FUNNY]` and `[SCHEDULE_FUNNY]`
- [ ] Reminders stop when medicine marked as taken
- [ ] Log shows `[CANCEL_FUNNY_CHAIN]` when action taken

**Log Commands**:
```bash
adb logcat | grep "com.medimind.ai" | grep -E "(FIRE_FUNNY|SCHEDULE_FUNNY|CANCEL_FUNNY)"
```

### Medicine Editing Test
**Objective**: Verify editing medicine cancels old notifications

**Steps**:
1. Create medicine with time 5 minutes from now
2. Wait 1 minute, then edit time to 3 minutes from now
3. Save changes
4. Monitor for duplicate notifications

**Expected Results**:
- [ ] Log shows `[CANCEL]` for old notifications
- [ ] Log shows `[SCHEDULE]` for new notifications
- [ ] Only one notification fires at the new time
- [ ] No duplicate notifications

**Log Commands**:
```bash
adb logcat | grep "com.medimind.ai" | grep -E "(CANCEL|SCHEDULE)"
```

### App Restart Test
**Objective**: Verify notifications persist after app restart

**Steps**:
1. Schedule medicine for 10 minutes from now
2. Force close app
3. Restart app
4. Wait for notification to fire

**Expected Results**:
- [ ] Log shows `[RECONCILE]` on app start
- [ ] Notification still fires at scheduled time
- [ ] Funny reminder chain continues if primary was ignored

**Log Commands**:
```bash
adb logcat | grep "com.medimind.ai" | grep -E "(RECONCILE|SCHEDULE|FIRE)"
```

### Device Reboot Test
**Objective**: Verify notifications survive device reboot

**Steps**:
1. Schedule medicine for 15 minutes from now
2. Reboot device
3. Wait for notification to fire

**Expected Results**:
- [ ] Notification fires after reboot
- [ ] App reconciles missing notifications on start

## Icon Update Test

### Visual Verification
**Objective**: Verify new adaptive icon displays correctly

**Steps**:
1. After uninstall/reboot/install cycle
2. Check home screen icon
3. Check app drawer icon
4. Check recent apps icon

**Expected Results**:
- [ ] Icon shows new design (not old/cropped version)
- [ ] Icon has proper background color (#0E77D1)
- [ ] Icon is properly centered and sized

### Icon Assets Verification
**Objective**: Verify correct icon assets are bundled

**Steps**:
1. Extract APK contents
2. Check `res/mipmap-*` directories
3. Verify adaptive icon files are present

**Expected Results**:
- [ ] `adaptive-foreground.png` is present and updated
- [ ] Background color is set to #0E77D1
- [ ] All mipmap densities contain correct assets

## Performance Tests

### Memory Usage
**Objective**: Verify no memory leaks from notification tracking

**Steps**:
1. Schedule multiple medicines
2. Let notifications fire and funny reminders cycle
3. Monitor memory usage over time
4. Check for memory leaks

**Expected Results**:
- [ ] Memory usage remains stable
- [ ] No increasing memory consumption
- [ ] Scheduled followups are properly cleaned up

### Battery Impact
**Objective**: Verify minimal battery impact

**Steps**:
1. Monitor battery usage during notification testing
2. Check for excessive wake locks
3. Verify proper notification channel usage

**Expected Results**:
- [ ] Battery usage is reasonable
- [ ] No excessive background activity
- [ ] Notifications use high-importance channel appropriately

## Edge Cases

### Multiple Medicines
**Objective**: Verify handling of multiple medicines

**Steps**:
1. Create 3-4 medicines with different times
2. Let all notifications fire
3. Ignore some, take action on others
4. Verify proper tracking

**Expected Results**:
- [ ] Each medicine has independent notification tracking
- [ ] Funny reminders only fire for ignored medicines
- [ ] No cross-contamination between medicines

### Time Zone Changes
**Objective**: Verify handling of time zone changes

**Steps**:
1. Schedule medicine
2. Change device time zone
3. Verify notification still fires correctly

**Expected Results**:
- [ ] Notifications adjust to new time zone
- [ ] No missed or duplicate notifications

### Network Issues
**Objective**: Verify graceful handling of network issues

**Steps**:
1. Disable network connection
2. Schedule medicine
3. Let notification fire
4. Verify funny reminders work without network

**Expected Results**:
- [ ] Primary notifications work offline
- [ ] Funny reminders use fallback messages
- [ ] No crashes or errors

## Log Analysis

### Required Log Patterns
Verify these log patterns appear correctly:

```
[SCHEDULE] medicineId=... when=... id=...
[FIRE_PRIMARY] logId=... notifId=...
[MARK_AS_DUE] logId=...
[SCHEDULE_FUNNY] logId=... attempt=1
[FIRE_FUNNY] logId=... attempt=1
[SCHEDULE_FUNNY] logId=... attempt=2
[MARK_AS_TAKEN] logId=...
[CANCEL_FUNNY_CHAIN] logId=...
[RECONCILE] Starting notification reconciliation...
```

### Error Logs to Watch For
- [ ] No "permission denied" errors
- [ ] No "exact alarm" permission errors
- [ ] No duplicate notification scheduling
- [ ] No memory allocation errors

## Final Verification

### Acceptance Criteria Summary
- [ ] Primary notifications fire on time (±30 seconds)
- [ ] Funny reminders repeat every 4 minutes until action taken
- [ ] Editing medicine cancels old notifications
- [ ] App restart preserves notification schedule
- [ ] Device reboot preserves notification schedule
- [ ] New adaptive icon displays correctly
- [ ] No duplicate notifications
- [ ] No memory leaks
- [ ] Minimal battery impact

### Documentation
- [ ] Screenshots of new icon on device
- [ ] Log files saved for each test scenario
- [ ] Performance metrics recorded
- [ ] Issues documented with reproduction steps

## Known Limitations

### Platform Limitations
- Android Doze mode may delay notifications by up to 15 minutes
- Battery optimization can affect exact timing
- Some manufacturers have aggressive battery saving
- SCHEDULE_EXACT_ALARM permission required on Android 12+

### Mitigation Strategies
- High-importance notification channel
- Exact timestamp scheduling
- Persistence of scheduled followups
- Reconciliation on app restart
- Clear user instructions for permissions

## Test Results Template

**Test Date**: ___________
**Device**: ___________
**Android Version**: ___________
**Build Version**: ___________

**Primary Notification Test**: ✅ / ❌
**Funny Reminder Test**: ✅ / ❌
**Medicine Editing Test**: ✅ / ❌
**App Restart Test**: ✅ / ❌
**Device Reboot Test**: ✅ / ❌
**Icon Update Test**: ✅ / ❌

**Issues Found**:
1. ___________
2. ___________
3. ___________

**Logs Saved**: ✅ / ❌
**Screenshots Taken**: ✅ / ❌
