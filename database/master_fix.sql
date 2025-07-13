-- =====================================================================================
-- MASTER DATABASE FIX SCRIPT (v3)
-- =====================================================================================
-- This version adds the required DROP FUNCTION statement for get_user_conversations_with_details.
-- Run this entire script in your Supabase SQL Editor to resolve all current database errors.
-- =====================================================================================


-- STEP 1: Create the 'user_reviews' table with the CORRECT data types.
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_reviews (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    booking_id BIGINT, -- CORRECTED: Was UUID, now BIGINT to match the bookings table.
    reviewer_id UUID,
    reviewee_id UUID,
    rating INTEGER,
    comment TEXT,
    CONSTRAINT user_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT user_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT user_reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES profiles (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT user_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES profiles (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Enable Row Level Security for the new table
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- Set up policies for who can read, create, update, and delete reviews.
DROP POLICY IF EXISTS "Allow public read access to user reviews" ON public.user_reviews;
CREATE POLICY "Allow public read access to user reviews" ON public.user_reviews
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow renters to insert their own reviews" ON public.user_reviews;
CREATE POLICY "Allow renters to insert their own reviews" ON public.user_reviews
FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Allow users to update their own reviews" ON public.user_reviews;
CREATE POLICY "Allow users to update their own reviews" ON public.user_reviews
FOR UPDATE USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Allow users to delete their own reviews" ON public.user_reviews;
CREATE POLICY "Allow users to delete their own reviews" ON public.user_reviews
FOR DELETE USING (auth.uid() = reviewer_id);


-- STEP 2: Fix the 'get_user_conversations_with_details' function to prevent "Bad Request" errors.
-- -------------------------------------------------------------------------------------
-- ADDED: Explicitly drop the function before recreating it to avoid signature conflicts.
DROP FUNCTION IF EXISTS get_user_conversations_with_details();

CREATE OR REPLACE FUNCTION get_user_conversations_with_details()
RETURNS TABLE (
    conversation_id UUID,
    listing_id UUID,
    listing_title TEXT,
    owner_id UUID,
    renter_id UUID,
    last_message_content TEXT,
    last_message_time TIMESTAMPTZ,
    owner_details JSON,
    renter_details JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
      SELECT
        m.conversation_id,
        m.content,
        m.created_at,
        ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
      FROM messages m
      WHERE m.conversation_id IN (SELECT id FROM conversations WHERE conversations.owner_id = auth.uid() OR conversations.renter_id = auth.uid())
    )
    SELECT
        c.id as conversation_id,
        c.listing_id,
        l.title as listing_title,
        c.owner_id,
        c.renter_id,
        lm.content as last_message_content,
        COALESCE(lm.created_at, c.created_at) as last_message_time,
        json_build_object('id', po.id, 'full_name', po.full_name, 'avatar_url', po.avatar_url) as owner_details,
        json_build_object('id', pr.id, 'full_name', pr.full_name, 'avatar_url', pr.avatar_url) as renter_details
    FROM
        conversations c
    JOIN
        listings l ON c.listing_id = l.id
    LEFT JOIN
        ranked_messages lm ON c.id = lm.conversation_id AND lm.rn = 1
    JOIN
        profiles po ON c.owner_id = po.id
    JOIN
        profiles pr ON c.renter_id = pr.id
    WHERE
        c.owner_id = auth.uid() OR c.renter_id = auth.uid()
    ORDER BY
        last_message_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 3: Safely drop all old versions of 'get_listings_with_ratings' to resolve uniqueness conflicts.
-- -------------------------------------------------------------------------------------
DO $$
DECLARE
    func_signature TEXT;
BEGIN
    FOR func_signature IN
        SELECT oid::regprocedure::text
        FROM pg_proc
        WHERE proname = 'get_listings_with_ratings'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature;
    END LOOP;
END;
$$ LANGUAGE plpgsql;


-- STEP 4: Create the single, correct version of 'get_listings_with_ratings'.
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_listings_with_ratings(
    p_search_term TEXT,
    p_category TEXT,
    p_min_price NUMERIC,
    p_max_price NUMERIC,
    p_min_rating NUMERIC,
    p_sort_by TEXT,
    p_user_lat NUMERIC,
    p_user_lon NUMERIC,
    p_nearby_radius INT
)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    title TEXT,
    description TEXT,
    price_per_day NUMERIC,
    location GEOMETRY,
    owner_id UUID,
    images_urls TEXT[],
    image_360_url TEXT,
    category TEXT,
    location_text TEXT,
    average_rating NUMERIC,
    owner_name TEXT,
    owner_avatar_url TEXT
) AS $$
DECLARE
    sort_column TEXT;
    sort_direction TEXT;
BEGIN
    -- Parse sorting options
    SELECT split_part(p_sort_by, '-', 1) INTO sort_column;
    SELECT split_part(p_sort_by, '-', 2) INTO sort_direction;

    RETURN QUERY
    SELECT
        l.id,
        l.created_at,
        l.title,
        l.description,
        l.price_per_day,
        l.location,
        l.owner_id,
        l.images_urls,
        l.image_360_url,
        l.category,
        l.location_text,
        COALESCE(owner_ratings.avg_rating, 0) as average_rating,
        p.full_name as owner_name,
        p.avatar_url as owner_avatar_url
    FROM
        listings l
    LEFT JOIN
        profiles p ON l.owner_id = p.id
    LEFT JOIN (
        SELECT
            ur.reviewee_id,
            AVG(ur.rating)::NUMERIC(10, 2) as avg_rating
        FROM
            user_reviews ur
        GROUP BY
            ur.reviewee_id
    ) AS owner_ratings ON l.owner_id = owner_ratings.reviewee_id
    WHERE
        -- Filtering logic
        (p_search_term IS NULL OR l.title ILIKE '%' || p_search_term || '%') AND
        (p_category IS NULL OR l.category = p_category) AND
        (p_min_price IS NULL OR l.price_per_day >= p_min_price) AND
        (p_max_price IS NULL OR l.price_per_day <= p_max_price) AND
        (p_min_rating IS NULL OR COALESCE(owner_ratings.avg_rating, 0) >= p_min_rating) AND
        (p_user_lat IS NULL OR ST_DWithin(l.location::geography, ST_MakePoint(p_user_lon, p_user_lat)::geography, p_nearby_radius))
    ORDER BY
        -- Sorting logic
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'desc' THEN l.created_at END DESC,
        CASE WHEN sort_column = 'price' AND sort_direction = 'asc' THEN l.price_per_day END ASC,
        CASE WHEN sort_column = 'price' AND sort_direction = 'desc' THEN l.price_per_day END DESC,
        CASE WHEN sort_column = 'rating' AND sort_direction = 'desc' THEN COALESCE(owner_ratings.avg_rating, 0) END DESC;
END;
$$ LANGUAGE plpgsql;