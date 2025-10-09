# Biometric Authentication & Session Persistence

## Overview
The app now includes **Face ID / Touch ID** authentication support and improved session persistence to ensure users stay logged in on mobile devices.

## What's New

### 1. Persistent Login Sessions
- **Enhanced localStorage management**: Session data now includes activity timestamps
- **Activity tracking**: User interactions update the session timestamp to keep it alive
- **Automatic session restoration**: App checks for valid sessions on startup
- **Better error handling**: Invalid sessions are properly cleared

### 2. Biometric Authentication (Face ID / Touch ID)
- **Secure WebAuthn API**: Uses browser's built-in biometric authentication
- **Platform authenticators**: Works with Face ID (iOS), Touch ID (Mac), Windows Hello, Android biometrics
- **No server changes needed**: Credentials stored securely in browser using Web Authentication API
- **Privacy-focused**: No biometric data is sent to the server

## How It Works

### For Users

#### First Time Setup (Mobile)
1. Open the app and login with username/password
2. On the login screen, you'll see a checkbox: "Povolit Face ID / Touch ID pro příště"
3. Check this box before logging in
4. Complete the biometric enrollment when prompted
5. Next time you open the app, you'll see a "Face ID / Touch ID" button

#### Already Logged In
1. Open the app and navigate to the menu
2. Scroll to the bottom before the logout button
3. You'll see "Biometrické ověření" section
4. Click "Aktivovat" to enable biometric login
5. Follow the browser prompts to register your biometric

#### Using Biometric Login
1. Open the app
2. Click "Přihlásit pomocí Face ID / Touch ID" button
3. Authenticate with your biometric (face scan, fingerprint, etc.)
4. You're logged in instantly!

### For Developers

#### Files Added/Modified

**New Files:**
- `src/utils/biometric.js` - Biometric authentication utilities
- `src/components/BiometricSettings.jsx` - Settings widget for managing biometric auth

**Modified Files:**
- `src/contexts/AuthContext.jsx` - Added biometric authentication methods
- `src/pages/Login.jsx` - Added biometric login UI
- `src/components/NavMenu.jsx` - Added biometric settings widget

#### Key Features

**Session Persistence:**
```javascript
// Activity tracking keeps session alive
localStorage.setItem('lastActivity', Date.now().toString())
localStorage.setItem('sessionCreated', Date.now().toString())
```

**Biometric Registration:**
```javascript
const { registerBiometric, biometricAvailable } = useAuth()

if (biometricAvailable) {
  await registerBiometric()
}
```

**Biometric Login:**
```javascript
const { loginWithBiometric } = useAuth()
const result = await loginWithBiometric()
```

#### Browser Compatibility

| Browser | Platform | Support |
|---------|----------|---------|
| Safari | iOS 14+ | ✅ Face ID / Touch ID |
| Safari | macOS | ✅ Touch ID |
| Chrome | Android 7+ | ✅ Fingerprint / Face |
| Chrome | Windows 10+ | ✅ Windows Hello |
| Edge | Windows 10+ | ✅ Windows Hello |

#### Security Notes

1. **No biometric data stored**: The Web Authentication API never exposes actual biometric data
2. **Device-bound**: Credentials are tied to the specific device
3. **User verification required**: Each login requires fresh biometric scan
4. **Fallback available**: Users can always login with username/password
5. **Can be disabled**: Users can remove biometric auth anytime from settings

## Troubleshooting

### Session Not Persisting
- Check if browser is in private/incognito mode (localStorage disabled)
- Verify localStorage is not being cleared by browser settings
- Check browser storage limits aren't exceeded

### Biometric Not Available
- Ensure device has biometric hardware (Face ID, Touch ID, etc.)
- Check browser supports Web Authentication API
- Verify biometric is set up in device settings
- Try using HTTPS (required for WebAuthn)

### Biometric Registration Failed
- Make sure popup/permission wasn't blocked
- Check if another credential already exists (disable and re-enable)
- Verify biometric is working in device settings
- Try refreshing the page and trying again

### Login Loop / Keeps Asking for Login
This should now be fixed with the improved session management. If it still occurs:
1. Clear browser cache and localStorage
2. Login again with "Enable Face ID" checked
3. Check browser console for any errors
4. Verify `localStorage.getItem('userId')` returns a value after login

## Technical Details

### Web Authentication API Flow

1. **Registration:**
   ```
   User Login → Request Biometric → Browser Prompts → Credential Created → Stored in localStorage
   ```

2. **Authentication:**
   ```
   Click Biometric Button → Browser Prompts → Verify Biometric → Get Credential → Fetch User → Login
   ```

### localStorage Structure
```javascript
{
  userId: "123",
  teamId: "456",
  teamSlug: "team-name",
  teamName: "Team Name",
  userData: "{...}",
  lastActivity: "1234567890",
  sessionCreated: "1234567890",
  biometric_enabled: "true",
  biometric_credential: "{id, rawId, userId, username, createdAt}"
}
```

## Future Enhancements

- [ ] Server-side credential storage for multi-device sync
- [ ] Biometric re-authentication for sensitive actions
- [ ] Session timeout configuration
- [ ] Remember multiple accounts on same device
- [ ] Biometric for payment confirmation

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify device biometric settings
3. Try disabling and re-enabling biometric auth
4. Test with username/password as fallback

