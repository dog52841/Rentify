-- Unavailable Dates Table Setup
-- This script creates the unavailable_dates table and related functions

-- Create the unavailable_dates table
CREATE TABLE IF NOT EXISTS public.unavailable_dates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    unavailable_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(listing_id, unavailable_date)
);

-- Enable Row Level Security
ALTER TABLE public.unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view unavailable dates for any listing" ON public.unavailable_dates;
CREATE POLICY "Users can view unavailable dates for any listing" 
ON public.unavailable_dates 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage unavailable dates for their own listings" ON public.unavailable_dates;
CREATE POLICY "Users can manage unavailable dates for their own listings" 
ON public.unavailable_dates 
FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_listing_id ON public.unavailable_dates(listing_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_date ON public.unavailable_dates(unavailable_date);
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_listing_date ON public.unavailable_dates(listing_id, unavailable_date);

-- Create function to add unavailable dates
CREATE OR REPLACE FUNCTION public.add_unavailable_dates(
    p_listing_id uuid,
    p_dates text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_date text;
    v_user_id uuid;
BEGIN
    -- Get the current user
    v_user_id := auth.uid();
    
    -- Verify the listing belongs to the current user
    IF NOT EXISTS (
        SELECT 1 FROM public.listings 
        WHERE id = p_listing_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You can only manage your own listings';
    END IF;
    
    -- Insert each date
    FOREACH v_date IN ARRAY p_dates
    LOOP
        INSERT INTO public.unavailable_dates (listing_id, unavailable_date)
        VALUES (p_listing_id, v_date::date)
        ON CONFLICT (listing_id, unavailable_date) DO NOTHING;
    END LOOP;
END;
$$;

-- Create function to remove unavailable dates
CREATE OR REPLACE FUNCTION public.remove_unavailable_dates(
    p_listing_id uuid,
    p_dates text[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count integer;
    v_user_id uuid;
BEGIN
    -- Get the current user
    v_user_id := auth.uid();
    
    -- Verify the listing belongs to the current user
    IF NOT EXISTS (
        SELECT 1 FROM public.listings 
        WHERE id = p_listing_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: You can only manage your own listings';
    END IF;
    
    -- Delete the dates
    DELETE FROM public.unavailable_dates
    WHERE listing_id = p_listing_id 
    AND unavailable_date = ANY(SELECT unnest(p_dates)::date);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- Create function to get unavailable dates
CREATE OR REPLACE FUNCTION public.get_unavailable_dates(
    p_listing_id uuid
)
RETURNS TABLE(unavailable_date date)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT ud.unavailable_date
    FROM public.unavailable_dates ud
    WHERE ud.listing_id = p_listing_id
    ORDER BY ud.unavailable_date;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.unavailable_dates TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_unavailable_dates(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_unavailable_dates(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unavailable_dates(uuid) TO authenticated; 