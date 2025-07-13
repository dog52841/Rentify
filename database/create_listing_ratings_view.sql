-- =================================================================
-- CREATE LISTING_RATINGS VIEW
-- =================================================================
-- Instructions:
-- This script creates the `listing_ratings` view in your public schema.
-- This view is required by the `get_listings_paged` function to provide
-- rating and review count information for listings.
--
-- Please run this entire script in your Supabase SQL Editor exactly once.
-- This will resolve the "relation public.listing_ratings does not exist" error.
-- and the "operator does not exist: uuid = bigint" error.
-- =================================================================

-- 1. Create the listing_ratings view using the correct `user_reviews` table.
DROP VIEW IF EXISTS public.listing_ratings;
CREATE OR REPLACE VIEW public.listing_ratings AS
SELECT
    listing_id,
    COUNT(id) as review_count,
    AVG(rating)::numeric(3, 2) as average_rating
FROM
    public.user_reviews -- Using user_reviews table which has correct data types
GROUP BY
    listing_id;

-- 2. Grant permissions for the new view
GRANT SELECT ON public.listing_ratings TO authenticated, service_role; 