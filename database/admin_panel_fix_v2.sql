-- =================================================================
-- Admin Panel Fix V2 SQL Script
-- =================================================================
-- This script fixes function overloading issues with get_all_reviews_admin and get_listing_details
-- =================================================================

-- First, drop any existing versions of these functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_all_reviews_admin(text, integer, integer);
DROP FUNCTION IF EXISTS public.get_all_reviews_admin();

-- Fix for get_all_reviews_admin function - create a single version with optional parameters
CREATE OR REPLACE FUNCTION public.get_all_reviews_admin(
  p_filter_text TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
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
        WHERE
            (p_filter_text IS NULL OR 
             l.title ILIKE '%' || p_filter_text || '%' OR
             p_reviewer.full_name ILIKE '%' || p_filter_text || '%' OR
             p_reviewee.full_name ILIKE '%' || p_filter_text || '%' OR
             r.comment ILIKE '%' || p_filter_text || '%')
        ORDER BY r.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
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

-- Drop any existing versions of get_listing_details to avoid conflicts
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

-- Grant permissions for the updated functions
GRANT EXECUTE ON FUNCTION public.get_all_reviews_admin(text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listing_details(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_listing_status(uuid,text) TO authenticated, service_role; 