-- =================================================================
-- Rentify Admin Panel & Featured Listings Fix v4.0
-- =================================================================
-- This script fixes the remaining issues with the admin panel and
-- implements the featured listings functionality as requested.
-- =================================================================

-- =================================================================
-- 1. Fix get_all_reviews_admin function
-- =================================================================
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

-- =================================================================
-- 2. Fix get_listing_details function
-- =================================================================
DROP FUNCTION IF EXISTS public.get_listing_details(text);
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

-- =================================================================
-- 3. Update listings table to use 'approved' as default status
-- =================================================================
ALTER TABLE public.listings 
ALTER COLUMN status SET DEFAULT 'approved';

-- =================================================================
-- 4. Create function to get featured listings
-- =================================================================
DROP FUNCTION IF EXISTS public.get_featured_listings(integer, integer);
CREATE OR REPLACE FUNCTION public.get_featured_listings(
    p_limit INTEGER DEFAULT 8,
    p_offset INTEGER DEFAULT 0
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
    view_count integer,
    is_verified boolean
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
        COALESCE(l.view_count, 0) as view_count,
        l.is_verified
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
        l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 5. Update set_listing_status function to only accept 'approved' or 'rejected'
-- =================================================================
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

-- =================================================================
-- 6. Grant permissions for new functions
-- =================================================================
GRANT EXECUTE ON FUNCTION public.get_featured_listings(integer,integer) TO authenticated, service_role; 