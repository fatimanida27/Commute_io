-- Manual PostgreSQL migration to add missing user columns
-- Run this script on your PostgreSQL database if the columns don't exist

-- Check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add hashed_password column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'hashed_password'
    ) THEN
        ALTER TABLE users ADD COLUMN hashed_password VARCHAR NOT NULL DEFAULT '';
        -- Remove default after adding
        ALTER TABLE users ALTER COLUMN hashed_password DROP DEFAULT;
    END IF;

    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        -- Remove default after adding
        ALTER TABLE users ALTER COLUMN email_verified DROP DEFAULT;
    END IF;

    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        -- Remove default after adding
        ALTER TABLE users ALTER COLUMN phone_verified DROP DEFAULT;
    END IF;
END $$;

-- Update existing users with default password (they'll need to reset)
-- and set verification status
UPDATE users 
SET 
    hashed_password = '$2b$12$Default.Hash.For.Migration.Only.Please.Reset.Password',
    email_verified = FALSE,
    phone_verified = FALSE
WHERE hashed_password = '' OR hashed_password IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;