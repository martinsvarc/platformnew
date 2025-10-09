# Deployment Guide - Biometric Authentication

## Requirements for Biometric Authentication (Touch ID/Face ID)

Biometric authentication using the Web Authentication API has strict requirements that **must** be met for it to work in production:

### 1. 🔒 HTTPS is Mandatory

The Web Authentication API **only works over HTTPS** (except for `localhost` during development).

**Why?** Security. Biometric credentials are sensitive and the browser enforces HTTPS to prevent man-in-the-middle attacks.

### 2. ✅ Deployment Platforms that Support HTTPS by Default

Most modern hosting platforms provide free HTTPS automatically:

#### **Vercel** (Recommended)
- ✅ Automatic HTTPS on all deployments
- ✅ Free SSL certificates
- ✅ Custom domain support with automatic SSL
- **Setup:** Deploy via `vercel` CLI or connect your GitHub repo

#### **Netlify**
- ✅ Automatic HTTPS on all deployments
- ✅ Free SSL certificates
- ✅ Custom domain support with automatic SSL
- **Setup:** Deploy via `netlify` CLI or connect your GitHub repo

#### **GitHub Pages**
- ✅ HTTPS supported (must enable in settings)
- ⚠️ Only works with static sites
- **Setup:** Enable HTTPS in repository settings

#### **Railway**
- ✅ Automatic HTTPS
- ✅ Free tier available
- **Setup:** Deploy via Railway dashboard

### 3. 🖥️ Device & Browser Support

Biometric authentication requires:
- **macOS:** Touch ID or Face ID (MacBook Pro/Air with Touch Bar, or iMac with Touch ID)
- **iOS:** Touch ID or Face ID enabled
- **Windows:** Windows Hello
- **Android:** Fingerprint or Face unlock

**Supported Browsers:**
- ✅ Safari (best support on iOS/macOS)
- ✅ Chrome (macOS, Windows, Android)
- ✅ Edge (Windows, macOS)
- ✅ Firefox (partial support)

### 4. 📋 Pre-Deployment Checklist

Before deploying your app, ensure:

- [ ] Your hosting platform provides HTTPS
- [ ] Custom domain (if used) has SSL certificate configured
- [ ] The app is built in production mode (`npm run build`)
- [ ] Environment variables are properly set
- [ ] Database connection uses SSL if remote

## How to Deploy

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Verify HTTPS:**
   - Your deployment URL will be `https://your-app.vercel.app`
   - HTTPS is automatic!

### Option 2: Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build your app:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

4. **Verify HTTPS:**
   - Your deployment URL will be `https://your-app.netlify.app`
   - HTTPS is automatic!

## Troubleshooting

### Issue: Touch ID works on localhost but not on production (or vice versa)

**Cause:** **Domain Mismatch** - Biometric credentials are tied to the domain where they were registered.

**Symptoms:**
- Login → Touch ID screen → Use Touch ID → Redirected back to login
- Works on one domain (e.g., localhost) but not another (e.g., yourapp.vercel.app)

**Solution:**
1. The app will automatically detect this and show a warning
2. Click "Přihlásit se heslem a nastavit znovu" (Login with password and set up again)
3. Log in with your regular password
4. Go to Settings and enable Touch ID again on the new domain
5. The new credentials will work on this domain

**Why this happens:**
- Touch ID credentials registered on `localhost` won't work on `yourapp.vercel.app`
- Each domain requires its own credential registration
- This is a security feature of the Web Authentication API
- **You need to set up Touch ID separately for each domain you use**

**Quick Fix:**
The app now automatically detects domain mismatches and clears invalid credentials. Just log in with password and re-enable Touch ID.

### Issue: "Biometric authentication is not available"

**Check:**
1. Open your Admin page and scroll to **Biometric Diagnostic Tool**
2. Review the diagnostic results
3. Common issues:
   - ⚠️ Not using HTTPS (must use https://)
   - ⚠️ Browser doesn't support Web Authentication API
   - ⚠️ Device doesn't have Touch ID/Face ID hardware
   - ⚠️ Touch ID/Face ID is disabled in system settings

### Issue: "Secure context required"

**Solution:** Ensure you're accessing the site via `https://` not `http://`

### Issue: Works on localhost but not in production

**Cause:** Your production deployment isn't using HTTPS

**Solution:**
1. Check your deployment platform settings
2. Ensure SSL certificate is active
3. If using a custom domain, verify DNS is configured correctly

### Issue: "Platform authenticator not available"

**Possible causes:**
- Device doesn't have Touch ID/Face ID
- Touch ID/Face ID is disabled in system preferences
- Browser doesn't support platform authenticators
- Using an external keyboard on MacBook (Touch Bar not accessible)

## Testing Biometric Authentication

1. **Deploy to HTTPS environment** (Vercel, Netlify, etc.)
2. **Navigate to Admin page**
3. **Scroll to "Biometric Diagnostic Tool"**
4. **Check all items show green ✅**
5. **Try setting up Touch ID in Settings**

## Current Configuration

This app is configured to work with:
- ✅ Vercel (via `vercel.json`)
- ✅ Netlify (via `netlify.toml`)
- ✅ Dynamic `rpId` based on hostname

The biometric implementation automatically detects the hostname and configures the Relying Party ID (rpId) accordingly.

## Security Notes

- Biometric credentials are stored locally in the browser (localStorage)
- The actual biometric data (fingerprint/face) never leaves the device
- Web Authentication API uses public-key cryptography
- Consider implementing server-side challenge/response for production
- For production apps, store credential IDs in your database and verify server-side

## Need Help?

1. Check the **Biometric Diagnostic Tool** in the Admin page
2. Review browser console for detailed error messages
3. Verify HTTPS is enabled and working
4. Test on different devices/browsers to isolate the issue

---

📚 **Resources:**
- [Web Authentication API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [Can I Use - Web Authentication](https://caniuse.com/webauthn)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

