# Default Ringtones Setup Guide

This guide will help you set up the default ringtones system for MediMind AI, replacing the custom upload functionality with 4 pre-uploaded ringtones.

## 🎵 **Overview**

Instead of allowing users to upload their own ringtones, the app now provides 4 high-quality, copyright-free alarm ringtones that users can select from. This provides a better user experience and reduces storage costs.

## 📁 **File Structure**

```
MediMindAI/
├── scripts/
│   ├── upload-ringtones.js          # Script to upload ringtones
│   └── ringtones/
│       ├── README.md                # Instructions for ringtone files
│       ├── gentle-wake.mp3          # Soft, peaceful alarm tone
│       ├── morning-bell.mp3         # Classic bell sound
│       ├── digital-beep.mp3         # Modern digital alarm
│       └── nature-sounds.mp3        # Calming nature-inspired tone
└── src/
    └── components/
        └── alarm/
            ├── SimplifiedAlarmSection.tsx  # New simplified UI
            └── EnhancedAlarmSection.tsx    # Old component (can be removed)
```

## 🚀 **Setup Steps**

### **Step 1: Prepare Your Ringtone Files**

1. **Get 4 copyright-free alarm ringtones** (MP3 format, under 10MB each)
2. **Rename them** to match the expected filenames:
   - `gentle-wake.mp3`
   - `morning-bell.mp3`
   - `digital-beep.mp3`
   - `nature-sounds.mp3`
3. **Place them** in the `MediMindAI/scripts/ringtones/` folder

### **Step 2: Set Up Supabase Database**

Run the updated database schema in your Supabase SQL Editor:

```sql
-- Run the complete database_setup.sql file
-- This includes the custom_ringtones table with is_default support
```

### **Step 3: Get Your Supabase Service Role Key**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **Settings → API**
3. Copy the **service_role** key (not the anon key)

### **Step 4: Upload Ringtones to Supabase**

1. **Set the environment variable**:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Run the upload script**:
   ```bash
   cd MediMindAI
   node scripts/upload-ringtones.js
   ```

3. **Verify the upload**:
   - Check your Supabase Storage → `alarm-ringtones` bucket
   - Check your Supabase Database → `custom_ringtones` table

### **Step 5: Update Your App**

The app has already been updated with:
- ✅ New `SimplifiedAlarmSection` component
- ✅ Updated `AlarmService` with `getDefaultRingtones()` method
- ✅ Updated database schema
- ✅ Removed custom upload functionality

### **Step 6: Test the System**

1. **Start your development server**:
   ```bash
   npx expo start
   ```

2. **Test the alarm settings**:
   - Go to Profile tab → Alarm Settings
   - Verify the 4 ringtones appear in the "Available Ringtones" section
   - Test selecting different ringtones
   - Test the alarm functionality

## 🔧 **Technical Details**

### **Database Schema**

The `custom_ringtones` table now includes:
- `is_default`: Boolean flag for default ringtones
- `user_id`: NULL for default ringtones, user ID for custom ones
- `description`: Optional description for each ringtone

### **RLS Policies**

Default ringtones are accessible to all authenticated users:
```sql
CREATE POLICY "Users can view default ringtones" ON custom_ringtones 
  FOR SELECT USING (is_default = true OR auth.uid() = user_id);
```

### **Alarm Service Methods**

- `getDefaultRingtones()`: Fetches all default ringtones
- `getCustomRingtones()`: Fetches user-specific ringtones (legacy)
- Updated sound configuration to work with Supabase URLs

### **UI Changes**

- **Removed**: Custom upload functionality
- **Added**: Clean ringtone selection with chips
- **Simplified**: Single card layout with minimal spacing
- **Improved**: Better visual hierarchy and user experience

## 🎯 **Expected Behavior**

### **For Users:**
1. **Profile → Alarm Settings** shows a clean interface
2. **System Sounds** section with 3 default options
3. **Available Ringtones** section with 4 custom ringtones
4. **Selection** is saved and used for all alarms
5. **Test buttons** to verify alarm functionality

### **For Developers:**
1. **No more upload complexity** - just 4 pre-approved ringtones
2. **Reduced storage costs** - no user uploads
3. **Better performance** - no file processing
4. **Simplified maintenance** - centralized ringtone management

## 🚨 **Troubleshooting**

### **Ringtone Upload Issues:**
- **Check file names**: Must match exactly (case-sensitive)
- **Check file size**: Must be under 10MB
- **Check format**: Must be MP3
- **Check service role key**: Must be set correctly

### **Ringtone Not Appearing:**
- **Check database**: Verify `is_default = true` in `custom_ringtones`
- **Check RLS policies**: Ensure policies allow reading default ringtones
- **Check storage**: Verify files exist in `alarm-ringtones` bucket

### **Alarm Not Ringing:**
- **Check notification permissions**: Ensure app has notification access
- **Check sound settings**: Verify ringtone URL is accessible
- **Test with system sounds**: Try "System Default" first

## 📝 **Maintenance**

### **Adding New Ringtones:**
1. Add new ringtone file to `scripts/ringtones/`
2. Update `upload-ringtones.js` script
3. Run upload script
4. Update app if needed

### **Updating Existing Ringtones:**
1. Replace file in `scripts/ringtones/`
2. Run upload script (uses `upsert: true`)
3. Clear app cache if needed

### **Removing Ringtones:**
1. Delete from Supabase storage
2. Delete from database
3. Update app to remove from UI

## 🎉 **Success Criteria**

You'll know the setup is complete when:
- ✅ 4 ringtones appear in the Alarm Settings
- ✅ Users can select and save ringtone preferences
- ✅ Alarms ring with the selected sound
- ✅ No custom upload functionality is visible
- ✅ Clean, minimal UI without extra white space

## 📞 **Support**

If you encounter issues:
1. Check the console logs for error messages
2. Verify Supabase configuration
3. Test with system sounds first
4. Check file permissions and network connectivity
