-- Migration: Update existing users to have 'active' status if status is null
-- This ensures existing users can continue logging in after the confirmation system is added

-- Update all users without a status to 'active'
UPDATE users 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Note: New users will be created with 'pending' status and must be approved by admins

