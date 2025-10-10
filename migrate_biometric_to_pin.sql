-- Migration: Remove Biometric 2FA and Reset Users to PIN Setup
-- This script resets all users with biometric 2FA to require PIN setup

-- Update users with biometric 2FA to NULL (will trigger 2FA setup on next login)
UPDATE users 
SET two_fa_method = NULL,
    two_fa_secret = NULL
WHERE two_fa_method = 'biometric';

-- Log the changes
SELECT 
    COUNT(*) as users_reset,
    'Users with biometric 2FA have been reset to require PIN setup' as message
FROM users 
WHERE two_fa_method IS NULL;

-- Verify no biometric users remain
SELECT 
    COUNT(*) as remaining_biometric_users
FROM users 
WHERE two_fa_method = 'biometric';

