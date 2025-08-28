# Custom Ringtones Setup Guide

This guide explains how to set up custom ringtones for the MediMind AI alarm system using Supabase storage and database.

## Database Schema

### 1. Create the `custom_ringtones` table

Run this SQL in your Supabase SQL editor:

```sql
-- Create custom_ringtones table
CREATE TABLE custom_ringtones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE custom_ringtones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ringtones" ON custom_ringtones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ringtones" ON custom_ringtones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ringtones" ON custom_ringtones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ringtones" ON custom_ringtones
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_custom_ringtones_user_id ON custom_ringtones(user_id);
CREATE INDEX idx_custom_ringtones_uploaded_at ON custom_ringtones(uploaded_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_ringtones_updated_at 
  BEFORE UPDATE ON custom_ringtones 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create Supabase Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket called `alarm-ringtones`
4. Set the bucket to public (for easy access to ringtone files)
5. Configure CORS if needed for your app domain

### 3. Storage Bucket Policies

Run these SQL commands to set up storage policies:

```sql
-- Allow authenticated users to upload ringtones
CREATE POLICY "Users can upload ringtones" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'alarm-ringtones' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to view their own ringtones
CREATE POLICY "Users can view ringtones" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'alarm-ringtones' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own ringtones
CREATE POLICY "Users can delete ringtones" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'alarm-ringtones' AND 
    auth.role() = 'authenticated'
  );
```

## Usage in the App

### 1. Upload Custom Ringtone

```typescript
// Example usage in a component
import { alarmService } from '../services/alarmService';

const handleUpload = async (file: File, name: string) => {
  try {
    const ringtoneUrl = await alarmService.uploadCustomRingtone(file, name);
    if (ringtoneUrl) {
      console.log('Ringtone uploaded successfully:', ringtoneUrl);
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### 2. Get Custom Ringtones

```typescript
// Get all custom ringtones for the current user
const ringtones = await alarmService.getCustomRingtones();
console.log('Available ringtones:', ringtones);
```

### 3. Use Custom Ringtone in Alarm

```typescript
// When scheduling a medicine alarm
const alarmIds = await scheduleMedicineAlarm(medicine, customRingtoneUrl);
```

## File Format Requirements

- **Supported formats**: MP3, WAV, AAC
- **Maximum file size**: 10MB
- **Recommended duration**: 30 seconds or less
- **Quality**: Use clear, loud sounds for better wake-up effect

## Security Considerations

1. **File validation**: The app validates file types and sizes before upload
2. **User isolation**: Each user can only access their own ringtones
3. **Storage limits**: Consider implementing storage quotas per user
4. **File cleanup**: Implement automatic cleanup of unused ringtones

## Troubleshooting

### Common Issues

1. **Upload fails**: Check file size and format
2. **Permission denied**: Ensure RLS policies are correctly configured
3. **Storage bucket not found**: Verify bucket name and public access settings
4. **CORS errors**: Configure CORS policies for your app domain

### Testing

Use the test functions in the Enhanced Alarm Section:

1. **Test Alarm**: Schedules a test alarm with current settings
2. **Test Popup**: Manually triggers the alarm popup for testing
3. **Upload Test**: Try uploading a small MP3 file to test the upload functionality

## Migration from System Sounds

If you want to migrate existing alarms to use custom ringtones:

1. Upload your preferred ringtone files
2. Update alarm settings to use the custom ringtone URLs
3. Re-schedule existing alarms with the new ringtone settings

## Performance Optimization

1. **File compression**: Compress audio files before upload
2. **CDN**: Consider using a CDN for faster ringtone delivery
3. **Caching**: Implement client-side caching for frequently used ringtones
4. **Lazy loading**: Load ringtone metadata only when needed
