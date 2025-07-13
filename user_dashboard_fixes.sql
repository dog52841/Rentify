-- =================================================================
-- USER DASHBOARD & LISTING PAGE FIXES
-- =================================================================
-- Instructions:
-- This script fixes issues on the Listing and User Dashboard pages.
-- 1. Adds a 'view_count' column to your 'listings' table.
-- 2. Creates a function to increment the view count.
-- Please run this entire script in your Supabase SQL Editor exactly once.
-- =================================================================

-- 1. Add view_count column to listings table if it doesn't already exist.
-- This will not fail if the column is already there.
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 2. Create the function to increment a listing's view count.
-- This function is called every time a listing page is loaded.
DROP FUNCTION IF EXISTS public.increment_listing_view_count(p_listing_id bigint);
CREATE OR REPLACE FUNCTION increment_listing_view_count(p_listing_id BIGINT)
RETURNS VOID AS $$
BEGIN
  -- This condition prevents a listing's owner from incrementing the view count.
  IF (SELECT owner_id FROM public.listings WHERE id = p_listing_id) != auth.uid() THEN
    UPDATE public.listings
    SET view_count = view_count + 1
    WHERE id = p_listing_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions for authenticated users to call this function.
GRANT EXECUTE ON FUNCTION public.increment_listing_view_count(bigint) TO authenticated; 