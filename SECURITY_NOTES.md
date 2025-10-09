# Security Notes - 2FA System

## 🔐 Security Model

### What /clear-storage Does
- **Clears browser localStorage only** (local to that specific browser/device)
- **Does NOT modify the database**
- User must still provide valid username + password to login
- After clearing, user can set up fresh 2FA

### What It Does NOT Do
- Does not bypass password authentication
- Does not modify server-side user data
- Does not grant access without credentials

## 🚨 Attack Scenarios & Mitigations

### Scenario 1: Physical Access to Logged-In Computer
**Attack:** Someone with physical access tries to hijack 2FA
**Mitigation:** 
- ✅ `/clear-storage` only works when NOT logged in
- ✅ Attacker must log you out first (you'd notice)
- ✅ Still requires password to login
- 🔒 **Best Practice:** Lock your computer when away (Cmd+Ctrl+Q on Mac, Win+L on Windows)

### Scenario 2: Stolen Password
**Attack:** Attacker knows your password AND has physical access
**Mitigation:**
- ⚠️ If password is compromised, attacker can access account regardless of 2FA reset
- 🔒 **Solution:** Change your password immediately
- 🔒 **Contact Admin:** Have admin reset your 2FA from the dashboard
- 💡 **Admin can see:** When 2FA was last reset (audit trail)

### Scenario 3: Domain Mismatch (Legitimate Use)
**Use Case:** You set up 2FA on localhost, now stuck on production
**Solution:**
- ✅ Go to `/clear-storage` (while logged out)
- ✅ Clear 2FA data
- ✅ Login with password
- ✅ Set up 2FA fresh on production domain

## 🛡️ Security Best Practices

### For Users
1. **Lock Your Computer:** Always lock screen when away
2. **Strong Passwords:** Use unique, complex passwords
3. **One Device:** Don't share devices or login credentials
4. **Report Suspicious Activity:** If logged out unexpectedly, contact admin
5. **Password Security:** If compromised, change password immediately

### For Admins
1. **Monitor 2FA Changes:** Check when users reset 2FA
2. **Reset 2FA Button:** Use "Reset 2FA" button in Team Members dashboard
3. **Investigate Anomalies:** Unexpected 2FA resets should be investigated
4. **User Education:** Inform users about security best practices

## 🔑 What Actually Protects Your Account

1. **Password** (Primary security)
   - Without password, attacker cannot login
   - 2FA is secondary authentication

2. **Physical Device Security**
   - Lock screen when away
   - Don't leave computer unattended while logged in
   - Use full-disk encryption

3. **2FA as Additional Layer**
   - Protects against remote password theft
   - Requires physical device (Touch ID) or knowledge (PIN)
   - But if both password AND physical access, account is at risk

## 📋 If You Suspect Compromise

### Immediate Actions
1. **Change Password** immediately
2. **Contact Admin** to reset 2FA
3. **Check Account Activity** for unauthorized changes
4. **Review Recent Logins** (if logging is enabled)

### Admin Actions
1. Navigate to Admin → Team Members
2. Click "Reset 2FA" for the affected user
3. Force user to set up 2FA again on next login
4. Investigate any suspicious activity

## 💡 Why This Design?

**Tradeoff:** Emergency recovery vs. Perfect security
- Without `/clear-storage`: Users get permanently locked out (domain mismatch)
- With `/clear-storage`: Small risk if password is compromised
- **We choose:** User accessibility + password protection

**Alternative Approaches Considered:**
1. ❌ No recovery page → Users get locked out permanently
2. ❌ Email-based recovery → Requires email system integration
3. ✅ **Current:** localStorage reset + password required → Balanced approach

## 🎯 Bottom Line

**Your account security depends on:**
1. **Password strength** (most important)
2. **Physical device security** (lock your screen)
3. **2FA** (additional protection layer)

**The `/clear-storage` page does NOT:**
- Bypass password authentication
- Grant unauthorized access
- Weaken security if password is secure

**If someone has:**
- ❌ Just physical access → Can't login (needs password)
- ❌ Just your password → Can't login (needs 2FA or can't access /clear-storage if you're logged in)
- ⚠️ Both password AND physical access → Account is at risk (but this is true with or without /clear-storage)

**Solution if compromised:** Change password immediately + Admin resets 2FA

