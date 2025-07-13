-- =================================================================
-- Rentify Master Database Script v2.2
-- =================================================================
-- Instructions:
-- This is the single source of truth for your database schema, functions,
-- and policies. It consolidates all previous scripts and includes critical
-- fixes for the admin panel and listing visibility.
--
-- Please run this entire script in your Supabase SQL Editor once.
-- This will reset and correctly define all necessary components.
-- =================================================================

-- =================================================================
-- 1. Full Cleanup
-- Drop all known objects to ensure a clean slate.
-- =================================================================
DO $$
BEGIN
    -- Drop triggers first to remove dependencies
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS set_listings_updated_at ON public.listings;
    DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

    -- Drop functions with known signatures
    DROP FUNCTION IF EXISTS public.handle_new_user();
    DROP FUNCTION IF EXISTS public.set_updated_at();
    DROP FUNCTION IF EXISTS public.is_admin(); -- Deprecated
    DROP FUNCTION IF EXISTS public.get_listings_paged(text,text,integer,integer,text,text,numeric,numeric,numeric,double precision,double precision,integer);
    DROP FUNCTION IF EXISTS public.get_listing_details(text);
    DROP FUNCTION IF EXISTS public.get_reviews_for_listing(uuid);
    DROP FUNCTION IF EXISTS public.set_user_verification(uuid,boolean);
    DROP FUNCTION IF EXISTS public.set_listing_verification(uuid,boolean);
    DROP FUNCTION IF EXISTS public.get_all_users_admin();
    DROP FUNCTION IF EXISTS public.get_all_listings_admin();
    DROP FUNCTION IF EXISTS public.get_all_reviews_admin();
    DROP FUNCTION IF EXISTS public.get_all_bookings_admin();
    DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();
    DROP FUNCTION IF EXISTS public.get_recent_admin_activity(integer);
    DROP FUNCTION IF EXISTS public.get_user_activity_log(uuid);
    DROP FUNCTION IF EXISTS public.get_listing_activity_log(uuid);
    DROP FUNCTION IF EXISTS public.get_user_by_id(uuid);
    DROP FUNCTION IF EXISTS public.get_listings_by_owner_id(uuid);
    DROP FUNCTION IF EXISTS public.get_bookings_by_user_id(uuid);
    DROP FUNCTION IF EXISTS public.log_admin_activity(uuid,text,uuid,text,jsonb);
END $$;

-- =================================================================
-- 2. Table Creation & Configuration
-- Create all tables from scratch if they don't exist.
-- =================================================================

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    full_name text,
    avatar_url text,
    role text NOT NULL DEFAULT 'user',
    is_banned boolean NOT NULL DEFAULT false,
    ban_reason text,
    ban_expires_at timestamptz,
    is_verified boolean DEFAULT false,
    stripe_connect_id TEXT,
    stripe_customer_id TEXT
);

-- Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text,
    description text,
    price_per_day numeric,
    image_urls text[],
    image_360_url text,
    category text,
    status text NOT NULL DEFAULT 'pending', -- Can be 'pending', 'approved', 'rejected'
    is_verified boolean NOT NULL DEFAULT false,
    rejection_reason text,
    availability_status text DEFAULT 'available',
    view_count integer DEFAULT 0,
    location text,
    location_lat numeric,
    location_lng numeric,
    location_geom geometry(point, 4326),
    location_text text,
    features jsonb DEFAULT '{}',
    rules jsonb DEFAULT '{}'
);
-- Ensure view_count exists on older tables
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    renter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date timestamptz,
    end_date timestamptz,
    total_price numeric,
    status text DEFAULT 'pending' -- Can be 'pending', 'confirmed', 'cancelled'
);

-- User Reviews Table
CREATE TABLE IF NOT EXISTS public.user_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    UNIQUE(user_id, listing_id)
);

-- Admin Activity Log Table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id bigserial PRIMARY KEY,
    admin_id uuid REFERENCES public.profiles(id),
    action text NOT NULL,
    target_id uuid,
    target_type text,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- =================================================================
-- 3. Views
-- Create views for aggregated data.
-- =================================================================
CREATE OR REPLACE VIEW public.listing_ratings AS
SELECT
    listing_id,
    COUNT(id) as review_count,
    AVG(rating)::numeric(3,2) as average_rating
FROM public.user_reviews
GROUP BY listing_id;


