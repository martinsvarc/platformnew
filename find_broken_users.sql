-- Find all users who might have login issues after Neon downtime

-- 1. Users still with biometric 2FA (SHOULD BE NONE)
SELECT 
    id, username, display_name, team_id, 
    'BIOMETRIC STILL SET' as issue
FROM users 
WHERE two_fa_method = 'biometric'
AND deleted_at IS NULL;

-- 2. Users who are inactive
SELECT 
    id, username, display_name, team_id, status,
    'INACTIVE STATUS' as issue
FROM users 
WHERE status != 'active'
AND deleted_at IS NULL;

-- 3. Users who are soft-deleted
SELECT 
    id, username, display_name, team_id, deleted_at,
    'SOFT DELETED' as issue
FROM users 
WHERE deleted_at IS NOT NULL;

-- 4. Users without password
SELECT 
    id, username, display_name, team_id,
    'NO PASSWORD' as issue
FROM users 
WHERE password_hash IS NULL
AND deleted_at IS NULL;

-- 5. Users without PIN but 2FA method is 'pin'
SELECT 
    id, username, display_name, team_id,
    'PIN METHOD BUT NO PIN HASH' as issue
FROM users 
WHERE two_fa_method = 'pin'
AND pin_hash IS NULL
AND deleted_at IS NULL;

-- FIX ALL BIOMETRIC USERS AT ONCE
UPDATE users 
SET two_fa_method = NULL,
    two_fa_setup_required = true,
    pin_hash = NULL
WHERE two_fa_method = 'biometric';

-- ACTIVATE ALL INACTIVE USERS (be careful with this one!)
-- UPDATE users 
-- SET status = 'active'
-- WHERE status != 'active' AND deleted_at IS NULL;

