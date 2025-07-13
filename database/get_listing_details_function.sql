-- =================================================================
-- GET_LISTING_DETAILS FUNCTION
-- =================================================================
-- Instructions:
-- This script creates the `get_listing_details` function in your public schema.
-- This function is used to fetch detailed information about a specific listing.
-- =================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_listing_details;

CREATE OR REPLACE FUNCTION public.get_listing_details(p_listing_id text)
RETURNS TABLE (
    id text,
    title text,
    description text,
    category text,
    price_per_day numeric,
    images_urls text[],
    image_360_url text,
    created_at timestamp with time zone,
    owner_id text,
    owner_name text,
    owner_avatar_url text,
    owner_is_verified boolean,
    owner_joined_at timestamp with time zone,
    location_lat double precision,
    location_lng double precision,
    location_text text,
    average_rating numeric,
    review_count bigint,
    view_count integer,
    availability_status text,
    features jsonb,
    rules jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id::text,
        l.title,
        l.description,
        l.category,
        l.price_per_day,
        l.images_urls,
        l.image_360_url,
        l.created_at,
        l.owner_id::text,
        p.full_name as owner_name,
        p.avatar_url as owner_avatar_url,
        p.is_verified as owner_is_verified,
        p.created_at as owner_joined_at,
        ST_Y(l.location_geom::geometry) as location_lat,
        ST_X(l.location_geom::geometry) as location_lng,
        l.location_text,
        COALESCE(lr.average_rating, 0)::numeric as average_rating,
        COALESCE(lr.review_count, 0)::bigint as review_count,
        l.view_count,
        l.availability_status,
        l.features,
        l.rules
    FROM 
        public.listings l
        JOIN public.profiles p ON l.owner_id = p.id
        LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
    WHERE 
        l.id::text = p_listing_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_listing_details(text) TO authenticated, service_role; 