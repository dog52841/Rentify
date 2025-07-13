-- PayPal Integration Schema Updates
-- This script adds the necessary database changes to support PayPal Commerce Platform integration

-- Add PayPal merchant ID to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paypal_merchant_id TEXT;

-- Add payment tracking fields to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_provider TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS platform_fee NUMERIC;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS owner_payout NUMERIC;

-- Create PayPal transactions table to track all PayPal transactions
CREATE TABLE IF NOT EXISTS public.paypal_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  booking_id uuid REFERENCES public.bookings(id),
  order_id TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  fee_amount NUMERIC,
  payer_email TEXT,
  payer_id TEXT,
  merchant_id TEXT,
  capture_data JSONB,
  refund_data JSONB
);

-- Add RLS policies for PayPal transactions
ALTER TABLE public.paypal_transactions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own transactions
CREATE POLICY "Users can view their own transactions" 
ON public.paypal_transactions FOR SELECT 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT b.renter_id FROM public.bookings b WHERE b.id = booking_id
    UNION
    SELECT l.user_id FROM public.bookings b JOIN public.listings l ON b.listing_id = l.id WHERE b.id = booking_id
  )
);

-- Policy to allow admins to view all transactions
CREATE POLICY "Admins can view all transactions" 
ON public.paypal_transactions FOR SELECT 
TO authenticated 
USING (public.check_if_admin());

-- Function to find booking by PayPal order ID
CREATE OR REPLACE FUNCTION public.find_booking_by_paypal_order(
  p_order_id TEXT
)
RETURNS SETOF public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT b.*
  FROM public.bookings b
  WHERE b.paypal_order_id = p_order_id;
END;
$$;

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.find_booking_by_paypal_order(TEXT) TO authenticated, service_role; 