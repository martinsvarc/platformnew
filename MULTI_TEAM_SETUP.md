# Multi-Team Account Feature

## Overview
This feature allows administrators to have multiple team profiles under a single email address and username. You can easily switch between teams while maintaining a unified authentication experience with a shared 2FA PIN.

## Key Features

### 1. **Multiple Team Profiles per User**
- One email can have multiple team accounts
- Each team has its own separate profile with its own role and permissions
- Username is unique per team, but email can be shared across teams

### 2. **Shared Authentication**
- **Single Password**: All team profiles under the same email share the same password
- **Single 2FA PIN**: One PIN works across all your team profiles
- **Unified Login**: Log in once and choose your team

### 3. **Team Selection**
- After logging in with multiple teams, you'll see a team selection screen
- Choose which team you want to access
- Switch between teams anytime from the navigation menu

### 4. **Team Switcher in Navigation**
- Located in the navigation menu under the "Administrátor" section
- Shows all your available teams
- Indicates your current active team
- Click to instantly switch to another team

### 5. **Cross-Team Notifications**
- Receive notifications from all your teams regardless of which one you're currently viewing
- Never miss important updates from any of your teams

## How to Use

### Creating a Multi-Team Account

#### As an Admin:
1. **First Team Account** (if you don't have one):
   - Go to the registration page
   - Enter your username, email, and password
   - Complete the 2FA PIN setup

2. **Additional Team Accounts**:
   - Register for the new team using the **same email**
   - You can use the same or different username (username must be unique per team)
   - The system will automatically use your existing password and 2FA PIN
   - Wait for admin approval if registering as a member

### Logging In with Multiple Teams

1. **Enter Credentials**:
   - Go to the login page
   - Enter your username and password

2. **Select Your Team**:
   - If you have multiple teams, you'll see a team selection screen
   - Click on the team you want to access
   - Each team shows:
     - Team name
     - Your role in that team (Administrator, Manager, Member)
     - Profile picture

3. **Verify 2FA PIN**:
   - Enter your PIN code (shared across all teams)
   - Access granted to your selected team

### Switching Between Teams

1. **Open Navigation Menu**:
   - Look for the "Přepnout tým" (Switch Team) option
   - Only visible if you have multiple team accounts

2. **Select New Team**:
   - Click to expand the team list
   - Your current team is highlighted
   - Click on another team to switch

3. **Automatic Reload**:
   - The page automatically reloads with the new team's data
   - All dashboard data updates to show the selected team

## Technical Implementation

### Database Changes

The `enable_multi_team_accounts.sql` migration makes these changes:

```sql
-- Removes unique constraint on email (allows same email in multiple teams)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Creates partial unique index (unique within team, not across teams)
CREATE UNIQUE INDEX users_email_team_unique 
ON users(team_id, email) 
WHERE email IS NOT NULL AND deleted_at IS NULL;

-- Helper function to get all teams for an email
CREATE OR REPLACE FUNCTION get_user_teams(user_email text) ...
```

### API Changes

#### Login Endpoint
- Returns `has_multiple_teams: true` when user has multiple active team profiles
- Includes `available_teams` array with all team profiles
- Password verification uses first profile (all share same password)

#### Switch Team Endpoint
- `switchTeam({ username, teamId })` 
- Updates last_login_at for the selected profile
- Returns the new team's user data

#### Get User Teams Endpoint
- `getUserTeams(username)`
- Returns all team profiles for a username
- Ordered by most recently used

#### Setup PIN Endpoint (Enhanced)
- Syncs PIN across all profiles with the same email
- Updates `pin_hash`, `two_fa_method`, and `two_fa_setup_required` for all related profiles

### Frontend Components

#### TeamSelection Page (`/team-selection`)
- Shows after login when user has multiple teams
- Beautiful card-based UI for each team
- Displays team avatar, name, and role
- Navigation to select team or return to login

#### NavMenu Team Switcher
- Dropdown menu with all available teams
- Shows current team with indicator
- Disabled state while switching
- Auto-reload after team switch

#### AuthContext Enhancements
- `selectTeamProfile(teamId, userId)` - Selects team during login
- `switchTeam(teamId)` - Switches active team
- `loadAvailableTeams()` - Loads all user's teams
- `availableTeams` - State containing all teams

## Security Considerations

1. **Password Sync**: When creating a new team profile with an existing email, the system automatically uses the existing password hash
2. **PIN Sync**: Setting or updating PIN on one profile updates it across all profiles with the same email
3. **Session Management**: Each team switch updates the session but maintains authentication state
4. **Team Isolation**: Each team's data remains completely separate - only the user profile is shared

## Use Cases

### 1. Agency Owner
- Manage multiple client teams
- Switch between teams to check performance
- Maintain separate data per client

### 2. Consultant
- Work with multiple organizations
- Single login for all teams
- Separate roles per organization

### 3. Franchise Manager
- Oversee multiple franchise locations
- Each location as separate team
- Unified dashboard access

## Limitations

1. **Username Per Team**: Username must be unique within each team (can differ between teams)
2. **Email Required**: Email is needed to link multiple team profiles
3. **Admin Access**: Team switcher only shows in admin menu (non-admins see single team only)
4. **Page Reload**: Switching teams requires page reload to update all data properly

## Future Enhancements

Potential improvements for future versions:
- Unified notification center showing all teams
- Quick team preview without full switch
- Team-specific notification settings
- Bulk actions across multiple teams
- Team analytics comparison dashboard

## Troubleshooting

### Issue: Can't see team switcher
**Solution**: 
- Ensure you have multiple active team accounts with the same email
- Check that you're logged in as admin
- Refresh the page to load available teams

### Issue: Team switch fails
**Solution**:
- Check network connection
- Ensure the team profile is active
- Try logging out and logging back in

### Issue: PIN not syncing
**Solution**:
- Ensure all profiles use the same email address
- Re-setup PIN from any of your team profiles
- All profiles will automatically update

## SQL Queries for Admin

### Check user's team profiles:
```sql
SELECT u.id, u.username, u.email, t.name as team_name, u.role, u.status
FROM users u
JOIN teams t ON u.team_id = t.id
WHERE u.email = 'your@email.com'
ORDER BY u.last_login_at DESC;
```

### Find users with multiple teams:
```sql
SELECT email, COUNT(*) as team_count
FROM users
WHERE email IS NOT NULL AND deleted_at IS NULL
GROUP BY email
HAVING COUNT(*) > 1;
```

## Migration Guide

To enable this feature on your database:

1. **Run the migration**:
   ```bash
   psql -d your_database -f enable_multi_team_accounts.sql
   ```

2. **Deploy frontend changes**:
   - All components are included in the main codebase
   - No additional configuration needed

3. **Test with a user**:
   - Create a second team account with an existing user's email
   - Verify login flow shows team selection
   - Test team switching

## Support

For issues or questions about the multi-team feature:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify database migration was applied successfully
4. Check that API endpoints are accessible

---

**Created**: October 10, 2025  
**Version**: 1.0  
**Status**: Production Ready