-- =================================================================
-- 4. Triggers & Core Functions
-- Essential functions for user creation and timestamp updates.
-- =================================================================

-- Function to create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING; -- Do nothing if profile already exists
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for handle_new_user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for set_updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Function to securely check if the current user is an admin.
-- This function is `SECURITY DEFINER` to bypass the RLS check on `public.profiles`
-- within the policy, thus preventing infinite recursion.
CREATE OR REPLACE FUNCTION public.check_if_admin()
RETURNS boolean AS $$
BEGIN
  -- The function will be executed with the permissions of the function owner
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync profiles from auth.users just in case
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT u.id, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;


-- =================================================================
-- 5. Row Level Security (RLS) Policies
-- Secure all tables.
-- =================================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.check_if_admin()) WITH CHECK (public.check_if_admin());

-- Listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public listings are viewable by everyone." ON public.listings;
CREATE POLICY "Public listings are viewable by everyone." ON public.listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own listings." ON public.listings;
CREATE POLICY "Users can insert their own listings." ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own listings." ON public.listings;
CREATE POLICY "Users can update their own listings." ON public.listings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own listings." ON public.listings;
CREATE POLICY "Users can delete their own listings." ON public.listings FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage listings" ON public.listings;
CREATE POLICY "Admins can manage listings" ON public.listings FOR ALL USING (public.check_if_admin()) WITH CHECK (public.check_if_admin());

-- Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own bookings." ON public.bookings;
CREATE POLICY "Users can see their own bookings." ON public.bookings FOR SELECT USING (auth.uid() = renter_id);
DROP POLICY IF EXISTS "Owners can see bookings for their listings." ON public.bookings;
CREATE POLICY "Owners can see bookings for their listings." ON public.bookings FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id));
DROP POLICY IF EXISTS "Users can create bookings." ON public.bookings;
CREATE POLICY "Users can create bookings." ON public.bookings FOR INSERT WITH CHECK (auth.uid() = renter_id);
DROP POLICY IF EXISTS "Users can update their own bookings." ON public.bookings;
CREATE POLICY "Users can update their own bookings." ON public.bookings FOR UPDATE USING (auth.uid() = renter_id);
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL USING (public.check_if_admin()) WITH CHECK (public.check_if_admin());

