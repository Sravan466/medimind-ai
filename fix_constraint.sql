-- Add unique constraint to custom_ringtones.name column
ALTER TABLE custom_ringtones ADD CONSTRAINT custom_ringtones_name_unique UNIQUE (name);

-- Verify the constraint was added
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'custom_ringtones' AND constraint_type = 'UNIQUE';
