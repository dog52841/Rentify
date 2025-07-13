-- =================================================================
-- Admin Panel Fix SQL Script
-- =================================================================
-- This script fixes issues with the admin panel and modifies the listing status
-- functionality to make listings instantly available without a waiting period.
-- =================================================================

-- Fix for get_all_reviews_admin function
DROP FUNCTION IF EXISTS public.get_all_reviews_admin();
CREATE OR REPLACE FUNCTION public.get_all_reviews_admin()
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    review_record RECORD;
    result_json json;
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    FOR review_record IN
        SELECT
            r.id,
            r.created_at,
            r.rating,
            r.comment,
            r.listing_id,
            l.title as listing_title,
            r.reviewer_id,
            p_reviewer.full_name as reviewer_name,
            r.reviewee_id,
            p_reviewee.full_name as reviewee_name
        FROM public.user_reviews r
        JOIN public.listings l ON r.listing_id = l.id
        JOIN public.profiles p_reviewer ON r.reviewer_id = p_reviewer.id
        JOIN public.profiles p_reviewee ON r.reviewee_id = p_reviewee.id
        ORDER BY r.created_at DESC
    LOOP
        SELECT json_build_object(
            'id', review_record.id,
            'created_at', review_record.created_at,
            'rating', review_record.rating,
            'comment', review_record.comment,
            'listing_id', review_record.listing_id,
            'listing_title', review_record.listing_title,
            'reviewer_id', review_record.reviewer_id,
            'reviewer_name', review_record.reviewer_name,
            'reviewee_id', review_record.reviewee_id,
            'reviewee_name', review_record.reviewee_name
        ) INTO result_json;
        
        RETURN NEXT result_json;
    END LOOP;
    
    RETURN;
END;
$$;

-- Fix for set_listing_status function to make listings instantly available
-- Change 'pending' to 'approved' as default status for new listings
DROP FUNCTION IF EXISTS public.set_listing_status(uuid,text);
CREATE OR REPLACE FUNCTION set_listing_status(
  target_id uuid,
  new_status text
)
RETURNS boolean
SECURITY DEFINER AS $$
BEGIN
  -- Check if user is admin
  IF NOT check_if_admin() THEN
    RAISE EXCEPTION 'Unauthorized access: admin privileges required';
  END IF;
  
  -- Check if status is valid
  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: must be approved or rejected';
  END IF;
  
  -- Update the listing status
  UPDATE public.listings
  SET status = new_status
  WHERE id = target_id;
  
  -- Log admin activity
  INSERT INTO public.admin_activity_log (
    admin_id,
    action,
    target_id,
    target_type,
    details
  ) VALUES (
    auth.uid(),
    'update_listing_status',
    target_id,
    'listing',
    jsonb_build_object('new_status', new_status)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Update default status for new listings to be 'approved' instead of 'pending'
ALTER TABLE public.listings 
ALTER COLUMN status SET DEFAULT 'approved';

-- Update get_listings_paged function to show all listings by default
DROP FUNCTION IF EXISTS public.get_listings_paged(text,text,integer,integer,text,text,numeric,numeric,numeric,double precision,double precision,integer);
CREATE OR REPLACE FUNCTION get_listings_paged(
    p_sort_column TEXT,
    p_sort_direction TEXT,
    p_limit INT,
    p_offset INT,
    p_search_term TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_min_rating NUMERIC DEFAULT NULL,
    p_user_lon FLOAT DEFAULT NULL,
    p_user_lat FLOAT DEFAULT NULL,
    p_nearby_radius INT DEFAULT 50000 -- in meters
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
        l.status != 'rejected' AND -- Show all listings except rejected ones
        (p_search_term IS NULL OR l.title ILIKE '%' || p_search_term || '%') AND
        (p_category IS NULL OR l.category = p_category) AND
        (p_min_price IS NULL OR l.price_per_day >= p_min_price) AND
        (p_max_price IS NULL OR l.price_per_day <= p_max_price) AND
        (p_min_rating IS NULL OR COALESCE(lr.average_rating, 0) >= p_min_rating) AND
        (p_nearby_radius IS NULL OR p_user_lat IS NULL OR p_user_lon IS NULL OR ST_DWithin(
            l.location_geom::geography,
            ST_SetSRID(ST_MakePoint(p_user_lon, p_user_lat), 4326)::geography,
            p_nearby_radius
        ))
    ORDER BY
        CASE WHEN p_sort_column = 'created_at' AND p_sort_direction = 'desc' THEN l.created_at END DESC,
        CASE WHEN p_sort_column = 'created_at' AND p_sort_direction = 'asc' THEN l.created_at END ASC,
        CASE WHEN p_sort_column = 'price_per_day' AND p_sort_direction = 'desc' THEN l.price_per_day END DESC,
        CASE WHEN p_sort_column = 'price_per_day' AND p_sort_direction = 'asc' THEN l.price_per_day END ASC,
        CASE WHEN p_sort_column = 'average_rating' AND p_sort_direction = 'desc' THEN COALESCE(lr.average_rating, 0) END DESC,
        l.created_at DESC -- Default sort
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

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
        p.is_verified = true AND
        l.status = 'approved'
    ORDER BY
        COALESCE(lr.average_rating, 0) DESC,
        l.view_count DESC,
        l.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the new/modified functions
GRANT EXECUTE ON FUNCTION public.get_all_reviews_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_listing_status(uuid,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listings_paged(text,text,integer,integer,text,text,numeric,numeric,numeric,double precision,double precision,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_featured_listings(integer) TO authenticated, service_role; 