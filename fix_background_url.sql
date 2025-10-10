-- Check current background URL
SELECT team_id, setting_key, setting_value, length(setting_value) as url_length
FROM app_settings
WHERE setting_key = 'background_url';

-- Fix/update the background URL to the correct one
UPDATE app_settings
SET setting_value = 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77bea777fb41bf5438086e_ubbh2h.jpg'
WHERE setting_key = 'background_url';

-- Verify the fix
SELECT team_id, setting_key, setting_value
FROM app_settings
WHERE setting_key = 'background_url';

