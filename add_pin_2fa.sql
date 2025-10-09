-- Add PIN 2FA columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_fa_method VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS two_fa_setup_required BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN users.pin_hash IS 'Hashed PIN for 2FA authentication';
COMMENT ON COLUMN users.two_fa_method IS 'Method of 2FA: biometric, pin, or null if not set up';
COMMENT ON COLUMN users.two_fa_setup_required IS 'Whether user needs to set up 2FA';

