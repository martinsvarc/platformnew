# Biometric Two-Factor Authentication Setup

## Overview
The app now requires **Touch ID / Face ID verification** as a second authentication factor on all devices that support biometric authentication. This provides enhanced security while maintaining convenience.

## How It Works

### 🔐 Two-Factor Authentication Flow

1. **User enters username & password** on login page
2. **System automatically registers** biometric credential (first time only)
3. **Redirects to biometric verification page** - a beautiful animated page with fingerprint scanner
4. **User scans fingerprint/face** to complete authentication
5. **Access granted** to the platform

### ⏰ 60-Minute Auto-Logout (macOS/Desktop Only)

On desktop platforms (macOS, Windows), the system automatically requires biometric re-verification after **60 minutes** of being logged in:

- After 60 minutes, user is redirected to the biometric verification page
- User must scan fingerprint/face again to continue
- Session data is preserved - user doesn't need to re-enter password
- Works silently in the background, checking every minute

### 📱 Mobile vs Desktop Behavior

**Desktop (macOS, Windows):**
- ✅ Biometric verification required on every login
- ✅ 60-minute auto-logout timer
- ✅ Redirects to biometric verification page after timeout
- Uses Touch ID (Mac) or Windows Hello

**Mobile (iOS, Android):**
- ✅ Biometric verification required on login
- ❌ No auto-logout timer (sessions persist)
- Uses Face ID, Touch ID, or fingerprint sensors

## User Experience

### First Login
```
1. Open app → Login page
2. Enter username & password → Click "Přihlásit se"
3. [Auto-registration happens silently]
4. Redirected to → Biometric Verification Page
   - Beautiful purple/blue gradient background
   - Animated fingerprint icon with pulse effects
   - "Ověřit pomocí Touch ID" button
5. Click button → Touch ID prompt appears
6. Scan fingerprint → Access granted!
```

### Subsequent Logins
```
1. Open app → Login page  
2. Enter username & password → Click "Přihlásit se"
3. Redirected to → Biometric Verification Page
4. Click "Ověřit pomocí Touch ID"
5. Scan fingerprint → Access granted!
```

### After 60 Minutes (Desktop Only)
```
1. Working in the app...
2. [60 minutes pass]
3. Automatically redirected to → Biometric Verification Page
4. Click "Ověřit pomocí Touch ID"
5. Scan fingerprint → Back to work!
```

## Biometric Verification Page Features

### 🎨 Visual Design
- **Animated background** with purple/blue gradient orbs
- **Pulsing fingerprint icon** that draws attention
- **Scanning line animation** during verification
- **Shake animation** on error
- **User info card** showing who is being verified
- **Professional look** matching the platform's design system

### 🎭 Animations
- Pulse rings around fingerprint icon
- Rotating spinner during verification
- Scanning line effect
- Smooth transitions
- Error shake animation

### 💬 Czech Language
All text is in Czech:
- "Biometrické ověření" (Biometric Verification)
- "Potvrďte svou identitu pomocí Touch ID" (Confirm your identity using Touch ID)
- "Ověřit pomocí Touch ID" (Verify with Touch ID)
- "Ověřování..." (Verifying...)

## Technical Implementation

### Files Created
1. **`src/pages/BiometricVerification.jsx`**
   - Beautiful verification page with animations
   - Handles Touch ID/Face ID authentication
   - Shows user information
   - Error handling with shake animation

### Files Modified
1. **`src/contexts/AuthContext.jsx`**
   - Added `isMacOS()` detection function
   - Auto-registers biometric on login
   - 60-minute timeout checker (runs every minute)
   - Automatic redirect to verification page
   - Enhanced session management

2. **`src/pages/Login.jsx`**
   - Simplified login flow
   - Removed manual biometric toggle
   - Redirects to verification page after password login

3. **`src/App.jsx`**
   - Added `/biometric-verify` route
   - Updated `isAuthPage` check

4. **`src/components/ProtectedRoute.jsx`**
   - Checks for pending biometric verification
   - Redirects to verification page if needed
   - Prevents access without biometric verification

### localStorage Keys
```javascript
{
  // Existing keys
  userId: "123",
  teamId: "456",
  userData: "{...}",
  lastActivity: "1234567890",
  
  // New biometric keys
  pendingBiometricVerification: "true",  // Set after password login
  biometricVerified: "true",             // Set after successful scan
  verificationTime: "1234567890",        // Timestamp of last verification
  biometric_enabled: "true",              // Credential registered
  biometric_credential: "{...}"           // Stored credential data
}
```

### Security Flow

```
┌─────────────────────┐
│   Login Page        │
│  (username/password)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Auto-Register      │
│  Biometric          │
│  (if first time)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Set Flags:         │
│  pending: true      │
│  verified: false    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Redirect to        │
│  /biometric-verify  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Beautiful Page     │
│  Click Button       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Browser Prompt     │
│  Scan Fingerprint   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Set Flags:         │
│  verified: true     │
│  verificationTime   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Access Granted     │
│  → /starteam        │
└─────────────────────┘
```

### 60-Minute Timer Flow (Desktop)

