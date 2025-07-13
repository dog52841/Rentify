-- Add this function to your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_listing_details(p_listing_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    created_at TIMESTAMPTZ,
    title TEXT,
    description TEXT,
    price_per_day NUMERIC,
    location_text TEXT,
    location_geom GEOMETRY,
    images_urls TEXT[],
    image_360_url TEXT,
    owner_id UUID,
    is_verified BOOLEAN,
    status TEXT,
    category TEXT,
    rejection_reason TEXT,
    owner_name TEXT,
    owner_avatar_url TEXT,
    owner_is_verified BOOLEAN,
    average_rating NUMERIC,
    review_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH listings_with_ratings AS (
        SELECT
            l.id as l_id,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.id) AS rev_count
        FROM
            public.listings l
        LEFT JOIN
            public.reviews r ON l.id = r.listing_id
        WHERE l.id = p_listing_id
        GROUP BY
            l.id
    )
    SELECT
        l.id,
        l.created_at,
        l.title,
        l.description,
        l.price_per_day,
        l.location_text,
        l.location_geom,
        l.images_urls,
        l.image_360_url,
        l.owner_id,
        l.is_verified,
        l.status,
        l.category,
        l.rejection_reason,
        p.full_name AS owner_name,
        p.avatar_url AS owner_avatar_url,
        p.is_verified AS owner_is_verified,
        lwr.avg_rating,
        lwr.rev_count
    FROM
        public.listings l
    LEFT JOIN
        listings_with_ratings lwr ON l.id = lwr.l_id
    JOIN
        public.profiles p ON l.owner_id = p.id
    WHERE l.id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.get_listing_details(BIGINT) TO authenticated; 