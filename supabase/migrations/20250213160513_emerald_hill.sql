/*
  # Update user role to admin

  1. Changes
    - Updates existing user role from 'waiter' to 'admin'
    - Ensures data consistency by only updating if role is 'waiter'
*/

UPDATE profiles
SET role = 'admin'
WHERE role = 'waiter';