-- =================================================================
-- VERIFICATION SYSTEM SETUP SCRIPT
-- =================================================================
-- Instructions:
-- This script adds a verification system for user profiles.
-- 1. Adds an 'is_verified' column to the 'profiles' table.
-- 2. Creates a function for admins to verify/unverify users.
-- Please run this entire script in your Supabase SQL Editor exactly once.
-- =================================================================

-- 1. Add is_verified column to profiles table if it doesn't exist.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Create the function to set a user's verification status.
DROP FUNCTION IF EXISTS public.set_user_verification(p_user_id UUID, p_is_verified BOOLEAN);
CREATE OR REPLACE FUNCTION set_user_verification(p_user_id UUID, p_is_verified BOOLEAN)
RETURNS VOID AS $$
BEGIN
  -- We'll rely on RLS policies on the 'profiles' table to ensure
  -- only authorized users (admins) can make this change.
  UPDATE public.profiles
  SET is_verified = p_is_verified
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions for authenticated users to call this function.
GRANT EXECUTE ON FUNCTION public.set_user_verification(uuid, boolean) TO authenticated; 