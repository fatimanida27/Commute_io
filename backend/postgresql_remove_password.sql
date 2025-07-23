-- PostgreSQL migration to remove password fields
-- Run this script on your PostgreSQL database to remove password functionality

-- Remove hashed_password column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'hashed_password'
    ) THEN
        ALTER TABLE users DROP COLUMN hashed_password;
    END IF;
END $$;

-- Make name column nullable to allow incomplete profiles
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;