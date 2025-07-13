-- =================================================================
-- GET_LISTINGS_PAGED FUNCTION
-- =================================================================
-- Instructions:
-- This script creates the `get_listings_paged` function in your public schema.
-- The `Browse.tsx` component requires this function to fetch listings with
-- filtering, sorting, and pagination.
--
-- Please run this entire script in your Supabase SQL Editor exactly once.
-- This will resolve the "Could not find the function" error.
-- =================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_listings_paged;

-- Create a simplified version first
CREATE OR REPLACE FUNCTION public.get_listings_paged(
    p_sort_column text,
    p_sort_direction text,
    p_limit integer,
    p_offset integer,
    p_search_term text DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_min_price numeric DEFAULT NULL,
    p_max_price numeric DEFAULT NULL,
    p_min_rating numeric DEFAULT NULL,
    p_user_lon double precision DEFAULT NULL,
    p_user_lat double precision DEFAULT NULL,
    p_nearby_radius integer DEFAULT 50000
)
RETURNS TABLE(
    id uuid,
    title text,
    category text,
    price_per_day numeric,
    owner_id uuid,
    images_urls text[],
    average_rating numeric,
    review_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id::uuid,
        l.title,
        l.category,
        l.price_per_day,
        l.owner_id::uuid,
        l.images_urls,
        COALESCE(lr.average_rating, 0)::numeric as average_rating,
        COALESCE(lr.review_count, 0)::bigint as review_count
    FROM
        public.listings l
    LEFT JOIN
        public.listing_ratings lr ON l.id = lr.listing_id
    WHERE
        (p_search_term IS NULL OR l.title ILIKE ('%' || p_search_term || '%'))
        AND (p_category IS NULL OR l.category = p_category)
        AND (p_min_price IS NULL OR l.price_per_day >= p_min_price)
        AND (p_max_price IS NULL OR l.price_per_day <= p_max_price)
        AND (p_min_rating IS NULL OR COALESCE(lr.average_rating, 0) >= p_min_rating)
    ORDER BY
        CASE WHEN p_sort_column = 'created_at' AND p_sort_direction = 'desc' THEN l.created_at END DESC,
        CASE WHEN p_sort_column = 'price_per_day' AND p_sort_direction = 'asc' THEN l.price_per_day END ASC,
        CASE WHEN p_sort_column = 'price_per_day' AND p_sort_direction = 'desc' THEN l.price_per_day END DESC,
        CASE WHEN p_sort_column = 'average_rating' AND p_sort_direction = 'desc' THEN lr.average_rating END DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_listings_paged(
    text, text, integer, integer, text, text, numeric, numeric, numeric, double precision, double precision, integer
) TO authenticated, service_role; 