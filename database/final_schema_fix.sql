-- v4 Final Schema Fix
-- This script ensures all tables and relationships are correctly set up.
-- Running this script should resolve schema-related errors.

-- 1. Ensure the user_reviews table exists and is correctly structured.
CREATE TABLE IF NOT EXISTS public.user_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    booking_id bigint,
    reviewer_id uuid,
    reviewee_id uuid,
    rating integer NOT NULL,
    review_text text,
    listing_id uuid,
    CONSTRAINT user_reviews_pkey PRIMARY KEY (id)
);

-- 2. Add location_text to listings table for display purposes.
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS location_text TEXT;

-- 3. Reliably add all foreign key constraints to user_reviews.
-- We use DROP CONSTRAINT IF EXISTS to allow this script to be re-run safely.

ALTER TABLE public.user_reviews
DROP CONSTRAINT IF EXISTS user_reviews_booking_id_fkey,
ADD CONSTRAINT user_reviews_booking_id_fkey
FOREIGN KEY (booking_id) REFERENCES public.bookings (id) ON DELETE CASCADE;

ALTER TABLE public.user_reviews
DROP CONSTRAINT IF EXISTS user_reviews_listing_id_fkey,
ADD CONSTRAINT user_reviews_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES public.listings (id) ON DELETE CASCADE;

ALTER TABLE public.user_reviews
DROP CONSTRAINT IF EXISTS user_reviews_reviewee_id_fkey,
ADD CONSTRAINT user_reviews_reviewee_id_fkey
FOREIGN KEY (reviewee_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.user_reviews
DROP CONSTRAINT IF EXISTS user_reviews_reviewer_id_fkey,
ADD CONSTRAINT user_reviews_reviewer_id_fkey
FOREIGN KEY (reviewer_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- 4. Clean up old, unused functions to prevent conflicts.
DROP FUNCTION IF EXISTS get_listings_with_details();

-- 5. Recreate the primary function for browsing listings with all data.
DROP FUNCTION IF EXISTS get_listings_with_ratings(p_search_term text, p_category text, p_min_price numeric, p_max_price numeric, p_min_rating numeric, p_sort_by text, p_user_lat double precision, p_user_lon double precision, p_nearby_radius double precision);
CREATE OR REPLACE FUNCTION get_listings_with_ratings(
    p_search_term TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT 0,
    p_max_price NUMERIC DEFAULT 999999,
    p_min_rating NUMERIC DEFAULT 0,
    p_sort_by TEXT DEFAULT 'created_at-desc',
    p_user_lat DOUBLE PRECISION DEFAULT NULL,
    p_user_lon DOUBLE PRECISION DEFAULT NULL,
    p_nearby_radius INT DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    created_at timestamp with time zone,
    title text,
    price_per_day numeric,
    images_urls text[],
    category text,
    owner_id uuid,
    owner_name text,
    owner_avatar_url text,
    average_rating numeric,
    location geometry,
    location_text text
) AS $$
DECLARE
    sort_column TEXT;
    sort_direction TEXT;
BEGIN
    -- Parse sort_by parameter
    SELECT split_part(p_sort_by, '-', 1) INTO sort_column;
    SELECT split_part(p_sort_by, '-', 2) INTO sort_direction;

    RETURN QUERY
    WITH listing_ratings AS (
        SELECT
            ur.listing_id,
            AVG(ur.rating) as avg_rating
        FROM public.user_reviews ur
        GROUP BY ur.listing_id
    )
    SELECT
        l.id,
        l.created_at,
        l.title,
        l.price_per_day,
        l.images_urls,
        l.category,
        l.owner_id,
        p.full_name AS owner_name,
        p.avatar_url AS owner_avatar_url,
        COALESCE(lr.avg_rating, 0) AS average_rating,
        l.location,
        l.location_text
    FROM
        public.listings l
    JOIN
        public.profiles p ON l.owner_id = p.id
    LEFT JOIN
        listing_ratings lr ON l.id = lr.listing_id
    WHERE
        (p_search_term IS NULL OR l.title ILIKE '%' || p_search_term || '%')
    AND
        (p_category IS NULL OR l.category = p_category)
    AND
        l.price_per_day >= p_min_price
    AND
        l.price_per_day <= p_max_price
    AND
        COALESCE(lr.avg_rating, 0) >= p_min_rating
    AND
        (p_nearby_radius IS NULL OR ST_DWithin(
            l.location,
            ST_MakePoint(p_user_lon, p_user_lat)::geography,
            p_nearby_radius
        ))
    ORDER BY
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'desc' THEN l.created_at END DESC,
        CASE WHEN sort_column = 'price' AND sort_direction = 'asc' THEN l.price_per_day END ASC,
        CASE WHEN sort_column = 'price' AND sort_direction = 'desc' THEN l.price_per_day END DESC,
        CASE WHEN sort_column = 'rating' AND sort_direction = 'desc' THEN COALESCE(lr.avg_rating, 0) END DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execution rights for the function to the authenticated user role
GRANT EXECUTE ON FUNCTION get_listings_with_ratings(text,text,numeric,numeric,numeric,text,double precision,double precision,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_listings_with_ratings(text,text,numeric,numeric,numeric,text,double precision,double precision,integer) TO service_role;

-- That's it! This should make the database schema solid. 