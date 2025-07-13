-- Corrected Rentify Database Schema with Unavailable Dates Feature
-- This script adds the unavailable dates feature to the existing database structure
-- NO SAMPLE DATA - just schema changes

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create unavailable_dates table
CREATE TABLE IF NOT EXISTS unavailable_dates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(listing_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_listing_id ON unavailable_dates(listing_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_date ON unavailable_dates(date);

-- Enable RLS for unavailable_dates
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for unavailable_dates
CREATE POLICY "Anyone can view unavailable dates" ON unavailable_dates FOR SELECT USING (true);
CREATE POLICY "Listing owners can manage unavailable dates" ON unavailable_dates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM listings 
        WHERE id = unavailable_dates.listing_id 
        AND user_id = auth.uid()
    )
);

-- Function to add unavailable date
CREATE OR REPLACE FUNCTION add_unavailable_date(
    p_listing_id UUID,
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Check if date is already unavailable
    IF EXISTS (
        SELECT 1 FROM unavailable_dates 
        WHERE listing_id = p_listing_id AND date = p_date
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Date is already marked as unavailable'
        );
    END IF;

    -- Add the unavailable date
    INSERT INTO unavailable_dates (listing_id, date)
    VALUES (p_listing_id, p_date);

    RETURN json_build_object(
        'success', true,
        'message', 'Unavailable date added successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to remove unavailable date
CREATE OR REPLACE FUNCTION remove_unavailable_date(
    p_listing_id UUID,
    p_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    DELETE FROM unavailable_dates 
    WHERE listing_id = p_listing_id AND date = p_date;

    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Unavailable date removed successfully'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Unavailable date not found'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to get unavailable dates for a listing
CREATE OR REPLACE FUNCTION get_unavailable_dates(
    p_listing_id UUID
)
RETURNS TABLE (
    id UUID,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ud.id, ud.date, ud.created_at
    FROM unavailable_dates ud
    WHERE ud.listing_id = p_listing_id
    ORDER BY ud.date ASC;
END;
$$;

-- Function to check availability for a date range
CREATE OR REPLACE FUNCTION check_availability(
    p_listing_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unavailable_dates DATE[];
    v_conflicting_bookings INTEGER;
    v_listing_status TEXT;
    v_is_available BOOLEAN := true;
    v_reason TEXT;
BEGIN
    -- Check if listing exists and is active
    SELECT status INTO v_listing_status
    FROM listings
    WHERE id = p_listing_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Listing not found'
        );
    END IF;

    IF v_listing_status != 'active' THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Listing is not active'
        );
    END IF;

    -- Get unavailable dates in the range
    SELECT ARRAY_AGG(date) INTO v_unavailable_dates
    FROM unavailable_dates
    WHERE listing_id = p_listing_id 
    AND date >= p_start_date 
    AND date <= p_end_date;

    -- Check for conflicting bookings
    SELECT COUNT(*) INTO v_conflicting_bookings
    FROM bookings
    WHERE listing_id = p_listing_id
    AND status IN ('confirmed', 'pending')
    AND (
        (start_date::date <= p_end_date AND end_date::date >= p_start_date)
    );

    -- Determine availability
    IF v_unavailable_dates IS NOT NULL AND array_length(v_unavailable_dates, 1) > 0 THEN
        v_is_available := false;
        v_reason := 'Dates are marked as unavailable';
    ELSIF v_conflicting_bookings > 0 THEN
        v_is_available := false;
        v_reason := 'Conflicting bookings exist';
    END IF;

    RETURN json_build_object(
        'available', v_is_available,
        'unavailable_dates', COALESCE(v_unavailable_dates, ARRAY[]::DATE[]),
        'conflicting_bookings', v_conflicting_bookings > 0,
        'reason', v_reason
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON unavailable_dates TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add comments for documentation
COMMENT ON TABLE unavailable_dates IS 'Dates when listings are not available for booking';
COMMENT ON FUNCTION check_availability IS 'Checks if a listing is available for a given date range';

-- Final message
SELECT 'Unavailable dates feature added successfully to existing Rentify database!' as message; 