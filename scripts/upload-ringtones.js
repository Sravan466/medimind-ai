// Script to upload 4 pre-downloaded ringtones to Supabase
// Run this script once to set up the ringtones

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://uvydvmwdzxxtzzfxolwn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this

if (!supabaseServiceKey) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ringtone configuration
const ringtones = [
  {
    name: 'Gentle Wake',
    filename: 'gentle-wake.mp3',
    description: 'Soft, peaceful alarm tone'
  },
  {
    name: 'Morning Bell',
    filename: 'morning-bell.mp3', 
    description: 'Classic bell sound'
  },
  {
    name: 'Digital Beep',
    filename: 'digital-beep.mp3',
    description: 'Modern digital alarm'
  },
  {
    name: 'Nature Sounds',
    filename: 'nature-sounds.mp3',
    description: 'Calming nature-inspired tone'
  }
];

async function uploadRingtones() {
  console.log('🎵 Starting ringtone upload to Supabase...\n');

  try {
    // 1. Create storage bucket if it doesn't exist
    console.log('📦 Checking storage bucket...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === 'alarm-ringtones');
    
    if (!bucketExists) {
      console.log('Creating alarm-ringtones bucket...');
      const { error: bucketError } = await supabase.storage.createBucket('alarm-ringtones', {
        public: true,
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (bucketError) {
        console.error('❌ Error creating bucket:', bucketError);
        return;
      }
      console.log('✅ Bucket created successfully');
    } else {
      console.log('✅ Bucket already exists');
    }

    // 2. Upload each ringtone file
    console.log('\n📤 Uploading ringtone files...');
    
    for (const ringtone of ringtones) {
      const filePath = path.join(__dirname, 'ringtones', ringtone.filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        console.log(`   Please place ${ringtone.filename} in the scripts/ringtones/ folder`);
        continue;
      }

      console.log(`Uploading ${ringtone.name}...`);
      
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const fileStats = fs.statSync(filePath);
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('alarm-ringtones')
        .upload(ringtone.filename, fileBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Error uploading ${ringtone.name}:`, uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('alarm-ringtones')
        .getPublicUrl(ringtone.filename);

      // 3. Insert into database
      const { error: dbError } = await supabase
        .from('custom_ringtones')
        .upsert({
          name: ringtone.name,
          description: ringtone.description,
          url: urlData.publicUrl,
          file_path: ringtone.filename,
          file_size: fileStats.size,
          mime_type: 'audio/mpeg',
          is_default: true, // Mark as default ringtone
          user_id: null // Available to all users
        }, {
          onConflict: 'name'
        });

      if (dbError) {
        console.error(`❌ Error saving ${ringtone.name} to database:`, dbError);
        continue;
      }

      console.log(`✅ ${ringtone.name} uploaded successfully`);
    }

    console.log('\n🎉 Ringtone upload completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your app to fetch these ringtones');
    console.log('2. Remove custom upload functionality');
    console.log('3. Test the alarm system with the new ringtones');

  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

// Run the upload
uploadRingtones();
