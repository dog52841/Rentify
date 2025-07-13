-- =================================================================
-- Name: 20240611000000_final_consolidated_schema.sql
-- Description: The one and only migration file. Sets up the full schema.
-- =================================================================

-- =================================================================
-- Helper Functions (Must be created before they are used in policies)
-- =================================================================
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = p_user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- Table: admin_activity_log
-- This table must be created first as it's referenced by other functions
-- =================================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.admin_activity_log;
CREATE POLICY "Admins can view all activity logs" ON public.admin_activity_log
    FOR SELECT USING (public.is_admin(auth.uid()));

-- =================================================================
-- Table: profiles
-- Note: This is managed by Supabase Auth, but we add RLS and a trigger.
-- =================================================================
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Allow users to read all profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
    FOR SELECT USING (true);
-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =================================================================
-- Table: stripe_connect_accounts
-- =================================================================
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    stripe_account_id TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS for stripe_connect_accounts
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own stripe account" ON public.stripe_connect_accounts;
CREATE POLICY "Users can view their own stripe account" ON stripe_connect_accounts
    FOR SELECT USING (auth.uid() = user_id);

-- =================================================================
-- Table: listings
-- Note: Adding new columns for reporting functionality.
-- =================================================================
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT; -- Used for both rejection and reporting

-- =================================================================
-- Table: bookings
-- =================================================================
-- Drop the table if it exists to avoid column name conflicts
DROP TABLE IF EXISTS public.bookings CASCADE;

CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., 'pending', 'confirmed', 'cancelled'
    total_price INT NOT NULL, -- in cents
    payment_intent_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);
-- RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = owner_id);
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = renter_id);
DROP POLICY IF EXISTS "Owners can update booking status" ON public.bookings;
CREATE POLICY "Owners can update booking status" ON public.bookings
    FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- =================================================================
-- Table: reviews
-- =================================================================
DROP TABLE IF EXISTS public.reviews CASCADE;
CREATE TABLE public.reviews (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (booking_id) -- A booking can only be reviewed once
);
-- RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Public can read reviews" ON public.reviews
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.reviews;
CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
    FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- =================================================================
-- Table: site_settings
-- =================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings
    FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can read site settings" ON public.site_settings;
CREATE POLICY "Authenticated users can read site settings" ON public.site_settings
    FOR SELECT USING (auth.role() = 'authenticated');
-- Default site settings data
INSERT INTO public.site_settings (key, value, description) VALUES
    ('maintenance_mode', '{"enabled": false, "message": "The platform is currently under maintenance. Please check back later."}', 'Controls the site-wide maintenance mode.'),
    ('platform_fees', '{"percentage": 5, "minimum": 1.00}', 'Platform fee structure (percentage and minimum fee in USD).'),
    ('listing_config', '{"max_images": 10}', 'Configuration for listings, such as maximum image uploads.')
ON CONFLICT (key) DO NOTHING;

-- =================================================================
-- Functions
-- =================================================================

