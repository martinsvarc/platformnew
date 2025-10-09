-- Emergency 2FA Reset Script
-- Run this in your Neon database console to reset 2FA for a specific user

-- Option 1: Reset 2FA for a specific user by username
-- Replace 'YOUR_USERNAME' with your actual username
UPDATE users 
SET pin_hash = NULL,
    two_fa_method = NULL,
    two_fa_setup_required = TRUE
WHERE username = 'YOUR_USERNAME';

-- Option 2: Reset 2FA for ALL users in a team (if needed)
-- Replace 'YOUR_TEAM_ID' with your actual team_id
-- UPDATE users 
-- SET pin_hash = NULL,
--     two_fa_method = NULL,
--     two_fa_setup_required = TRUE
-- WHERE team_id = 'YOUR_TEAM_ID';

-- Verify the update
SELECT id, username, two_fa_method, two_fa_setup_required, pin_hash
FROM users 
WHERE username = 'YOUR_USERNAME';

