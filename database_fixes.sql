-- =================================================================
-- DEEP DATABASE FIXES SCRIPT
-- =================================================================
-- Instructions:
-- This script overhauls key data-fetching functions to ensure
-- consistent and correct data types are used across the application,
-- resolving all known bigint/UUID mismatch errors.
--
-- Please run this entire script in your Supabase SQL Editor once.
-- =================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create or update the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    updated_at timestamptz DEFAULT now(),
    full_name text,
    avatar_url text,
    stripe_connect_id text,
    stripe_customer_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    role text NOT NULL DEFAULT 'user',
    is_banned boolean NOT NULL DEFAULT false,
    ban_reason text,
    ban_expires_at timestamptz,
    is_verified boolean DEFAULT false
);

-- Ensure Stripe columns exist on profiles table, even if table was created by an older script
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create or update the listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    title text,
    description text,
    price_per_day numeric,
    location text,
    location_lat numeric,
    location_lng numeric,
    location_geom geometry(point, 4326),
    location_text text,
    user_id uuid REFERENCES public.profiles(id),
    image_urls text[],
    image_360_url text,
    category text,
    view_count integer DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    is_verified boolean NOT NULL DEFAULT false,
    rejection_reason text,
    availability_status text DEFAULT 'available',
    features jsonb DEFAULT '{}',
    rules jsonb DEFAULT '{}'
);

-- Create or update the bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    renter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date timestamptz,
    end_date timestamptz,
    total_price numeric,
    status text DEFAULT 'pending',
    view_count integer DEFAULT 0
);

-- Create or update the user_reviews table
CREATE TABLE IF NOT EXISTS public.user_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE
);

-- Create or update the favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    UNIQUE(user_id, listing_id)
);

-- 1. Drop Triggers First to remove dependencies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_listings_updated_at ON public.listings;
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

