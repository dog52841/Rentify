-- =================================================================
-- BROWSE PAGE FIXES SCRIPT
-- =================================================================
-- Instructions:
-- This script fixes issues on the Browse page.
-- 1. Enables the 'postgis' extension if not already enabled.
-- 2. Creates the 'get_listings_nearby' function.
-- Please run this entire script in your Supabase SQL Editor exactly once.
-- =================================================================

-- 1. Enable PostGIS extension
-- This is required for location-based queries.
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the function to find nearby listings
-- This was missing, causing a 404 error when using the 'Nearby' filter.
DROP FUNCTION IF EXISTS public.get_listings_nearby(lat float, long float, max_dist integer);
CREATE OR REPLACE FUNCTION get_listings_nearby(lat float, long float, max_dist integer)
RETURNS TABLE (id BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id
  FROM public.listings AS l
  WHERE l.location_geom IS NOT NULL AND ST_DWithin(
    l.location_geom::geography,
    ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography,
    max_dist
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.get_listings_nearby(float, float, integer) TO authenticated; 