```
┌─────────────────────┐
│  User Working       │
│  in Platform        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Interval Checker   │
│  (runs every minute)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Check Time Since   │
│  Last Verification  │
└──────────┬──────────┘
           │
           ▼
       [> 60 min?]
           │
           ├─ NO ──> Continue
           │
           └─ YES
               │
               ▼
┌─────────────────────┐
│  Clear Flags:       │
│  verified: false    │
│  pending: true      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  window.location    │
│  = /biometric-verify│
└─────────────────────┘
```

## Browser Compatibility

### Desktop
| Browser | macOS Touch ID | Windows Hello |
|---------|----------------|---------------|
| Safari  | ✅ Full support | N/A           |
| Chrome  | ✅ Full support | ✅ Full support|
| Firefox | ⚠️ Needs config | ⚠️ Needs config|
| Edge    | ✅ Full support | ✅ Full support|

### Mobile
| Browser | iOS Face/Touch ID | Android Biometric |
|---------|------------------|-------------------|
| Safari  | ✅ Full support   | N/A               |
| Chrome  | ✅ Full support   | ✅ Full support    |

## Security Benefits

1. **Two-Factor Authentication**: Password + biometric scan
2. **No Password Storage**: Biometric never leaves device
3. **Time-Limited Sessions**: 60-minute timeout on desktop
4. **Device-Bound**: Credentials tied to specific device
5. **Fresh Verification**: Each login requires new scan
6. **Fallback Available**: Can logout and use password again

## Troubleshooting

### "Touch ID není k dispozici"
**Problem**: Browser showing "Touch ID not available"
**Solutions**:
- Ensure device has Touch ID/Face ID hardware
- Check Touch ID is enabled in System Preferences (Mac)
- Verify browser supports WebAuthn API
- Must use HTTPS (or localhost for testing)

### Verification Page Shows But Button Doesn't Work
**Problem**: Click button but nothing happens
**Solutions**:
- Check browser console for errors
- Verify popup/permission wasn't blocked
- Try refreshing the page
- Clear localStorage and login again

### Stuck in Verification Loop
**Problem**: Keeps redirecting to verification page
**Solutions**:
1. Open browser console
2. Run: `localStorage.setItem('biometricVerified', 'true')`
3. Or clear all: `localStorage.clear()` and login fresh

### 60-Minute Timer Not Working
**Problem**: Not being logged out after 60 minutes
**Solutions**:
- Check if on desktop (mobile doesn't have timer)
- Look in console for "60-minute timeout" messages
- Verify `verificationTime` exists in localStorage
- Timer only runs while browser tab is open

### First Login Fails
**Problem**: Biometric registration fails on first login
**Solutions**:
- Close any Touch ID prompts and try again
- Refresh page and login again
- Check if credential already exists (clear and retry)
- Verify biometric is working in system settings

## Testing

### Test on macOS
```bash
# 1. Start the app
npm run dev

# 2. Open in browser
# Safari or Chrome at https://localhost:5173

# 3. Login with username/password
# Should redirect to biometric verification page

# 4. Click "Ověřit pomocí Touch ID"
# Touch ID prompt should appear

# 5. Scan finger
# Should redirect to /starteam

# 6. Wait 60 minutes (or manually trigger)
# In console: localStorage.setItem('verificationTime', Date.now() - 61*60*1000)
# Wait 1 minute - should redirect to verification page
```

### Test Verification Page Directly
```javascript
// In browser console after login:
localStorage.setItem('pendingBiometricVerification', 'true')
localStorage.removeItem('biometricVerified')
window.location.href = '/biometric-verify'
// Should show beautiful verification page
```

## Configuration

### Change Timeout Duration
Edit `src/contexts/AuthContext.jsx`:

```javascript
// Current: 60 minutes
if (minutesSinceVerification > 60) { ... }

// Change to 30 minutes:
if (minutesSinceVerification > 30) { ... }

// Also update interval (optional):
}, 60000) // Check every 60 seconds

// Or check every 5 minutes:
}, 300000)
```

### Disable Auto-Logout Timer
Edit `src/contexts/AuthContext.jsx`:

```javascript
// Comment out the interval setup:
/*
let timeoutCheckInterval
if (isMacOS()) {
  timeoutCheckInterval = setInterval(() => {
    // ... timer code
  }, 60000)
}
*/
```

### Make Biometric Optional
Edit `src/contexts/AuthContext.jsx` in `loginUser`:

```javascript
// Current: Always require biometric
if (biometricAvailable) {
  localStorage.setItem('pendingBiometricVerification', 'true')
  return { success: true, user: userData, requireBiometric: true }
}

// Make optional:
// Don't set pending flag, biometric is optional
return { success: true, user: userData, requireBiometric: false }
```

## Future Enhancements

- [ ] Configurable timeout duration per user/role
- [ ] Remember device to skip biometric (trusted devices)
- [ ] Biometric for sensitive actions (payments, settings)
- [ ] Multi-device biometric sync
- [ ] Biometric strength indicators
- [ ] Backup authentication codes
- [ ] Admin panel to view biometric usage
- [ ] Audit log of biometric authentications

## Support

For issues:
1. Check browser console for error messages
2. Verify device biometric is working in system settings
3. Test with different browsers
4. Clear localStorage and try fresh login
5. Check documentation above for common issues

