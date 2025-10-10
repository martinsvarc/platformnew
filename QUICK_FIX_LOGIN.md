# 🚨 Quick Fix for Login Issues After Neon Downtime

## Problem
After Neon database exceeded limits, some users can't login due to corrupted localStorage.

## Solution for Users Who Can't Login

### Option 1: Clear Browser Storage (Recommended)
1. Press `F12` to open DevTools
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under "Storage" section on the left, click **Clear site data**
4. Check all boxes and click **Clear site data**
5. Close DevTools
6. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
7. Try login again

### Option 2: Incognito/Private Mode
1. Open an Incognito/Private window
2. Try logging in there
3. If it works, then clear storage in normal browser (see Option 1)

### Option 3: Different Browser
Try logging in from a different browser temporarily.

---

## Fix Background Image 404 Error

Run this SQL on your Neon database:

```sql
-- Fix the truncated background URL
UPDATE app_settings
SET setting_value = 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77bea777fb41bf5438086e_ubbh2h.jpg'
WHERE setting_key = 'background_url';

-- Verify it worked
SELECT team_id, setting_key, setting_value, length(setting_value) as url_length
FROM app_settings
WHERE setting_key = 'background_url';
```

The URL should be 118 characters long, not 101.

---

## For Admins: Reset User's 2FA if Needed

If a user still can't login after clearing storage:

```sql
-- Check user status
SELECT id, username, status, two_fa_method, two_fa_setup_required
FROM users 
WHERE username = 'THEIR_USERNAME';

-- If needed, reset their 2FA
UPDATE users 
SET two_fa_method = NULL,
    two_fa_setup_required = true,
    pin_hash = NULL
WHERE username = 'THEIR_USERNAME';
```

---

## Prevention

To prevent this in the future, monitor your Neon usage and upgrade before hitting limits.

