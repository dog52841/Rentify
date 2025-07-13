-- =================================================================
-- ADMIN DASHBOARD FUNCTIONS
-- =================================================================
-- Instructions:
-- This script creates the functions required for the admin dashboard.
-- Please run this entire script in your Supabase SQL Editor exactly once.
-- =================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_admin_overview_stats();
DROP FUNCTION IF EXISTS public.get_admin_detailed_stats();

-- Create enhanced admin stats function
CREATE OR REPLACE FUNCTION public.get_admin_detailed_stats(
    p_days_range integer DEFAULT 30
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    overview json;
    daily_stats json;
    top_categories json;
    top_locations json;
    recent_activities json;
BEGIN
    -- Get overview statistics
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_listings', (SELECT COUNT(*) FROM public.listings),
        'total_reviews', (SELECT COUNT(*) FROM public.user_reviews),
        'total_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed'),
        'total_revenue', COALESCE((SELECT SUM(total_price) FROM public.bookings WHERE status = 'confirmed'), 0),
        'average_rating', COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.user_reviews), 0),
        'active_listings', (SELECT COUNT(*) FROM public.listings WHERE availability_status = 'available'),
        'pending_bookings', (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending')
    ) INTO overview;

    -- Get daily statistics for the specified range
    SELECT json_agg(daily_data) INTO daily_stats
    FROM (
        SELECT 
            date::date as date,
            COUNT(DISTINCT u.id) as new_users,
            COUNT(DISTINCT l.id) as new_listings,
            COUNT(DISTINCT b.id) as new_bookings,
            COALESCE(SUM(b.total_price), 0) as revenue
        FROM generate_series(
            current_date - (p_days_range || ' days')::interval,
            current_date,
            '1 day'
        ) as date
        LEFT JOIN auth.users u ON date_trunc('day', u.created_at) = date
        LEFT JOIN public.listings l ON date_trunc('day', l.created_at) = date
        LEFT JOIN public.bookings b ON date_trunc('day', b.created_at) = date AND b.status = 'confirmed'
        GROUP BY date
        ORDER BY date
    ) daily_data;

    -- Get top categories
    SELECT json_agg(cat_data) INTO top_categories
    FROM (
        SELECT 
            category,
            COUNT(*) as listing_count,
            COALESCE(AVG(lr.average_rating), 0)::numeric(3,2) as avg_rating,
            COALESCE(SUM(b.total_price), 0) as total_revenue
        FROM public.listings l
        LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
        LEFT JOIN public.bookings b ON l.id = b.listing_id AND b.status = 'confirmed'
        GROUP BY category
        ORDER BY COUNT(*) DESC
        LIMIT 5
    ) cat_data;

    -- Get top locations
    SELECT json_agg(loc_data) INTO top_locations
    FROM (
        SELECT 
            location_text,
            COUNT(*) as listing_count,
            COALESCE(AVG(lr.average_rating), 0)::numeric(3,2) as avg_rating
        FROM public.listings l
        LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
        WHERE location_text IS NOT NULL
        GROUP BY location_text
        ORDER BY COUNT(*) DESC
        LIMIT 5
    ) loc_data;

    -- Get recent activities
    WITH recent_activities_data AS (
        -- New users
        SELECT 
            'new_user' as type,
            u.created_at,
            json_build_object(
                'id', u.id,
                'created_at', u.created_at,
                'user_name', p.full_name,
                'user_avatar', p.avatar_url
            ) as data
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE u.created_at >= current_timestamp - interval '24 hours'
        
        UNION ALL
        
        -- New listings
        SELECT 
            'new_listing' as type,
            l.created_at,
            json_build_object(
                'id', l.id,
                'created_at', l.created_at,
                'listing_title', l.title
            ) as data
        FROM public.listings l
        WHERE l.created_at >= current_timestamp - interval '24 hours'
        
        UNION ALL
        
        -- New bookings
        SELECT 
            'new_booking' as type,
            b.created_at,
            json_build_object(
                'id', b.id,
                'created_at', b.created_at,
                'listing_title', l.title,
                'booking_dates', json_build_object(
                    'start_date', b.start_date,
                    'end_date', b.end_date
                )
            ) as data
        FROM public.bookings b
        JOIN public.listings l ON b.listing_id = l.id
        WHERE b.created_at >= current_timestamp - interval '24 hours'
        
        UNION ALL
        
        -- New reviews
        SELECT 
            'new_review' as type,
            r.created_at,
            json_build_object(
                'id', r.id,
                'created_at', r.created_at,
                'listing_title', l.title,
                'rating', r.rating,
                'review_text', r.comment
            ) as data
        FROM public.user_reviews r
        JOIN public.listings l ON r.listing_id = l.id
        WHERE r.created_at >= current_timestamp - interval '24 hours'
    )
    SELECT json_agg(row_to_json(recent_activities_data))
    INTO recent_activities
    FROM recent_activities_data
    ORDER BY created_at DESC
    LIMIT 20;

    -- Return all stats
    RETURN json_build_object(
        'overview', overview,
        'daily_stats', daily_stats,
        'top_categories', top_categories,
        'top_locations', top_locations,
        'recent_activities', recent_activities
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_admin_detailed_stats(integer) TO authenticated, service_role; 