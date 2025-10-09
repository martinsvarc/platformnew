# Admin Payment Management Feature

## Overview
Admins now have the ability to edit and delete payments directly from the Admin page. This provides full control over payment records including the ability to modify amounts, clients, models, chatters, and all other payment details.

## Implementation Details

### 1. API Functions (`/src/api/payments.js`)

#### `updatePayment(paymentId, teamId, updates)`
- Updates an existing payment with new values
- Supports updating all payment fields: amount, client, chatter (user_id), date/time, model, bank, platform, sold items, etc.
- Handles client resolution/creation if a new client name is provided
- Fetches current payment data first, then applies updates

#### `deletePayment(paymentId, teamId)`
- Permanently deletes a payment record from the database
- Requires confirmation before deletion
- Returns the deleted payment ID on success

### 2. Components

#### PaymentEditModal (`/src/components/PaymentEditModal.jsx`)
A comprehensive modal for editing payment details with the following features:
- **Amount field**: Edit payment amount
- **Client field**: Change client name (can create new clients)
- **Chatter dropdown**: Select from active team members
- **Date & Time picker**: Modify when the payment was made
- **Sold (Prodáno)**: Quick buttons + custom input for what was sold
- **Platform**: WhatsApp, FB Stranka, or Other
- **Model dropdown**: Select from available models
- **Bank dropdown**: Select from available bank accounts
- Pre-populates all fields with current payment data
- Validates required fields before saving

#### PaymentManagement (`/src/components/PaymentManagement.jsx`)
Main component for managing payments on the Admin page:
- **Payment Table**: Displays all payments with key details
- **Filters**: Filter by date range (from/to) and platform
- **Edit Button**: Opens PaymentEditModal for the selected payment
- **Delete Button**: Opens confirmation dialog before deleting
- **Pagination**: Shows up to 500 most recent payments
- **Real-time updates**: Refreshes payment list after edit/delete operations

### 3. Database Query Updates (`/src/api/queries.js`)
- Updated `listPayments()` to include `user_id` field
- This allows the edit modal to properly identify and pre-select the correct chatter

### 4. Admin Page Integration (`/src/pages/Admin.jsx`)
- Added PaymentManagement component to the Admin page
- Positioned at the bottom after all other admin widgets
- Only visible to users with admin role (protected by AdminRoute)

## Features

### Edit Payment
1. Admin clicks "✏️ Edit" button on any payment
2. PaymentEditModal opens with all current payment details pre-filled
3. Admin can modify any field
4. Clicking "Save Changes" updates the payment
5. Success toast notification is shown
6. Payment list refreshes automatically

### Delete Payment
1. Admin clicks "🗑️ Delete" button on any payment
2. ConfirmDialog appears with payment details and warning
3. Admin must confirm deletion
4. Payment is permanently removed from database
5. Success toast notification is shown
6. Payment list refreshes automatically

### Filtering
- **Date Range**: Filter payments by from/to dates
- **Platform**: Filter by specific platform or show all
- Results automatically update when filters change

## Access Control
- Only accessible to users with admin role
- Admin page is protected by AdminRoute component
- Regular users cannot see or access this functionality

## User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Intuitive UI**: Follows the existing app design language
- **Toast Notifications**: Clear feedback for all actions
- **Confirmation Dialogs**: Prevents accidental deletions
- **Loading States**: Shows loading indicators during async operations
- **Error Handling**: Displays error messages if operations fail

## Technical Notes

### Security
- All operations require team_id verification
- Updates and deletes are scoped to the user's team
- Server-side validation ensures data integrity

### Data Integrity
- Client resolution works with existing logic (creates or finds clients)
- Date/time handling preserves timezone information
- All numeric values are properly validated

### Performance
- Payment list limited to 500 most recent records
- Filters applied at database level for efficiency
- Modal data loads in parallel (banks, models, users)

## Future Enhancements
Consider adding:
- Bulk edit/delete operations
- Export payments to CSV
- Payment history/audit log
- Advanced search and filtering options
- Payment status management