-- User Reviews
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public." ON public.user_reviews;
CREATE POLICY "Reviews are public." ON public.user_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews." ON public.user_reviews;
CREATE POLICY "Users can create reviews." ON public.user_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "Users can delete their own reviews." ON public.user_reviews;
CREATE POLICY "Users can delete their own reviews." ON public.user_reviews FOR DELETE USING (auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.user_reviews;
CREATE POLICY "Admins can manage reviews" ON public.user_reviews FOR ALL USING (public.check_if_admin()) WITH CHECK (public.check_if_admin());

-- Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own favorites." ON public.favorites;
CREATE POLICY "Users can manage their own favorites." ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Admin Activity Log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do anything with activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can do anything with activity logs" ON public.admin_activity_log FOR ALL USING (public.check_if_admin()) WITH CHECK (public.check_if_admin());


-- =================================================================
-- 6. Public RPC Functions
-- Functions accessible by authenticated users.
-- =================================================================

-- Function for Browse/Home page to get listings.
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
        l.status = 'approved' AND -- <<< CRITICAL FIX: Only show approved listings
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

-- Function to get reviews for a listing.
CREATE OR REPLACE FUNCTION get_reviews_for_listing(p_listing_id UUID)
RETURNS TABLE (
    id UUID,
    rating NUMERIC,
    comment TEXT,
    created_at TIMESTAMPTZ,
    reviewer_id UUID,
    reviewer_name TEXT,
    reviewer_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.rating, r.comment, r.created_at, r.reviewer_id, p.full_name, p.avatar_url
    FROM public.user_reviews r
    JOIN public.profiles p ON r.reviewer_id = p.id
    WHERE r.listing_id = p_listing_id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get detailed information about a listing
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
-- 7. Admin RPC Functions
-- Functions accessible only by admins.
-- =================================================================
-- All functions are SECURITY DEFINER to run with creator's permissions.
-- An explicit role check is the first step in each function.

-- Function to get all users for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    user_record RECORD;
    result_json json;
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    FOR user_record IN
    SELECT
            p.id, 
            p.created_at, 
            p.full_name, 
            u.email, 
            p.role, 
            p.is_banned, 
            p.is_verified, 
            p.stripe_connect_id,
        (SELECT COUNT(*) FROM public.listings l WHERE l.user_id = p.id) as total_listings,
        (SELECT COUNT(*) FROM public.bookings b JOIN public.listings l ON b.listing_id = l.id WHERE l.user_id = p.id) as total_bookings,
        (SELECT COALESCE(SUM(b.total_price), 0) FROM public.bookings b JOIN public.listings l ON b.listing_id = l.id WHERE l.user_id = p.id AND b.status='confirmed') as total_earnings,
        u.last_sign_in_at as last_active
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
        ORDER BY p.created_at DESC
    LOOP
        SELECT json_build_object(
            'id', user_record.id,
            'created_at', user_record.created_at,
            'full_name', user_record.full_name,
            'email', user_record.email,
            'role', user_record.role,
            'is_banned', user_record.is_banned,
            'is_verified', user_record.is_verified,
            'stripe_connect_id', user_record.stripe_connect_id,
            'total_listings', user_record.total_listings,
            'total_bookings', user_record.total_bookings,
            'total_earnings', user_record.total_earnings,
            'last_active', user_record.last_active
        ) INTO result_json;
        
        RETURN NEXT result_json;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function to get all listings for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_listings_admin()
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    listing_record RECORD;
    result_json json;
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    FOR listing_record IN
    SELECT
            l.id, 
            l.created_at, 
            l.title, 
            l.status, 
            l.is_verified, 
            l.user_id as owner_id,
            p.full_name as owner_name, 
            u.email as owner_email,
        (SELECT count(*) FROM public.bookings b WHERE b.listing_id = l.id) as total_bookings,
        (SELECT coalesce(sum(b.total_price), 0) FROM public.bookings b WHERE b.listing_id = l.id AND b.status = 'confirmed') as total_revenue,
            COALESCE(lr.average_rating, 0) as average_rating,
        l.view_count
    FROM public.listings l
    JOIN public.profiles p ON l.user_id = p.id
    JOIN auth.users u ON p.id = u.id
    LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
        ORDER BY l.created_at DESC
    LOOP
        SELECT json_build_object(
            'id', listing_record.id,
            'created_at', listing_record.created_at,
            'title', listing_record.title,
            'status', listing_record.status,
            'is_verified', listing_record.is_verified,
            'owner_id', listing_record.owner_id,
            'owner_name', listing_record.owner_name,
            'owner_email', listing_record.owner_email,
            'total_bookings', listing_record.total_bookings,
            'total_revenue', listing_record.total_revenue,
            'average_rating', listing_record.average_rating,
            'view_count', listing_record.view_count
        ) INTO result_json;
        
        RETURN NEXT result_json;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    result json;
    seven_days_ago timestamptz := now() - interval '7 days';
    thirty_days_ago timestamptz := now() - interval '30 days';
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.profiles),
        'new_users_last_7_days', (SELECT COUNT(*) FROM public.profiles WHERE created_at > seven_days_ago),
        'new_users_last_30_days', (SELECT COUNT(*) FROM public.profiles WHERE created_at > thirty_days_ago),
        'active_users_last_30_days', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > thirty_days_ago),
        
        'total_listings', (SELECT COUNT(*) FROM public.listings),
        'new_listings_last_7_days', (SELECT COUNT(*) FROM public.listings WHERE created_at > seven_days_ago),
        'new_listings_last_30_days', (SELECT COUNT(*) FROM public.listings WHERE created_at > thirty_days_ago),
        'pending_listings', (SELECT COUNT(*) FROM public.listings WHERE status = 'pending'),
        'active_listings', (SELECT COUNT(*) FROM public.listings WHERE status = 'approved'), -- Changed from 'active' to 'approved'
        'inactive_listings', (SELECT COUNT(*) FROM public.listings WHERE status = 'rejected' OR status = 'inactive'), -- Changed from 'inactive'
        
        'total_bookings', (SELECT COUNT(*) FROM public.bookings),
        'bookings_last_7_days', (SELECT COUNT(*) FROM public.bookings WHERE created_at > seven_days_ago),
        'bookings_last_30_days', (SELECT COUNT(*) FROM public.bookings WHERE created_at > thirty_days_ago),
        'completed_bookings_last_30_days', (SELECT COUNT(*) FROM public.bookings WHERE status = 'confirmed' AND created_at > thirty_days_ago),
        
        'total_revenue', (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE status = 'confirmed'),
        'revenue_last_7_days', (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE status = 'confirmed' AND created_at > seven_days_ago),
        'revenue_last_30_days', (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings WHERE status = 'confirmed' AND created_at > thirty_days_ago),

        'total_reviews', (SELECT COUNT(*) FROM public.user_reviews),
        'reviews_last_30_days', (SELECT COUNT(*) FROM public.user_reviews WHERE created_at > thirty_days_ago),
        'average_rating', COALESCE((SELECT AVG(rating) FROM public.user_reviews), 0),

        'pending_reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'pending')
    ) INTO result;

    RETURN result;
