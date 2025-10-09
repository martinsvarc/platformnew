# Member Confirmation System

## Overview
A comprehensive member confirmation system has been implemented. New members who create an account must be confirmed by an ADMIN before they can log in to the platform.

## Features Implemented

### 1. **Signup Changes** (`src/api/signup.js`)
- New members are automatically assigned `status = 'pending'`
- Admin users are automatically set to `status = 'active'`
- Members with pending status cannot log in until confirmed

### 2. **Login Protection** (`src/api/auth.js`)
- Added check for pending status during login
- Users with pending status receive a clear message: "Váš účet čeká na schválení administrátorem. Počkejte prosím na potvrzení."
- Existing inactive check remains in place

### 3. **Team Members Widget** (`src/components/TeamMembersWidget.jsx`)
Enhanced with:
- **Separate Sections**: Pending members are displayed in a distinct highlighted section at the top
- **Visual Indicators**: 
  - Yellow-bordered cards for pending members
  - Clear "⏳ Čeká na schválení" header
  - Member count shows pending users: "Celkem: X (Y čeká na schválení)"
- **Action Buttons**:
  - **✓ Schválit** (Confirm) - Approves the member and sets status to 'active'
  - **✕ Zamítnout** (Decline) - Rejects the member and soft-deletes them
- **Active Members Section**: Shows all confirmed members with edit/delete functionality

### 4. **API Functions** (`src/api/queries.js`)
Added two new functions:
- `confirmUser(userId, teamId)` - Sets user status to 'active'
- `declineUser(userId, teamId)` - Sets status to 'declined' and soft-deletes the user

### 5. **Database Migration** (`update_user_status.sql`)
- Migration script to set existing users to 'active' status
- Ensures existing users can continue logging in after the system is implemented

## How It Works

### Registration Flow:
1. User creates a new account
2. Status is automatically set to `'pending'`
3. User cannot log in yet

### Admin Confirmation Flow:
1. Admin visits `/admin` page
2. Sees pending members in yellow-highlighted section at top of Team Members Widget
3. Reviews member information (username, email, role)
4. Clicks **✓ Schválit** to approve OR **✕ Zamítnout** to decline
5. On approval: User status changes to `'active'` and can now log in
6. On decline: User is soft-deleted and removed from the list

### Login Flow:
1. User attempts to log in
2. System checks:
   - Valid credentials ✓
   - Not inactive ✓
   - Not pending ✓
3. If pending: Show message "Váš účet čeká na schválení administrátorem"
4. If active: Login successful

## Database Schema
The `users` table already had a `status` field (text type) which is now used for:
- `'pending'` - Awaiting admin confirmation
- `'active'` - Confirmed and can log in
- `'inactive'` - Deactivated account
- `'declined'` - Rejected by admin (also soft-deleted)

## Setup Instructions

### 1. Run Database Migration
```sql
-- Run this SQL to ensure existing users can still log in
UPDATE users 
SET status = 'active' 
WHERE status IS NULL OR status = '';
```

Or run the migration file:
```bash
psql -d your_database -f update_user_status.sql
```

### 2. Test the Flow
1. Create a new test account (as non-admin)
2. Try to log in - should see pending message
3. Log in as admin, go to `/admin`
4. See the new user in the pending section
5. Click "✓ Schválit" to approve
6. Log in as the test user - should now work!

## UI/UX Improvements
- **Color Coding**: Pending users have yellow highlights for visibility
- **Clear Actions**: Prominent confirm/decline buttons
- **Information Display**: Shows username, email, and role for review
- **Confirmation Dialogs**: Uses existing ConfirmDialog for all actions
- **Responsive Design**: Works on all screen sizes
- **Helpful Tips**: Footer text explains the confirmation system

## Security Benefits
- **Prevents Unauthorized Access**: Users can't log in until approved
- **Admin Control**: Full oversight of who joins the platform
- **Audit Trail**: Declined users are soft-deleted (preserved for records)
- **Team Integrity**: Only approved members can see sensitive data

## Notes
- Admin accounts (created via `signupAdmin`) bypass pending status
- Existing users remain 'active' after running migration
- Declined users can be permanently deleted later if needed
- The system works with the existing soft-delete mechanism

