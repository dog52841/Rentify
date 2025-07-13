-- This script will resolve the "function name is not unique" error in your Supabase database.
-- It works by finding all existing versions of the 'get_listings_with_ratings' function,
-- deleting them, and then creating the single, correct version.

-- This block safely deletes all overloaded versions of the function.
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

-- This block creates the one, correct version of the function.
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