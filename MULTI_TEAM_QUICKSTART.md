# Multi-Team Feature - Quick Start Guide

## 🚀 Quick Start

### Step 1: Run the Database Migration
```bash
psql -d your_database_name -f enable_multi_team_accounts.sql
```

This removes the unique email constraint and allows one email to have multiple team accounts.

### Step 2: Create Your Second Team Account

As an admin, you have two options:

**Option A: Register as Admin in New Team**
1. Log out of your current account
2. Go to `/adminstart` or the registration page
3. Use the **same email** as your existing account
4. Enter a username (can be same or different)
5. Enter your password (the system will use your existing password automatically)
6. Complete registration

**Option B: Have Another Admin Create Your Account**
1. Ask an admin of the target team to create an account for you
2. Provide them your existing email
3. The system will automatically use your existing password and PIN

### Step 3: Log In with Multiple Teams

1. Go to login page and enter your credentials
2. You'll see a **Team Selection** screen
3. Choose which team you want to access
4. Enter your PIN code (same PIN for all teams)
5. You're in!

### Step 4: Switch Between Teams

1. Open the navigation menu
2. Look for **"Přepnout tým"** (Switch Team) under the admin section
3. Click to expand and see all your teams
4. Click on any team to switch to it
5. Page will reload with the new team's data

## ✨ Key Features

✅ **Single Login** - One email, one password, one PIN for all teams  
✅ **Easy Switching** - Switch between teams from the navigation menu  
✅ **Shared 2FA** - Your PIN works across all team accounts  
✅ **Independent Data** - Each team's data stays completely separate  
✅ **Cross-Team Notifications** - Get notifications from all your teams  

## 📋 What Was Implemented

### Database Layer
- ✅ Removed unique constraint on email field
- ✅ Added partial unique index (email unique per team only)
- ✅ Created helper function `get_user_teams()`
- ✅ Migration file: `enable_multi_team_accounts.sql`

### Backend API
- ✅ Updated login to detect and return multiple teams
- ✅ Added `getUserTeams()` endpoint
- ✅ Added `getUserTeamsByEmail()` endpoint
- ✅ Added `switchTeam()` endpoint
- ✅ Enhanced `setupPIN()` to sync across all profiles

### Frontend
- ✅ Created `TeamSelection` page for choosing teams after login
- ✅ Added team switcher dropdown in `NavMenu`
- ✅ Updated `AuthContext` with multi-team support
- ✅ Updated `Login` page to handle team selection flow
- ✅ Added route for `/team-selection`
- ✅ Added translations (English and Czech)

### Files Modified/Created
**New Files:**
- `/Users/m/platformnew/enable_multi_team_accounts.sql`
- `/Users/m/platformnew/src/pages/TeamSelection.jsx`
- `/Users/m/platformnew/MULTI_TEAM_SETUP.md`
- `/Users/m/platformnew/MULTI_TEAM_QUICKSTART.md`

**Modified Files:**
- `/Users/m/platformnew/src/api/auth.js` - Backend auth logic
- `/Users/m/platformnew/api/auth.js` - Serverless function
- `/Users/m/platformnew/src/api/authClient.js` - Frontend API client
- `/Users/m/platformnew/src/api/signup.js` - Backend signup logic
- `/Users/m/platformnew/api/signup.js` - Serverless signup function
- `/Users/m/platformnew/src/contexts/AuthContext.jsx` - Auth state management
- `/Users/m/platformnew/src/components/NavMenu.jsx` - Navigation with team switcher
- `/Users/m/platformnew/src/pages/Login.jsx` - Login flow
- `/Users/m/platformnew/src/App.jsx` - Routing
- `/Users/m/platformnew/src/i18n/locales/en.json` - English translations
- `/Users/m/platformnew/src/i18n/locales/cs.json` - Czech translations

## 🧪 Testing the Feature

### Test Scenario 1: Create Multi-Team Account
1. Note your current email and username
2. Register for a new team with the same email
3. Check that signup succeeds without password prompt

### Test Scenario 2: Login with Multiple Teams
1. Log in with your credentials
2. Verify team selection screen appears
3. Select a team and verify you're logged into that team
4. Check that team name displays correctly in navigation

### Test Scenario 3: Switch Teams
1. Log in and navigate to any page
2. Open navigation menu
3. Click "Přepnout tým" (Switch Team)
4. Select different team
5. Verify page reloads with new team data

### Test Scenario 4: Shared PIN
1. Set up PIN on one team profile
2. Switch to another team
3. Log out and log back in
4. Verify same PIN works for both teams

## 🔧 Troubleshooting

### "Team switcher not showing"
- Ensure you have multiple active team accounts
- Check you're logged in as admin
- Try refreshing the page

### "Cannot create second account with same email"
- Make sure database migration was run
- Check for any database errors in console
- Verify the unique constraint was removed

### "PIN not syncing between teams"
- Ensure both accounts use exact same email
- Try resetting PIN from one account
- Check database to verify email matches exactly

## 📚 Documentation

For full documentation, see: `MULTI_TEAM_SETUP.md`

## 🎯 Next Steps

1. **Deploy to production**:
   - Run database migration
   - Deploy updated code
   - Test with your account

2. **Create your multi-team accounts**:
   - Register for additional teams
   - Test the login flow
   - Try switching between teams

3. **Monitor and optimize**:
   - Watch for any error logs
   - Collect user feedback
   - Consider future enhancements

---

**Feature Status**: ✅ Complete and Ready for Testing  
**Last Updated**: October 10, 2025