-- Site Settings Functions
CREATE OR REPLACE FUNCTION get_all_site_settings()
RETURNS SETOF public.site_settings
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.site_settings;
END;
$$;
CREATE OR REPLACE FUNCTION update_site_setting(p_key TEXT, p_value JSONB, p_admin_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Only admins can update site settings.';
    END IF;
    UPDATE public.site_settings SET value = p_value, updated_at = NOW() WHERE key = p_key;
    INSERT INTO admin_activity_log(user_id, action, target_type, target_id, details)
    VALUES (p_admin_id, 'update_site_setting', 'setting', p_key, jsonb_build_object('new_value', p_value));
END;
$$;

-- User Profile Function
CREATE OR REPLACE FUNCTION public.get_user_profile_details(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_profile JSONB;
    v_listings JSONB;
    v_reviews JSONB;
BEGIN
    SELECT jsonb_build_object('id', p.id, 'created_at', p.created_at, 'full_name', p.full_name, 'avatar_url', p.avatar_url, 'is_verified', p.is_verified, 'bio', p.bio, 'banner_url', p.banner_url, 'website_url', p.website_url, 'social_links', p.social_links, 'stats', (SELECT jsonb_build_object('total_listings', COUNT(l.id), 'average_rating', COALESCE(AVG(r.rating), 0), 'review_count', COUNT(r.id)) FROM listings l LEFT JOIN reviews r ON l.id = r.listing_id WHERE l.user_id = p.id))
    INTO v_profile FROM profiles p WHERE p.id = p_user_id;
    SELECT jsonb_agg(jsonb_build_object('id', l.id, 'title', l.title, 'price_per_day', l.price_per_day, 'images_urls', l.image_urls, 'location_text', l.location, 'average_rating', COALESCE((SELECT AVG(rating) FROM reviews WHERE listing_id = l.id), 0), 'review_count', COALESCE((SELECT COUNT(*) FROM reviews WHERE listing_id = l.id), 0)))
    INTO v_listings FROM listings l WHERE l.user_id = p_user_id AND l.status = 'active';
    SELECT jsonb_agg(jsonb_build_object('id', r.id, 'rating', r.rating, 'comment', r.content, 'created_at', r.created_at, 'listing_title', l.title, 'reviewer', jsonb_build_object('id', rev.id, 'full_name', rev.full_name, 'avatar_url', rev.avatar_url)))
    INTO v_reviews FROM reviews r JOIN listings l ON r.listing_id = l.id JOIN profiles rev ON r.reviewer_id = rev.id WHERE r.reviewee_id = p_user_id;
    RETURN jsonb_build_object('profile', v_profile, 'listings', COALESCE(v_listings, '[]'::jsonb), 'reviews', COALESCE(v_reviews, '[]'::jsonb));
END;
$$;

-- Admin Panel Functions
DROP FUNCTION IF EXISTS public.get_recent_admin_activity(int);
CREATE OR REPLACE FUNCTION public.get_recent_admin_activity(p_limit INT DEFAULT 10)
RETURNS TABLE (id UUID, created_at TIMESTAMPTZ, action TEXT, target_type TEXT, target_id TEXT, details JSONB, actor_name TEXT, actor_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT aal.id, aal.created_at, aal.action, aal.target_type, aal.target_id, aal.details, p.full_name, aal.user_id
    FROM admin_activity_log aal JOIN profiles p ON aal.user_id = p.id
    ORDER BY aal.created_at DESC
    LIMIT p_limit;
END;
$$;

DROP FUNCTION IF EXISTS public.get_all_users_admin(text, text, text);
CREATE OR REPLACE FUNCTION public.get_all_users_admin(p_search_term TEXT, p_filter_by_role TEXT, p_filter_by_status TEXT)
RETURNS TABLE (id UUID, full_name TEXT, email TEXT, role TEXT, is_banned BOOLEAN, is_verified BOOLEAN, created_at TIMESTAMPTZ, ban_reason TEXT, ban_expires_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.full_name, u.email, p.role, p.is_banned, p.is_verified, u.created_at, p.ban_reason, p.ban_expires_at
    FROM profiles p JOIN auth.users u ON p.id = u.id
    WHERE (p_search_term = '' OR p.full_name ILIKE '%' || p_search_term || '%' OR u.email ILIKE '%' || p_search_term || '%')
    AND (p_filter_by_role = 'all' OR p.role = p_filter_by_role)
    AND (p_filter_by_status = 'all' OR (p_filter_by_status = 'banned' AND p.is_banned = TRUE) OR (p_filter_by_status = 'verified' AND p.is_verified = TRUE))
    ORDER BY u.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_all_listings_admin(text);
CREATE OR REPLACE FUNCTION public.get_all_listings_admin(p_status_filter TEXT)
RETURNS TABLE (id UUID, title TEXT, status TEXT, is_verified BOOLEAN, created_at TIMESTAMPTZ, owner_full_name TEXT, owner_id UUID, rejection_reason TEXT, is_reported BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT l.id, l.title, l.status, l.is_verified, l.created_at, p.full_name, l.user_id, l.rejection_reason, l.is_reported
    FROM listings l JOIN profiles p ON l.user_id = p.id
    WHERE (p_status_filter = 'all') OR (p_status_filter = 'reported' AND l.is_reported = TRUE) OR (l.status = p_status_filter AND (l.is_reported = FALSE OR l.is_reported IS NULL))
    ORDER BY CASE WHEN l.is_reported = TRUE THEN 0 ELSE 1 END, CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END, l.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_all_reviews_admin(text);
CREATE OR REPLACE FUNCTION public.get_all_reviews_admin(p_search_term TEXT)
RETURNS TABLE (id INT, created_at TIMESTAMPTZ, listing_id UUID, reviewer_id UUID, reviewee_id UUID, rating NUMERIC, content TEXT, listing_title TEXT, reviewer_name TEXT, reviewee_name TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.created_at, r.listing_id, r.reviewer_id, r.reviewee_id, r.rating, r.content, l.title, rev.full_name, ree.full_name
    FROM reviews r
    JOIN listings l ON r.listing_id = l.id
    JOIN profiles rev ON r.reviewer_id = rev.id
    JOIN profiles ree ON r.reviewee_id = ree.id
    WHERE (p_search_term = '' OR r.content ILIKE '%' || p_search_term || '%' OR l.title ILIKE '%' || p_search_term || '%' OR rev.full_name ILIKE '%' || p_search_term || '%' OR ree.full_name ILIKE '%' || p_search_term || '%');
END;
$$;

-- Listing Details Function (Corrected)
DROP FUNCTION IF EXISTS public.get_listing_details(uuid);
CREATE OR REPLACE FUNCTION public.get_listing_details(p_listing_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price_per_day NUMERIC,
    image_urls TEXT[],
    image_360_url TEXT,
    location TEXT,
    location_geom GEOMETRY,
    user_id UUID,
    status TEXT,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    owner_id UUID,
    owner_name TEXT,
    owner_avatar_url TEXT,
    owner_is_verified BOOLEAN,
    average_rating NUMERIC,
    review_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.title,
        l.description,
        l.price_per_day,
        l.image_urls,
        l.image_360_url,
        l.location,
        l.location_geom,
        l.user_id,
        l.status,
        l.is_verified,
        l.created_at,
        l.updated_at,
        p.id as owner_id,
        p.full_name as owner_name,
        p.avatar_url as owner_avatar_url,
        p.is_verified as owner_is_verified,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.listing_id = l.id) as average_rating,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.listing_id = l.id) as review_count
    FROM
        listings l
    JOIN
        profiles p ON l.user_id = p.id
    WHERE
        l.id = p_listing_id;
END;
$$;

-- Function to process payment intents from Stripe webhook
DROP FUNCTION IF EXISTS public.process_payment_intent(text, uuid, uuid, uuid, text, text, integer);
CREATE OR REPLACE FUNCTION public.process_payment_intent(
    p_payment_intent_id TEXT,
    p_listing_id UUID,
    p_guest_id UUID,
    p_host_id UUID,
    p_start_date TEXT,
    p_end_date TEXT,
    p_amount INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_id UUID;
BEGIN
    INSERT INTO public.bookings (
        listing_id,
        renter_id,  -- Correct column name
        owner_id,   -- Correct column name
        start_date,
        end_date,
        status,
        total_price,
        payment_intent_id
    ) VALUES (
        p_listing_id,
        p_guest_id,  -- Maps to renter_id
        p_host_id,   -- Maps to owner_id
        p_start_date::TIMESTAMPTZ,
        p_end_date::TIMESTAMPTZ,
        'confirmed',
        p_amount,
        p_payment_intent_id
    )
    RETURNING id INTO v_booking_id;
    
    RETURN v_booking_id;
END;
$$;

-- Listing Report Functions
DROP FUNCTION IF EXISTS public.report_listing(uuid, uuid, text);
CREATE OR REPLACE FUNCTION public.report_listing(p_listing_id UUID, p_reporter_id UUID, p_reason TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE listings SET is_reported = TRUE, rejection_reason = p_reason WHERE id = p_listing_id;
    INSERT INTO admin_activity_log (user_id, action, target_type, target_id, details)
    VALUES (p_reporter_id, 'report_listing', 'listing', p_listing_id, jsonb_build_object('reason', p_reason));
    RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS public.dismiss_listing_report(uuid, uuid);
CREATE OR REPLACE FUNCTION public.dismiss_listing_report(p_listing_id UUID, p_admin_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Only admins can dismiss reports.';
    END IF;
    UPDATE listings SET is_reported = FALSE WHERE id = p_listing_id;
    INSERT INTO admin_activity_log (user_id, action, target_type, target_id)
    VALUES (p_admin_id, 'dismiss_report', 'listing', p_listing_id);
    RETURN TRUE;
END;
$$;

-- =================================================================
-- Permissions
-- =================================================================
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_site_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_site_setting(TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_admin_activity(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_admin(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_listings_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_reviews_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_listing_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_intent(TEXT, UUID, UUID, UUID, TEXT, TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_listing(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_listing_report(UUID, UUID) TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role; 