END;
$$;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
    p_admin_id UUID,
    p_action TEXT,
    p_target_id UUID DEFAULT NULL,
    p_target_type TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    INSERT INTO public.admin_activity_log (admin_id, action, target_id, target_type, details)
    VALUES (p_admin_id, p_action, p_target_id, p_target_type, p_details);
END;
$$;

-- Function to get recent admin activity
CREATE OR REPLACE FUNCTION public.get_recent_admin_activity(p_limit INTEGER DEFAULT 20)
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    activity_record RECORD;
    result_json json;
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    FOR activity_record IN
        SELECT
            l.id,
            l.admin_id,
            p.full_name AS admin_name,
            l.action,
            l.target_id,
            l.target_type,
            l.details,
            l.created_at
        FROM public.admin_activity_log l
        JOIN public.profiles p ON l.admin_id = p.id
        ORDER BY l.created_at DESC
        LIMIT p_limit
    LOOP
        SELECT json_build_object(
            'id', activity_record.id,
            'admin_id', activity_record.admin_id,
            'admin_name', activity_record.admin_name,
            'action', activity_record.action,
            'target_id', activity_record.target_id,
            'target_type', activity_record.target_type,
            'details', activity_record.details,
            'created_at', activity_record.created_at
        ) INTO result_json;
        
        RETURN NEXT result_json;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function to set user verification status
