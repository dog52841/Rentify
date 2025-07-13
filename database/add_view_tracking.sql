-- This script adds view tracking functionality to listings.

-- 1. Add a view_count column to the listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0;

-- 2. Create a function to increment the view count for a specific listing
CREATE OR REPLACE FUNCTION increment_listing_view_count(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.listings
    SET view_count = view_count + 1
    WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execution rights for the function
GRANT EXECUTE ON FUNCTION increment_listing_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_view_count(UUID) TO service_role; 