-- =================================================================
-- ADD BIO AND BANNER TO PROFILES
-- =================================================================
-- Instructions:
-- This script adds `bio` and `banner_url` columns to your `profiles` table
-- to allow for greater user customization.
--
-- Please run this script in your Supabase SQL Editor once.
-- =================================================================

-- Add a column for the user's bio
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add a column for the user's profile banner image
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Update the get_user_profile_details function to include the new fields
DROP FUNCTION IF EXISTS public.get_user_profile_details(p_user_id UUID);
CREATE OR REPLACE FUNCTION public.get_user_profile_details(p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    profile_data json;
    listings_data json;
    reviews_data json;
BEGIN
    -- Get profile and stats
    SELECT json_build_object(
        'id', p.id,
        'created_at', p.created_at,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'is_verified', p.is_verified,
        'bio', p.bio,
        'banner_url', p.banner_url,
        'stats', (
            SELECT json_build_object(
                'total_listings', COUNT(l.id),
                'average_rating', COALESCE(AVG(ur.rating)::numeric(3,2), 0),
                'review_count', COUNT(DISTINCT ur.id)
            )
            FROM public.listings l
            LEFT JOIN public.user_reviews ur ON l.id = ur.listing_id
            WHERE l.owner_id = p.id
        )
    )
    INTO profile_data
    FROM public.profiles p
    WHERE p.id = p_user_id;

    -- Get user's listings
    SELECT json_agg(
        json_build_object(
            'id', l.id,
            'title', l.title,
            'price_per_day', l.price_per_day,
            'images_urls', l.images_urls,
            'location_text', l.location_text,
            'average_rating', COALESCE(lr.average_rating, 0),
            'review_count', COALESCE(lr.review_count, 0)
        ) ORDER BY l.created_at DESC
    )
    INTO listings_data
    FROM public.listings l
    LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
    WHERE l.owner_id = p_user_id AND l.status = 'verified';

    -- Get reviews about the user
    SELECT json_agg(
        json_build_object(
            'id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'created_at', r.created_at,
            'listing_title', l.title,
            'reviewer', json_build_object(
                'id', rev_p.id,
                'full_name', rev_p.full_name,
                'avatar_url', rev_p.avatar_url
            )
        ) ORDER BY r.created_at DESC
    )
    INTO reviews_data
    FROM public.user_reviews r
    JOIN public.profiles rev_p ON r.reviewer_id = rev_p.id
    JOIN public.listings l ON r.listing_id = l.id
    WHERE r.reviewee_id = p_user_id;

    -- Combine and return all data
    RETURN json_build_object(
        'profile', profile_data,
        'listings', COALESCE(listings_data, '[]'::json),
        'reviews', COALESCE(reviews_data, '[]'::json)
    );
END;
$$;

-- Grant necessary permissions for the updated function
GRANT EXECUTE ON FUNCTION public.get_user_profile_details(UUID) TO authenticated, service_role;

-- =================================================================
-- ADD MORE PROFILE CUSTOMIZATION
-- =================================================================
-- Instructions:
-- This script adds `website_url` and `social_links` columns to your
-- `profiles` table for more in-depth customization.
-- =================================================================

-- Add columns for website and social media links
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB;

-- Update the get_user_profile_details function to include the new fields
DROP FUNCTION IF EXISTS public.get_user_profile_details(p_user_id UUID);
CREATE OR REPLACE FUNCTION public.get_user_profile_details(p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    profile_data json;
    listings_data json;
    reviews_data json;
BEGIN
    -- Get profile and stats
    SELECT json_build_object(
        'id', p.id,
        'created_at', p.created_at,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'is_verified', p.is_verified,
        'bio', p.bio,
        'banner_url', p.banner_url,
        'website_url', p.website_url,
        'social_links', p.social_links,
        'stats', (
            SELECT json_build_object(
                'total_listings', COUNT(l.id),
                'average_rating', COALESCE(AVG(ur.rating)::numeric(3,2), 0),
                'review_count', COUNT(DISTINCT ur.id)
            )
            FROM public.listings l
            LEFT JOIN public.user_reviews ur ON l.id = ur.listing_id
            WHERE l.owner_id = p.id
        )
    )
    INTO profile_data
    FROM public.profiles p
    WHERE p.id = p_user_id;

    -- Get user's listings
    SELECT json_agg(
        json_build_object(
            'id', l.id,
            'title', l.title,
            'price_per_day', l.price_per_day,
            'images_urls', l.images_urls,
            'location_text', l.location_text,
            'average_rating', COALESCE(lr.average_rating, 0),
            'review_count', COALESCE(lr.review_count, 0)
        ) ORDER BY l.created_at DESC
    )
    INTO listings_data
    FROM public.listings l
    LEFT JOIN public.listing_ratings lr ON l.id = lr.listing_id
    WHERE l.owner_id = p_user_id AND l.status = 'verified';

    -- Get reviews about the user
    SELECT json_agg(
        json_build_object(
            'id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'created_at', r.created_at,
            'listing_title', l.title,
            'reviewer', json_build_object(
                'id', rev_p.id,
                'full_name', rev_p.full_name,
                'avatar_url', rev_p.avatar_url
            )
        ) ORDER BY r.created_at DESC
    )
    INTO reviews_data
    FROM public.user_reviews r
    JOIN public.profiles rev_p ON r.reviewer_id = rev_p.id
    JOIN public.listings l ON r.listing_id = l.id
    WHERE r.reviewee_id = p_user_id;

    -- Combine and return all data
    RETURN json_build_object(
        'profile', profile_data,
        'listings', COALESCE(listings_data, '[]'::json),
        'reviews', COALESCE(reviews_data, '[]'::json)
    );
END;
$$;

-- Grant necessary permissions for the updated function
GRANT EXECUTE ON FUNCTION public.get_user_profile_details(UUID) TO authenticated, service_role; 