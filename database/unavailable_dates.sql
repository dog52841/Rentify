-- =================================================================
-- UNAVAILABLE DATES FUNCTIONALITY
-- =================================================================
-- This script adds the unavailable_dates table and related functions
-- to allow listing owners to block specific dates for their listings.
-- =================================================================

-- Create the unavailable_dates table
CREATE TABLE IF NOT EXISTS public.unavailable_dates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    date date NOT NULL,
    reason text,
    UNIQUE(listing_id, date)
);

-- Add RLS policies for the unavailable_dates table
ALTER TABLE public.unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Allow listing owners to manage their unavailable dates
CREATE POLICY "Listing owners can manage unavailable dates" 
ON public.unavailable_dates
USING (
    auth.uid() IN (
        SELECT user_id FROM public.listings WHERE id = listing_id
    )
);

-- Allow anyone to view unavailable dates
CREATE POLICY "Anyone can view unavailable dates" 
ON public.unavailable_dates
FOR SELECT
USING (true);

-- Function to add an unavailable date
CREATE OR REPLACE FUNCTION public.add_unavailable_date(
    p_listing_id uuid,
    p_date date,
    p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_date_id uuid;
BEGIN
    -- Check if the user owns the listing
    SELECT user_id INTO v_user_id
    FROM public.listings
    WHERE id = p_listing_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Listing not found';
    END IF;
    
    IF v_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'You do not have permission to modify this listing';
    END IF;
    
    -- Insert the unavailable date
    INSERT INTO public.unavailable_dates (listing_id, date, reason)
    VALUES (p_listing_id, p_date, p_reason)
    RETURNING id INTO v_date_id;
    
    RETURN v_date_id;
END;
$$;

-- Function to remove an unavailable date
CREATE OR REPLACE FUNCTION public.remove_unavailable_date(
    p_date_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if the user owns the listing
    SELECT l.user_id INTO v_user_id
    FROM public.unavailable_dates ud
    JOIN public.listings l ON ud.listing_id = l.id
    WHERE ud.id = p_date_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unavailable date not found';
    END IF;
    
    IF v_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'You do not have permission to modify this listing';
    END IF;
    
    -- Delete the unavailable date
    DELETE FROM public.unavailable_dates
    WHERE id = p_date_id;
    
    RETURN true;
END;
$$;

-- Function to get all unavailable dates for a listing
CREATE OR REPLACE FUNCTION public.get_listing_unavailable_dates(
    p_listing_id uuid
)
RETURNS TABLE (
    id uuid,
    date date,
    reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ud.id, ud.date, ud.reason
    FROM public.unavailable_dates ud
    WHERE ud.listing_id = p_listing_id
    ORDER BY ud.date;
END;
$$;

-- Function to check if a date range is available for a listing
CREATE OR REPLACE FUNCTION public.check_listing_availability(
    p_listing_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unavailable_count integer;
    v_booking_count integer;
BEGIN
    -- Check for unavailable dates within the range
    SELECT COUNT(*) INTO v_unavailable_count
    FROM public.unavailable_dates ud
    WHERE ud.listing_id = p_listing_id
    AND ud.date BETWEEN p_start_date AND p_end_date;
    
    -- Check for existing bookings within the range
    SELECT COUNT(*) INTO v_booking_count
    FROM public.bookings b
    WHERE b.listing_id = p_listing_id
    AND b.status IN ('confirmed', 'pending')
    AND (
        (b.start_date <= p_end_date AND b.end_date >= p_start_date) -- Overlapping dates
    );
    
    -- Return true if there are no unavailable dates or bookings in the range
    RETURN v_unavailable_count = 0 AND v_booking_count = 0;
END;
$$;

-- Grant permissions to execute the functions
GRANT EXECUTE ON FUNCTION public.add_unavailable_date(uuid, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_unavailable_date(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_listing_unavailable_dates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_listing_availability(uuid, date, date) TO authenticated; 