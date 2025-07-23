# Database Migration Guide

## Issue Description
The error you're encountering occurs because the User model has been updated to include new fields (`hashed_password`, `email_verified`, `phone_verified`), but your existing PostgreSQL database doesn't have these columns.

## Error Details
```
psycopg2.errors.UndefinedColumn: column users.hashed_password does not exist
```

## Solutions

### Option 1: Manual PostgreSQL Migration (Recommended for Production)

1. **Connect to your PostgreSQL database** and run the migration script:

```bash
psql -h your_host -U your_username -d your_database -f backend/postgresql_migration.sql
```

Or copy and paste the SQL commands from `backend/postgresql_migration.sql`:

```sql
-- Add missing columns to users table
DO $$
BEGIN
    -- Add hashed_password column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'hashed_password'
    ) THEN
        ALTER TABLE users ADD COLUMN hashed_password VARCHAR NOT NULL DEFAULT '';
        ALTER TABLE users ALTER COLUMN hashed_password DROP DEFAULT;
    END IF;

    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ALTER COLUMN email_verified DROP DEFAULT;
    END IF;

    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ALTER COLUMN phone_verified DROP DEFAULT;
    END IF;
END $$;

-- Update existing users with placeholder password
UPDATE users 
SET 
    hashed_password = '$2b$12$Default.Hash.For.Migration.Only.Please.Reset.Password',
    email_verified = FALSE,
    phone_verified = FALSE
WHERE hashed_password = '' OR hashed_password IS NULL;
```

### Option 2: Alembic Migration (For Development)

If you're using the same database for development:

```bash
cd backend
python -m alembic upgrade head
```

### Option 3: Fresh Database (For Development Only)

If you don't mind losing existing data:

1. **Drop and recreate the database**:
```sql
DROP DATABASE your_database_name;
CREATE DATABASE your_database_name;
```

2. **Restart your application** - it will create all tables with the correct schema and seed with sample data.

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

You should see:
- `hashed_password` (VARCHAR, NOT NULL)
- `email_verified` (BOOLEAN, nullable)
- `phone_verified` (BOOLEAN, nullable)

## Testing the Fix

1. **Start your backend server**:
```bash
cd backend
python -m app.main
```

2. **Check the health endpoint**:
```bash
curl http://localhost:8000/api/health
```

3. **Test user login** with demo accounts:
   - Email: `john.doe@example.com`
   - Password: `password123`

## Sample Data

After successful migration and seeding, your database will contain:

### Demo Users
- **John Doe** - Driver & Rider (Tesla Model 3)
- **Jane Smith** - Driver & Rider (Honda Civic)  
- **Mike Wilson** - Rider only (Student)
- **Sarah Jones** - Driver & Rider (Toyota Prius)

### Sample Rides
- Stanford University → San Francisco Downtown ($25)
- Palo Alto → Mountain View ($15)
- San Jose → Stanford University ($20)

### Recurring Schedules
- Tuesday 8:00 AM: Stanford → SF (weekly)
- Friday 6:30 PM: Palo Alto → Mountain View (weekly)

## Need Help?

If you continue to experience issues:

1. **Check your database connection string** in the environment variables
2. **Verify you're connected to the correct database**
3. **Ensure you have proper permissions** to alter tables
4. **Contact your database administrator** if working with a managed database

## Environment Configuration

Make sure your `.env` file (or environment variables) are properly configured:

```env
DATABASE_URL=postgresql://username:password@host:port/database_name
# or for local development:
DATABASE_URL=sqlite:///./commute.db
```