-- Diagnose and fix user login issues

-- 1. Check specific user's status and 2FA setup
-- Replace 'USERNAME' with the actual username that can't login
SELECT 
    id,
    username, 
    display_name,
    email,
    role,
    status,
    two_fa_method,
    two_fa_setup_required,
    CASE WHEN pin_hash IS NOT NULL THEN 'Has PIN' ELSE 'No PIN' END as pin_status,
    last_login_at,
    deleted_at
FROM users 
WHERE username = 'USERNAME';

-- 2. If user exists but has wrong 2FA setup, reset it:
-- Replace 'USERNAME' with the actual username
UPDATE users 
SET two_fa_method = NULL,
    two_fa_setup_required = true,
    pin_hash = NULL
WHERE username = 'USERNAME';

-- 3. If user is inactive, activate them:
-- Replace 'USERNAME' with the actual username
UPDATE users 
SET status = 'active'
WHERE username = 'USERNAME' AND status != 'active';

-- 4. Check all users with potential issues
SELECT 
    username,
    status,
    two_fa_method,
    two_fa_setup_required,
    CASE WHEN deleted_at IS NOT NULL THEN 'DELETED' ELSE 'Active' END as deleted_status
FROM users
WHERE status != 'active' OR deleted_at IS NOT NULL OR (two_fa_method = 'biometric');