CREATE OR REPLACE FUNCTION public.set_user_verification(p_user_id UUID, p_is_verified BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE public.profiles SET is_verified = p_is_verified WHERE id = p_user_id;
    RETURN TRUE;
END;
$$;

-- Function to set listing verification status
CREATE OR REPLACE FUNCTION public.set_listing_verification(p_listing_id UUID, p_is_verified BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE public.listings SET is_verified = p_is_verified WHERE id = p_listing_id;
    RETURN TRUE;
END;
$$;

-- Function to get all reviews for the admin dashboard
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

-- Function to get all bookings for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_bookings_admin()
RETURNS SETOF json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    booking_record RECORD;
    result_json json;
BEGIN
    IF NOT public.check_if_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    FOR booking_record IN
        SELECT
            b.id,
            b.created_at,
            b.start_date,
            b.end_date,
            b.total_price,
            b.status,
            b.listing_id,
            l.title as listing_title,
            l.user_id as owner_id,
            p_owner.full_name as owner_name,
            b.renter_id,
            p_renter.full_name as renter_name
        FROM public.bookings b
        JOIN public.listings l ON b.listing_id = l.id
        JOIN public.profiles p_owner ON l.user_id = p_owner.id
        JOIN public.profiles p_renter ON b.renter_id = p_renter.id
        ORDER BY b.created_at DESC
    LOOP
        SELECT json_build_object(
            'id', booking_record.id,
            'created_at', booking_record.created_at,
            'start_date', booking_record.start_date,
            'end_date', booking_record.end_date,
            'total_price', booking_record.total_price,
            'status', booking_record.status,
            'listing_id', booking_record.listing_id,
            'listing_title', booking_record.listing_title,
            'owner_id', booking_record.owner_id,
            'owner_name', booking_record.owner_name,
            'renter_id', booking_record.renter_id,
            'renter_name', booking_record.renter_name
        ) INTO result_json;
        
        RETURN NEXT result_json;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function to get user by id (for profile pages)
CREATE OR REPLACE FUNCTION public.get_user_by_id(p_user_id UUID)
RETURNS json LANGUAGE plpgsql AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'created_at', p.created_at,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'role', p.role,
        'is_verified', p.is_verified,
        'total_listings', (SELECT COUNT(*) FROM public.listings WHERE user_id = p.id),
        'total_reviews', (SELECT COUNT(*) FROM public.user_reviews WHERE reviewee_id = p.id),
        'average_rating', (SELECT COALESCE(AVG(rating), 0) FROM public.user_reviews WHERE reviewee_id = p.id)
    ) INTO result
    FROM public.profiles p
    WHERE p.id = p_user_id;
    
    RETURN result;
END;
$$;

-- Function to get listings by owner id
CREATE OR REPLACE FUNCTION public.get_listings_by_owner_id(p_owner_id UUID)
RETURNS SETOF json LANGUAGE plpgsql AS $$
DECLARE
    listing_record RECORD;
    result_json json;
BEGIN
    FOR listing_record IN
        SELECT
            l.id,
            l.created_at,
            l.title,
            l.description,
            l.price_per_day,
            COALESCE(l.location_text, l.location) as location_text,
            l.image_urls,
            l.category,
            l.status,
            l.is_verified,
            COALESCE(lr.average_rating, 0) as average_rating,
            COALESCE(lr.review_count, 0) as review_count,
            l.view_count
        FROM public.listings l
        LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
        WHERE l.user_id = p_owner_id
        ORDER BY l.created_at DESC
    LOOP
        SELECT json_build_object(
            'id', listing_record.id,
            'created_at', listing_record.created_at,
            'title', listing_record.title,
            'description', listing_record.description,
            'price_per_day', listing_record.price_per_day,
            'location_text', listing_record.location_text,
            'image_urls', listing_record.image_urls,
            'category', listing_record.category,
            'status', listing_record.status,
            'is_verified', listing_record.is_verified,
            'average_rating', listing_record.average_rating,
            'review_count', listing_record.review_count,
            'view_count', listing_record.view_count
        ) INTO result_json;
        
        RETURN NEXT result_json;
    END LOOP;
    
    RETURN;
END;
$$;

-- Function to get bookings by user id
CREATE OR REPLACE FUNCTION public.get_bookings_by_user_id(p_user_id UUID)
RETURNS SETOF json LANGUAGE plpgsql AS $$
DECLARE
    booking_record RECORD;
    result_json json;
BEGIN
    FOR booking_record IN
        SELECT
            b.id,
            b.created_at,
            b.start_date,
            b.end_date,
            b.total_price,
            b.status,
            b.listing_id,
            l.title as listing_title,
            l.image_urls[1] as listing_image,
            l.user_id as owner_id,
            p.full_name as owner_name,
            p.avatar_url as owner_avatar
        FROM public.bookings b
        JOIN public.listings l ON b.listing_id = l.id
        JOIN public.profiles p ON l.user_id = p.id
        WHERE b.renter_id = p_user_id
        ORDER BY b.start_date DESC
    LOOP
        SELECT json_build_object(
            'id', booking_record.id,
            'created_at', booking_record.created_at,
            'start_date', booking_record.start_date,
            'end_date', booking_record.end_date,
            'total_price', booking_record.total_price,
            'status', booking_record.status,
            'listing_id', booking_record.listing_id,
            'listing_title', booking_record.listing_title,
            'listing_image', booking_record.listing_image,
            'owner_id', booking_record.owner_id,
            'owner_name', booking_record.owner_name,
            'owner_avatar', booking_record.owner_avatar
        ) INTO result_json;
        
        RETURN NEXT result_json;
    END LOOP;
    
    RETURN;
END;
$$;

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_type text NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  details jsonb DEFAULT '{}'::jsonb
);

-- Add RLS policy for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

-- Policy to allow users to create reports
CREATE POLICY "Users can create reports" 
ON public.reports FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy to allow users to view their own reports
CREATE POLICY "Users can view their own reports" 
ON public.reports FOR SELECT 
TO authenticated 
USING (auth.uid() = reporter_id);

-- Policy to allow admins to view all reports
CREATE POLICY "Admins can view all reports" 
ON public.reports FOR SELECT 
TO authenticated 
USING (check_if_admin());

-- Policy to allow admins to update reports
CREATE POLICY "Admins can update reports" 
ON public.reports FOR UPDATE 
TO authenticated 
USING (check_if_admin())
WITH CHECK (check_if_admin());

