--
-- User Reviews Table
-- This table stores reviews that users leave for each other after a completed booking.
--
CREATE TABLE IF NOT EXISTS public.user_reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewee_id uuid NOT NULL,
    rating numeric NOT NULL,
    comment text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT user_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT user_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT user_reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT user_reviews_rating_check CHECK ((rating >= 1 AND rating <= 5)),
    -- A user can only review another user once per booking
    CONSTRAINT user_reviews_unique_booking_reviewer UNIQUE (booking_id, reviewer_id)
);

-- Comments on the table and columns
COMMENT ON TABLE public.user_reviews IS 'Stores reviews written by users for other users after a rental transaction.';
COMMENT ON COLUMN public.user_reviews.booking_id IS 'The booking that this review is associated with.';
COMMENT ON COLUMN public.user_reviews.reviewer_id IS 'The user who is writing the review.';
COMMENT ON COLUMN public.user_reviews.reviewee_id IS 'The user who is being reviewed.';
COMMENT ON COLUMN public.user_reviews.rating IS 'The star rating given, from 1 to 5.';

-- Enable Row Level Security
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all reviews
CREATE POLICY "Public user reviews are viewable by everyone."
ON public.user_reviews FOR SELECT
USING (true);

-- Allow users to insert reviews only if they were part of the booking
-- and the booking is complete (end_date is in the past).
CREATE POLICY "Users can insert reviews for completed bookings they were part of."
ON public.user_reviews FOR INSERT
WITH CHECK (
    (reviewer_id = auth.uid())
    AND
    (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = booking_id
            AND (renter_id = auth.uid() OR owner_id = auth.uid())
            AND end_date < now()
        )
    )
);

-- Allow users to update their own reviews
CREATE POLICY "Users can update their own reviews."
ON public.user_reviews FOR UPDATE
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews."
ON public.user_reviews FOR DELETE
USING (auth.uid() = reviewer_id); 