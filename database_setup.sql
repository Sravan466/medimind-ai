-- Database setup for MediMind AI

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times TEXT[],
  days TEXT[],
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicine logs table
CREATE TABLE IF NOT EXISTS medicine_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicine info cache table
CREATE TABLE IF NOT EXISTS medicine_info_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_name TEXT NOT NULL UNIQUE,
  uses TEXT,
  side_effects TEXT,
  description TEXT,
  dosage_info TEXT,
  interactions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom ringtones table (for default ringtones available to all users)
CREATE TABLE IF NOT EXISTS custom_ringtones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_default BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null for default ringtones
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_info_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_ringtones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for medicines
CREATE POLICY "Users can view own medicines" ON medicines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicines" ON medicines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medicines" ON medicines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medicines" ON medicines FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for medicine_logs
CREATE POLICY "Users can view own medicine logs" ON medicine_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicine logs" ON medicine_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medicine logs" ON medicine_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medicine logs" ON medicine_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_history
CREATE POLICY "Users can view own chat history" ON chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat history" ON chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat history" ON chat_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat history" ON chat_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for medicine_info_cache (public read, authenticated write)
CREATE POLICY "Anyone can view medicine info cache" ON medicine_info_cache FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert medicine info cache" ON medicine_info_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update medicine info cache" ON medicine_info_cache FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for custom_ringtones
-- Default ringtones (user_id = null) are readable by all authenticated users
-- User-specific ringtones are only accessible by the owner
CREATE POLICY "Users can view default ringtones" ON custom_ringtones FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own ringtones" ON custom_ringtones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ringtones" ON custom_ringtones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ringtones" ON custom_ringtones FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_user_id ON medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON medicines(is_active);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_user_id ON medicine_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_date ON medicine_logs(date);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_info_cache_name ON medicine_info_cache(medicine_name);
CREATE INDEX IF NOT EXISTS idx_custom_ringtones_default ON custom_ringtones(is_default);
CREATE INDEX IF NOT EXISTS idx_custom_ringtones_user_id ON custom_ringtones(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_history_updated_at BEFORE UPDATE ON chat_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicine_info_cache_updated_at BEFORE UPDATE ON medicine_info_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_ringtones_updated_at BEFORE UPDATE ON custom_ringtones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
