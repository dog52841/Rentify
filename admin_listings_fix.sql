-- =================================================================
-- RENTIFY ADMIN LISTINGS FIX SCRIPT
-- =================================================================
-- Instructions:
-- 1. This script fixes the bigint/UUID mismatch for listings.
-- 2. Run this entire script in your Supabase SQL Editor exactly once.
-- =================================================================

-- Drop old functions to prevent errors
DROP FUNCTION IF EXISTS public.get_all_listings_admin();
DROP FUNCTION IF EXISTS public.set_listing_status(p_listing_id bigint, p_status text, p_reason text);
DROP FUNCTION IF EXISTS public.set_listing_verification(p_listing_id bigint, p_is_verified boolean);


-- Function to get all listings for the admin dashboard
CREATE OR REPLACE FUNCTION get_all_listings_admin()
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    created_at TIMESTAMPTZ,
    status TEXT,
    is_verified BOOLEAN,
    rejection_reason TEXT,
    owner_id UUID,
    owner_full_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.title,
        l.created_at,
        l.status,
        l.is_verified,
        l.rejection_reason,
        l.owner_id,
        p.full_name as owner_full_name
    FROM
        public.listings l
    LEFT JOIN
        public.profiles p ON l.owner_id = p.id
    ORDER BY
        l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to set a listing's status
CREATE OR REPLACE FUNCTION set_listing_status(p_listing_id BIGINT, p_status TEXT, p_reason TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE public.listings 
  SET 
    status = p_status,
    rejection_reason = p_reason
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to set a listing's verification status
CREATE OR REPLACE FUNCTION set_listing_verification(p_listing_id BIGINT, p_is_verified BOOLEAN)
RETURNS void AS $$
BEGIN
  UPDATE public.listings 
  SET is_verified = p_is_verified
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_all_listings_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_listing_status(p_listing_id bigint, p_status text, p_reason text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_listing_verification(p_listing_id bigint, p_is_verified boolean) TO authenticated; 