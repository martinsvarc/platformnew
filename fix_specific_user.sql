-- Fix specific user who can't login after Neon downtime
-- Replace 'USERNAME' with the actual username that can't login

-- 1. CHECK USER'S CURRENT STATUS
SELECT 
    id,
    username, 
    display_name,
    team_id,
    status,
    two_fa_method,
    two_fa_setup_required,
    CASE WHEN pin_hash IS NOT NULL THEN 'Has PIN' ELSE 'No PIN' END as pin_status,
    CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'NO PASSWORD!' END as password_status,
    deleted_at,
    last_login_at
FROM users 
WHERE username = 'USERNAME';

-- 2. FIX USER - Run ALL of these:

-- Fix status to active
UPDATE users 
SET status = 'active'
WHERE username = 'USERNAME';

-- Reset 2FA (force PIN setup on next login)
UPDATE users 
SET two_fa_method = NULL,
    two_fa_setup_required = true,
    pin_hash = NULL
WHERE username = 'USERNAME';

-- Make sure user is not deleted
UPDATE users 
SET deleted_at = NULL
WHERE username = 'USERNAME';

-- 3. VERIFY THE FIX
SELECT 
    id,
    username, 
    status,
    two_fa_method,
    two_fa_setup_required,
    deleted_at
FROM users 
WHERE username = 'USERNAME';

-- 4. If password is missing, you'll need to set a new one via admin panel
-- Use the password change feature in /admin page after fixing the above