-- 1. Drop old, problematic, or replaced functions with EXACT signatures
DROP FUNCTION IF EXISTS public.get_listings_with_ratings(text,text,integer,text,integer,integer,integer,double precision,double precision,integer,integer,uuid,uuid);
DROP FUNCTION IF EXISTS public.get_all_reviews_admin();
DROP FUNCTION IF EXISTS public.get_all_reviews_admin(text);
DROP FUNCTION IF EXISTS public.get_all_bookings_admin();
DROP FUNCTION IF EXISTS public.get_listings_paged(text,text,integer,integer,text,text,numeric,numeric,numeric,double precision,double precision,integer);
DROP FUNCTION IF EXISTS public.get_listing_details(text);
DROP FUNCTION IF EXISTS public.get_all_listings_admin();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.get_reviews_for_listing(uuid);
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.reviews;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public listings are viewable by everyone." ON public.listings;
CREATE POLICY "Public listings are viewable by everyone." ON public.listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own listings." ON public.listings;
CREATE POLICY "Users can insert their own listings." ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own listings." ON public.listings;
CREATE POLICY "Users can update their own listings." ON public.listings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own listings." ON public.listings;
CREATE POLICY "Users can delete their own listings." ON public.listings FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own bookings." ON public.bookings;
CREATE POLICY "Users can see their own bookings." ON public.bookings FOR SELECT USING (auth.uid() = renter_id);
DROP POLICY IF EXISTS "Owners can see bookings for their listings." ON public.bookings;
CREATE POLICY "Owners can see bookings for their listings." ON public.bookings FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id));
DROP POLICY IF EXISTS "Users can create bookings." ON public.bookings;
CREATE POLICY "Users can create bookings." ON public.bookings FOR INSERT WITH CHECK (auth.uid() = renter_id);
DROP POLICY IF EXISTS "Users can update their own bookings." ON public.bookings;
CREATE POLICY "Users can update their own bookings." ON public.bookings FOR UPDATE USING (auth.uid() = renter_id);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are public." ON public.user_reviews;
CREATE POLICY "Reviews are public." ON public.user_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews." ON public.user_reviews;
CREATE POLICY "Users can create reviews." ON public.user_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "Users can delete their own reviews." ON public.user_reviews;
CREATE POLICY "Users can delete their own reviews." ON public.user_reviews FOR DELETE USING (auth.uid() = reviewer_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own favorites." ON public.favorites;
CREATE POLICY "Users can view their own favorites." ON public.favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own favorites." ON public.favorites;
CREATE POLICY "Users can insert their own favorites." ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own favorites." ON public.favorites;
CREATE POLICY "Users can delete their own favorites." ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url
    WHERE profiles.full_name IS NULL OR profiles.avatar_url IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_listings_updated_at') THEN
        CREATE TRIGGER set_listings_updated_at
            BEFORE UPDATE ON public.listings
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at') THEN
        CREATE TRIGGER set_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;
END
$$;

-- Create trigger for handling new user signups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;

-- Create the listing_ratings view
CREATE OR REPLACE VIEW public.listing_ratings AS
SELECT
    listing_id,
    COUNT(id) as review_count,
    AVG(rating)::numeric(3,2) as average_rating
FROM
    public.user_reviews
GROUP BY
    listing_id;

-- 2. Create a robust, paginated function for fetching listings.
-- This will be the primary function for the Home and Browse pages.
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
    p_nearby_radius INT DEFAULT 50000
)
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    title text,
    description text,
    price_per_day numeric,
    location_text text,
    image_urls text[],
    image_360_url text,
    owner_id uuid,
    category text,
    owner_name text,
    owner_avatar_url text,
    owner_is_verified boolean,
    average_rating numeric,
    review_count bigint,
    view_count integer,
    availability_status text
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
        l.image_360_url,
        l.user_id AS owner_id,
        l.category,
        p.full_name AS owner_name,
        p.avatar_url AS owner_avatar_url,
        p.is_verified AS owner_is_verified,
        COALESCE(lr.average_rating, 0)::numeric as average_rating,
        COALESCE(lr.review_count, 0)::bigint as review_count,
        COALESCE(l.view_count, 0) as view_count,
        COALESCE(l.availability_status, 'available') as availability_status
    FROM
        public.listings l
    JOIN
        public.profiles p ON l.user_id = p.id
    LEFT JOIN
        public.listing_ratings lr ON l.id = lr.listing_id
    WHERE
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
        CASE 
            WHEN p_sort_column = 'created_at' AND p_sort_direction = 'desc' THEN l.created_at END DESC NULLS LAST,
        CASE 
            WHEN p_sort_column = 'created_at' AND p_sort_direction = 'asc' THEN l.created_at END ASC NULLS LAST,
        CASE 
            WHEN p_sort_column = 'price_per_day' AND p_sort_direction = 'desc' THEN l.price_per_day END DESC NULLS LAST,
        CASE 
            WHEN p_sort_column = 'price_per_day' AND p_sort_direction = 'asc' THEN l.price_per_day END ASC NULLS LAST,
        CASE 
            WHEN p_sort_column = 'average_rating' AND p_sort_direction = 'desc' THEN COALESCE(lr.average_rating, 0) END DESC NULLS LAST,
        CASE 
            WHEN p_sort_column = 'average_rating' AND p_sort_direction = 'asc' THEN COALESCE(lr.average_rating, 0) END ASC NULLS LAST,
        l.created_at DESC -- Default sort if no other sort matches
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to get reviews for a specific listing, including user info.
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
    SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.reviewer_id,
        p.full_name,
        p.avatar_url
    FROM
        public.user_reviews r
    JOIN
        public.profiles p ON r.reviewer_id = p.id
    WHERE
        r.listing_id = p_listing_id
    ORDER BY
        r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate admin functions to include user names.
