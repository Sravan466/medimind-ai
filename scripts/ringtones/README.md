# Ringtone Files

Place your 4 copyright-free alarm ringtones in this folder with the following names:

1. `gentle-wake.mp3` - Soft, peaceful alarm tone
2. `morning-bell.mp3` - Classic bell sound  
3. `digital-beep.mp3` - Modern digital alarm
4. `nature-sounds.mp3` - Calming nature-inspired tone

## File Requirements:
- Format: MP3
- Size: Under 10MB each
- Quality: Good audio quality for alarm purposes
- Copyright: Must be copyright-free or properly licensed

## After placing files:
1. Set your Supabase service role key: `export SUPABASE_SERVICE_ROLE_KEY=your_key_here`
2. Run: `node scripts/upload-ringtones.js`
3. The script will upload all ringtones to Supabase storage and database
