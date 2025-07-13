-- =================================================================
-- Admin Panel Fix V3 SQL Script
-- =================================================================
-- This script fixes the get_listing_details function overloading issue and 
-- ensures listings are instantly available without admin approval
-- =================================================================

-- First, drop any existing versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS public.get_listing_details(text);
DROP FUNCTION IF EXISTS public.get_listing_details(uuid);

-- Create a single version of get_listing_details that accepts text
CREATE OR REPLACE FUNCTION get_listing_details(p_listing_id TEXT)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    description TEXT,
    price_per_day NUMERIC,
    location_text TEXT,
    image_urls TEXT[],
    image_360_url TEXT,
    category TEXT,
    owner_id UUID,
    owner_name TEXT,
    owner_avatar_url TEXT,
    owner_is_verified BOOLEAN,
    average_rating NUMERIC,
    review_count BIGINT,
    features JSONB,
    rules JSONB,
    view_count INTEGER,
    is_verified BOOLEAN
) AS $$
BEGIN
    -- Increment view count
    UPDATE public.listings SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_listing_id::UUID;
    
    RETURN QUERY
    SELECT
        l.id,
        l.created_at,
        l.title,
        l.description,
        l.price_per_day,
        COALESCE(l.location_text, l.location) as location_text,
        l.image_urls,
        l.image_360_url,
        l.category,
        l.user_id AS owner_id,
        p.full_name AS owner_name,
        p.avatar_url AS owner_avatar_url,
        p.is_verified AS owner_is_verified,
        COALESCE(lr.average_rating, 0)::NUMERIC as average_rating,
        COALESCE(lr.review_count, 0)::BIGINT as review_count,
        l.features,
        l.rules,
        l.view_count,
        l.is_verified
    FROM
        public.listings l
    JOIN
        public.profiles p ON l.user_id = p.id
    LEFT JOIN
        public.listing_ratings lr ON l.id = lr.listing_id
    WHERE
        l.id = p_listing_id::UUID;
END;
$$ LANGUAGE plpgsql;

-- Update default status for new listings to be 'approved' instead of 'pending'
ALTER TABLE public.listings 
ALTER COLUMN status SET DEFAULT 'approved';

-- Create a function to get featured listings (verified listings with verified owners)
CREATE OR REPLACE FUNCTION get_featured_listings(
    p_limit INT DEFAULT 6
)
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    title text,
    description text,
    price_per_day numeric,
    location_text text,
    image_urls text[],
    owner_id uuid,
    category text,
    owner_name text,
    owner_avatar_url text,
    owner_is_verified boolean,
    average_rating numeric,
    review_count bigint,
    view_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.created_at,
        l.title,
        l.description,
        l.price_per_day,
        COALESCE(l.location_text, l.location) as location_text,
        l.image_urls,
        l.user_id AS owner_id,
        l.category,
        p.full_name AS owner_name,
        p.avatar_url AS owner_avatar_url,
        p.is_verified AS owner_is_verified,
        COALESCE(lr.average_rating, 0)::numeric as average_rating,
        COALESCE(lr.review_count, 0)::bigint as review_count,
        COALESCE(l.view_count, 0) as view_count
    FROM
        public.listings l
    JOIN
        public.profiles p ON l.user_id = p.id
    LEFT JOIN
        public.listing_ratings lr ON l.id = lr.listing_id
    WHERE
        l.is_verified = true AND
        p.is_verified = true
    ORDER BY
        COALESCE(lr.average_rating, 0) DESC,
        l.view_count DESC,
        l.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the updated functions
GRANT EXECUTE ON FUNCTION public.get_listing_details(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_featured_listings(integer) TO authenticated, service_role; 