CREATE OR REPLACE FUNCTION get_all_reviews_admin()
RETURNS TABLE (
    id UUID,
    listing_id UUID,
    reviewer_id UUID,
    rating NUMERIC,
    comment TEXT,
    created_at TIMESTAMPTZ,
    listing_title TEXT,
    reviewer_name TEXT,
    reviewer_avatar TEXT
) AS $$
BEGIN
    IF NOT (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'admin' THEN
        RAISE EXCEPTION 'Only admins can access all reviews';
    END IF;

    RETURN QUERY
    SELECT
        r.id, r.listing_id, r.reviewer_id, r.rating, r.comment, r.created_at,
        l.title as listing_title,
        p.full_name as reviewer_name,
        p.avatar_url as reviewer_avatar
    FROM public.user_reviews r
    JOIN public.listings l ON r.listing_id = l.id
    JOIN public.profiles p ON r.reviewer_id = p.id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_all_bookings_admin()
RETURNS TABLE (
    id UUID,
    listing_id UUID,
    renter_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    total_price NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ,
    listing_title TEXT,
    renter_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id, b.listing_id, b.renter_id, b.start_date, b.end_date, b.total_price, b.status, b.created_at,
        l.title as listing_title,
        p.full_name as renter_name
    FROM public.bookings b
    JOIN public.listings l ON b.listing_id = l.id
    JOIN public.profiles p ON b.renter_id = p.id
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate get_listing_details function
DROP FUNCTION IF EXISTS public.get_listing_details(text);
CREATE OR REPLACE FUNCTION public.get_listing_details(p_listing_id text)
RETURNS TABLE (
    id text,
    title text,
    description text,
    category text,
    price_per_day numeric,
    image_urls text[],
    image_360_url text,
    created_at timestamp with time zone,
    owner_id text,
    owner_name text,
    owner_avatar_url text,
    owner_is_verified boolean,
    owner_joined_at timestamp with time zone,
    location_lat double precision,
    location_lng double precision,
    location_text text,
    average_rating numeric,
    review_count bigint,
    view_count integer,
    availability_status text,
    features jsonb,
    rules jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id::text,
        l.title,
        l.description,
        l.category,
        l.price_per_day,
        l.image_urls,
        l.image_360_url,
        l.created_at,
        l.user_id::text as owner_id,
        p.full_name as owner_name,
        p.avatar_url as owner_avatar_url,
        p.is_verified as owner_is_verified,
        p.created_at as owner_joined_at,
        ST_Y(l.location_geom::geometry) as location_lat,
        ST_X(l.location_geom::geometry) as location_lng,
        COALESCE(l.location_text, l.location) as location_text,
        COALESCE(lr.average_rating, 0)::numeric as average_rating,
        COALESCE(lr.review_count, 0)::bigint as review_count,
        COALESCE(l.view_count, 0) as view_count,
        COALESCE(l.availability_status, 'available') as availability_status,
        COALESCE(l.features, '{}') as features,
        COALESCE(l.rules, '{}') as rules
    FROM 
        public.listings l
        JOIN public.profiles p ON l.user_id = p.id
        LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
    WHERE 
        l.id::text = p_listing_id;
END;
$$;

-- Fix any existing profile issues
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT 
    users.id,
    users.raw_user_meta_data->>'full_name',
    users.raw_user_meta_data->>'avatar_url'
FROM auth.users
LEFT JOIN public.profiles ON users.id = profiles.id
WHERE profiles.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url
WHERE profiles.full_name IS NULL OR profiles.avatar_url IS NULL;

-- 6. Grant permissions for new/updated functions
GRANT EXECUTE ON FUNCTION public.get_listings_paged(TEXT,TEXT,INT,INT,TEXT,TEXT,NUMERIC,NUMERIC,NUMERIC,FLOAT,FLOAT,INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_reviews_for_listing(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_reviews_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_bookings_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_listing_details(text) TO authenticated, service_role;

-- =================================================================
-- ADMIN FUNCTIONS (Corrected)
-- =================================================================

-- Function to get all users for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE (
    id uuid,
    created_at timestamptz,
    full_name text,
    email text,
    role text,
    is_banned boolean,
    is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
    IF NOT (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'admin' THEN
        RAISE EXCEPTION 'Only admins can access all users';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.created_at,
        p.full_name,
        u.email,
        p.role,
        p.is_banned,
        p.is_verified
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Function to get recent admin activity
CREATE OR REPLACE FUNCTION public.get_recent_admin_activity(p_limit INT)
RETURNS TABLE (
    id bigint,
    admin_id uuid,
    admin_name text,
    action text,
    target_id uuid,
    target_type text,
    details jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
    IF NOT (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) = 'admin' THEN
        RAISE EXCEPTION 'Only admins can access activity logs';
    END IF;

    RETURN QUERY
    SELECT 
        aal.id,
        aal.admin_id,
        p.full_name as admin_name,
        aal.action,
        aal.target_id,
        aal.target_type,
        aal.details,
        aal.created_at
    FROM public.admin_activity_log aal
    JOIN public.profiles p ON aal.admin_id = p.id
    ORDER BY aal.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id bigserial PRIMARY KEY,
    admin_id uuid REFERENCES public.profiles(id),
    action text NOT NULL,
    target_id uuid,
    target_type text,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recent_admin_activity(INT) TO authenticated, service_role; 