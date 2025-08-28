-- Database Migration: Update medicine_logs status constraint
-- This migration adds 'due' as an allowed status for medicine_logs

-- Drop the existing constraint
ALTER TABLE medicine_logs DROP CONSTRAINT IF EXISTS medicine_logs_status_check;

-- Add the new constraint with 'due' status
ALTER TABLE medicine_logs ADD CONSTRAINT medicine_logs_status_check 
CHECK (status IN ('pending', 'taken', 'skipped', 'missed', 'due'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'medicine_logs_status_check';
