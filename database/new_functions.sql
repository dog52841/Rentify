-- Function to get listings with sorting, filtering, and pagination
-- This replaces the direct table queries in the Browse page for more flexibility
CREATE OR REPLACE FUNCTION get_listings_with_ratings(
    p_search_term text,
    p_category text,
    p_min_price numeric,
    p_max_price numeric,
    p_sort_by text
)
RETURNS TABLE (
    id bigint,
    created_at timestamptz,
    title text,
    description text,
    price_per_day numeric,
    location text,
    owner_id uuid,
    images_urls text[],
    category text,
    average_rating numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH listing_ratings AS (
        SELECT
            l.id,
            COALESCE(AVG(r.rating), 0) as avg_rating
        FROM listings l
        LEFT JOIN reviews r ON l.id = r.listing_id
        GROUP BY l.id
    )
    SELECT
        l.*,
        lr.avg_rating
    FROM listings l
    JOIN listing_ratings lr ON l.id = lr.id
    WHERE
        -- Search term filter
        (p_search_term IS NULL OR l.title ILIKE ('%' || p_search_term || '%'))
        -- Category filter
        AND (p_category IS NULL OR p_category = 'All Categories' OR l.category = p_category)
        -- Price filter
        AND (l.price_per_day >= p_min_price AND l.price_per_day <= p_max_price)
    ORDER BY
        CASE
            WHEN p_sort_by = 'created_at-desc' THEN l.created_at
            ELSE NULL
        END DESC,
        CASE
            WHEN p_sort_by = 'price-asc' THEN l.price_per_day
            ELSE NULL
        END ASC,
        CASE
            WHEN p_sort_by = 'price-desc' THEN l.price_per_day
            ELSE NULL
        END DESC,
        CASE
            WHEN p_sort_by = 'rating-desc' THEN lr.avg_rating
            ELSE NULL
        END DESC;
END;
$$; 