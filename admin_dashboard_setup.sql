-- =================================================================
-- RENTIFY ADMIN DASHBOARD SETUP SCRIPT (v3 - Schema Mismatch Fix)
-- =================================================================
-- Instructions:
-- 1. This script addresses the BIGINT/UUID mismatch.
-- 2. Run this entire script in your Supabase SQL Editor exactly once.
-- =================================================================

-- Clean slate: Drop old functions to prevent errors
DROP FUNCTION IF EXISTS public.search_users(text);
DROP FUNCTION IF EXISTS public.get_all_bookings_admin();
DROP FUNCTION IF EXISTS public.get_all_reviews_admin();
DROP FUNCTION IF EXISTS public.get_daily_stats();
DROP FUNCTION IF EXISTS public.set_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.set_user_ban_status(uuid, boolean, text, integer);

-- 1. Create admin_activity_log table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and set policies for the log table
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts before recreating them
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.admin_activity_log;

CREATE POLICY "Admins can view all activity logs"
ON public.admin_activity_log FOR SELECT TO authenticated
USING ( (get_my_claim('user_role'))::text = 'admin' );

CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_log FOR INSERT TO authenticated
WITH CHECK ( (get_my_claim('user_role'))::text = 'admin' );


-- 2. Create Corrected RPC Functions

-- Function to search for users (This function should be correct)
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (id UUID, full_name TEXT, email TEXT, role TEXT, is_banned BOOLEAN, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY SELECT p.id, p.full_name, u.email, p.role, p.is_banned, p.created_at
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.full_name ILIKE '%' || search_term || '%' OR u.email ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get all bookings
-- FIX: Changed renter_id to BIGINT and removed email fetching.
CREATE OR REPLACE FUNCTION get_all_bookings_admin()
RETURNS TABLE (
    id BIGINT,
    listing_id BIGINT,
    renter_id BIGINT, -- Corrected type
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    total_price NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ,
    listing_title TEXT
    -- renter_email removed
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.listing_id,
        b.renter_id,
        b.start_date,
        b.end_date,
        b.total_price,
        b.status,
        b.created_at,
        l.title as listing_title
    FROM
        public.bookings b
    JOIN
        public.listings l ON b.listing_id = l.id
    ORDER BY
        b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get all reviews
-- FIX: Changed reviewer_id to BIGINT and removed email fetching.
CREATE OR REPLACE FUNCTION get_all_reviews_admin()
RETURNS TABLE (
    id BIGINT,
    listing_id BIGINT,
    reviewer_id BIGINT, -- Corrected type
    rating NUMERIC,
    comment TEXT,
    created_at TIMESTAMPTZ,
    listing_title TEXT
    -- reviewer_email removed
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.listing_id,
        r.reviewer_id,
        r.rating,
        r.comment,
        r.created_at,
        l.title as listing_title
    FROM
        public.reviews r
    JOIN
        public.listings l ON r.listing_id = l.id
    ORDER BY
        r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for daily stats chart
CREATE OR REPLACE FUNCTION get_daily_stats()
RETURNS TABLE ( day date, new_users BIGINT, new_listings BIGINT, new_bookings BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS ( SELECT generate_series( (NOW() - INTERVAL '6 days')::date, NOW()::date, '1 day'::interval )::date AS day)
    SELECT ds.day, COUNT(DISTINCT p.id) FILTER (WHERE p.created_at::date = ds.day) AS new_users, COUNT(DISTINCT l.id) FILTER (WHERE l.created_at::date = ds.day) AS new_listings, COUNT(DISTINCT b.id) FILTER (WHERE b.created_at::date = ds.day) AS new_bookings
    FROM date_series ds
    LEFT JOIN public.profiles p ON p.created_at::date = ds.day
    LEFT JOIN public.listings l ON l.created_at::date = ds.day
    LEFT JOIN public.bookings b ON b.created_at::date = ds.day
    GROUP BY ds.day ORDER BY ds.day ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set a user's role
CREATE OR REPLACE FUNCTION set_user_role(p_user_id UUID, p_role TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set a user's ban status
CREATE OR REPLACE FUNCTION set_user_ban_status(p_user_id UUID, p_is_banned BOOLEAN, p_reason TEXT, p_duration_days INT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET is_banned = p_is_banned, ban_reason = p_reason, ban_expires_at = CASE WHEN p_is_banned THEN NOW() + (p_duration_days || ' days')::interval ELSE null END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_bookings_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_reviews_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_ban_status(uuid, boolean, text, integer) TO authenticated; 