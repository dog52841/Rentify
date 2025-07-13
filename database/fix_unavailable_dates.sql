-- Fix Unavailable Dates Table
-- Run this in your Supabase SQL Editor

-- Drop the existing table if it exists with wrong structure
DROP TABLE IF EXISTS public.unavailable_dates CASCADE;

-- Create the correct unavailable_dates table
CREATE TABLE public.unavailable_dates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
    unavailable_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(listing_id, unavailable_date)
);

-- Enable Row Level Security
ALTER TABLE public.unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view unavailable dates for any listing" 
ON public.unavailable_dates 
FOR SELECT USING (true);

CREATE POLICY "Users can manage unavailable dates for their own listings" 
ON public.unavailable_dates 
FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Create indexes for better performance
CREATE INDEX idx_unavailable_dates_listing_id ON public.unavailable_dates(listing_id);
CREATE INDEX idx_unavailable_dates_date ON public.unavailable_dates(unavailable_date);
CREATE INDEX idx_unavailable_dates_listing_date ON public.unavailable_dates(listing_id, unavailable_date);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.unavailable_dates TO authenticated; 