-- Function to get all reports for admin
DROP FUNCTION IF EXISTS get_all_reports_admin();
CREATE OR REPLACE FUNCTION get_all_reports_admin()
RETURNS SETOF public.reports
SECURITY DEFINER AS $$
BEGIN
  IF NOT check_if_admin() THEN
    RAISE EXCEPTION 'Unauthorized access: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT * FROM public.reports
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to set listing status
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
  IF new_status NOT IN ('active', 'pending', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status: must be active, pending, or inactive';
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
-- 8. Grant Permissions
-- =================================================================
GRANT EXECUTE ON FUNCTION public.get_listings_paged(text,text,integer,integer,text,text,numeric,numeric,numeric,double precision,double precision,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_reviews_for_listing(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listing_details(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_if_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_listings_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_reviews_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_bookings_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_user_verification(uuid,boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_listing_verification(uuid,boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recent_admin_activity(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_activity(uuid,text,uuid,text,jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_by_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listings_by_owner_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_bookings_by_user_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_listing_status(uuid,text) TO authenticated, service_role;

GRANT ALL ON TABLE public.admin_activity_log TO authenticated, service_role;
DO $$
BEGIN
   IF EXISTS (SELECT FROM pg_class WHERE relkind = 'S' AND relname = 'admin_activity_log_id_seq') THEN
      EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.admin_activity_log_id_seq TO authenticated, service_role';
   END IF;
END $$;

-- Grant usage on public schema to roles
GRANT usage ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges on tables to postgres and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;

-- Grant select, insert, update, delete on tables to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Reset sequence permissions just in case
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role; 

-- Drop existing messages table if it exists with a different structure
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  attachment_url text,
  conversation_id text GENERATED ALWAYS AS (
    CASE WHEN sender_id < recipient_id 
    THEN sender_id::text || '-' || recipient_id::text 
    ELSE recipient_id::text || '-' || sender_id::text END
  ) STORED
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'message', 'booking', 'review', 'system'
  title text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  action_link text,
  related_id uuid -- Can reference a booking, message, etc.
);

-- Add RLS policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to send messages
CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to read their own messages
CREATE POLICY "Users can read their own messages" 
ON public.messages FOR SELECT 
TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy to allow users to update their own received messages (mark as read)
CREATE POLICY "Users can update their received messages" 
ON public.messages FOR UPDATE 
TO authenticated 
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Policy to allow admins to manage all messages
CREATE POLICY "Admins can manage all messages" 
ON public.messages FOR ALL 
TO authenticated 
USING (check_if_admin())
WITH CHECK (check_if_admin());

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow admins to manage all notifications
CREATE POLICY "Admins can manage all notifications" 
ON public.notifications FOR ALL 
TO authenticated 
USING (check_if_admin())
WITH CHECK (check_if_admin());

-- Function to send a message
CREATE OR REPLACE FUNCTION send_message(
  p_recipient_id uuid,
  p_content text,
  p_attachment_url text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER AS $$
DECLARE
  v_sender_id uuid;
  v_message_id uuid;
BEGIN
  -- Get the current user's ID
  v_sender_id := auth.uid();
  
  -- Insert the message
  INSERT INTO public.messages (
    sender_id,
    recipient_id,
    content,
    attachment_url
  ) VALUES (
    v_sender_id,
    p_recipient_id,
    p_content,
    p_attachment_url
  ) RETURNING id INTO v_message_id;
  
  -- Create a notification for the recipient
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    related_id
  ) VALUES (
    p_recipient_id,
    'message',
    'New Message',
    'You have received a new message',
    v_message_id
  );
  
  -- Return the new message ID
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark a message as read
CREATE OR REPLACE FUNCTION mark_message_read(
  p_message_id uuid
)
RETURNS boolean
SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Update the message if the user is the recipient
  UPDATE public.messages
  SET is_read = true
  WHERE id = p_message_id AND recipient_id = v_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark a notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id uuid
)
RETURNS boolean
SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Update the notification if the user is the owner
  UPDATE public.notifications
  SET is_read = true
  WHERE id = p_notification_id AND user_id = v_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get user conversations
CREATE OR REPLACE FUNCTION get_user_conversations(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  conversation_id text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message_content text,
  last_message_time timestamp with time zone,
  unread_count bigint
)
SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  RETURN QUERY
  WITH conversations AS (
    SELECT 
      m.conversation_id,
      CASE 
        WHEN m.sender_id = v_user_id THEN m.recipient_id
        ELSE m.sender_id
      END AS other_user_id,
      MAX(m.created_at) AS last_message_time
    FROM 
      public.messages m
    WHERE 
      m.sender_id = v_user_id OR m.recipient_id = v_user_id
    GROUP BY 
      m.conversation_id,
      other_user_id
  )
  SELECT 
    c.conversation_id,
    c.other_user_id,
    p.full_name AS other_user_name,
    p.avatar_url AS other_user_avatar,
    (
      SELECT m.content
      FROM public.messages m
      WHERE m.conversation_id = c.conversation_id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_content,
    c.last_message_time,
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.conversation_id = c.conversation_id
      AND m.recipient_id = v_user_id
      AND m.is_read = false
    ) AS unread_count
  FROM 
    conversations c
  JOIN 
    public.profiles p ON c.other_user_id = p.id
  ORDER BY 
    c.last_message_time DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation messages
CREATE OR REPLACE FUNCTION get_conversation_messages(
  p_other_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  content text,
  created_at timestamp with time zone,
  is_read boolean,
  attachment_url text
)
SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_conversation_id text;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Generate the conversation ID
  IF v_user_id < p_other_user_id THEN
    v_conversation_id := v_user_id::text || '-' || p_other_user_id::text;
  ELSE
    v_conversation_id := p_other_user_id::text || '-' || v_user_id::text;
  END IF;
  
  -- Mark all unread messages in this conversation as read
  UPDATE public.messages
  SET is_read = true
  WHERE 
    conversation_id = v_conversation_id AND 
    recipient_id = v_user_id AND
    is_read = false;
  
  -- Return the messages
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.recipient_id,
    m.content,
    m.created_at,
    m.is_read,
    m.attachment_url
  FROM 
    public.messages m
  WHERE 
    m.conversation_id = v_conversation_id
  ORDER BY 
    m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  type text,
  title text,
  content text,
  is_read boolean,
  action_link text,
  related_id uuid
)
SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  RETURN QUERY
  SELECT 
    n.id,
    n.created_at,
    n.type,
    n.title,
    n.content,
    n.is_read,
    n.action_link,
    n.related_id
  FROM 
    public.notifications n
  WHERE 
    n.user_id = v_user_id
  ORDER BY 
    n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread counts for the inbox
CREATE OR REPLACE FUNCTION get_inbox_unread_counts()
RETURNS json
SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_result json;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  SELECT json_build_object(
    'messages', (
      SELECT COUNT(*)
      FROM public.messages
      WHERE recipient_id = v_user_id AND is_read = false
    ),
    'notifications', (
      SELECT COUNT(*)
      FROM public.notifications
      WHERE user_id = v_user_id AND is_read = false
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to get all messages for admin
CREATE OR REPLACE FUNCTION get_all_messages_admin()
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  sender_id uuid,
  sender_name text,
  recipient_id uuid,
  recipient_name text,
  content text,
  is_read boolean,
  attachment_url text
)
SECURITY DEFINER AS $$
BEGIN
  IF NOT check_if_admin() THEN
    RAISE EXCEPTION 'Unauthorized access: admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.created_at,
    m.sender_id,
    sender.full_name AS sender_name,
    m.recipient_id,
    recipient.full_name AS recipient_name,
    m.content,
    m.is_read,
    m.attachment_url
  FROM 
    public.messages m
  JOIN 
    public.profiles sender ON m.sender_id = sender.id
  JOIN 
    public.profiles recipient ON m.recipient_id = recipient.id
  ORDER BY 
    m.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Function to send a system notification to a user
CREATE OR REPLACE FUNCTION send_system_notification(
  p_user_id uuid,
  p_title text,
  p_content text,
  p_action_link text DEFAULT NULL,
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT check_if_admin() THEN
    RAISE EXCEPTION 'Unauthorized access: admin privileges required';
  END IF;
  
  -- Insert the notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    action_link,
    related_id
  ) VALUES (
    p_user_id,
    'system',
    p_title,
    p_content,
    p_action_link,
    p_related_id
  ) RETURNING id INTO v_notification_id;
  
  -- Return the new notification ID
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION public.send_message(uuid,text,text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_message_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(integer,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_conversation_messages(uuid,integer,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(integer,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_inbox_unread_counts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_messages_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_system_notification(uuid,text,text,text,uuid) TO authenticated, service_role; 