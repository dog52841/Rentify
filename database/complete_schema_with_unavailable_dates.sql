-- Complete Rentify Database Schema with Unavailable Dates Feature
-- This script creates all necessary tables, functions, and triggers for the Rentify application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE listing_status AS ENUM ('active', 'inactive', 'pending', 'rejected');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'rejected');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    bio TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    stripe_account_id TEXT,
    paypal_email TEXT
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create listings table with both owner_id and user_id support
CREATE TABLE IF NOT EXISTS listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Alternative owner field
    location TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    image_urls TEXT[], -- Array of image URLs
    images_urls TEXT[], -- Alternative field name
    status listing_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    views_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    max_rental_days INTEGER,
    min_rental_days INTEGER DEFAULT 1,
    tags TEXT[],
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
    year_acquired INTEGER,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    insurance_info TEXT,
    maintenance_history TEXT,
    rental_instructions TEXT,
    pickup_instructions TEXT,
    return_instructions TEXT,
    cancellation_policy TEXT,
    late_return_policy TEXT,
    damage_policy TEXT
);

-- Create unavailable_dates table
CREATE TABLE IF NOT EXISTS unavailable_dates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(listing_id, date)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status booking_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_intent_id TEXT,
    paypal_order_id TEXT,
    pickup_time TIME,
    return_time TIME,
    actual_return_date DATE,
    late_fees DECIMAL(10,2) DEFAULT 0,
    damage_deposit DECIMAL(10,2) DEFAULT 0,
    damage_description TEXT,
    owner_notes TEXT,
    renter_notes TEXT,
    CHECK (end_date >= start_date)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID,
    related_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_intent_id TEXT,
    paypal_order_id TEXT,
    status payment_status DEFAULT 'pending',
    fee_amount DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_per_day);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_unavailable_dates_listing_id ON unavailable_dates(listing_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_date ON unavailable_dates(date);

CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing_id ON messages(listing_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create functions for unavailable dates management

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
    v_listing_status listing_status;
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
        (start_date <= p_end_date AND end_date >= p_start_date)
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

-- Function to get listing details with proper ID handling
CREATE OR REPLACE FUNCTION get_listing_details(
    p_listing_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_listing JSON;
    v_owner JSON;
    v_images TEXT[];
    v_unavailable_dates DATE[];
    v_reviews JSON;
    v_average_rating DECIMAL(3,2);
    v_review_count INTEGER;
BEGIN
    -- Get listing with owner information
    SELECT json_build_object(
        'id', l.id,
        'title', l.title,
        'description', l.description,
        'price_per_day', l.price_per_day,
        'category_id', l.category_id,
        'owner_id', COALESCE(l.owner_id, l.user_id),
        'location', l.location,
        'latitude', l.latitude,
        'longitude', l.longitude,
        'status', l.status,
        'created_at', l.created_at,
        'updated_at', l.updated_at,
        'views_count', l.views_count,
        'is_featured', l.is_featured,
        'deposit_amount', l.deposit_amount,
        'max_rental_days', l.max_rental_days,
        'min_rental_days', l.min_rental_days,
        'tags', l.tags,
        'condition_rating', l.condition_rating,
        'year_acquired', l.year_acquired,
        'brand', l.brand,
        'model', l.model,
        'serial_number', l.serial_number,
        'insurance_info', l.insurance_info,
        'maintenance_history', l.maintenance_history,
        'rental_instructions', l.rental_instructions,
        'pickup_instructions', l.pickup_instructions,
        'return_instructions', l.return_instructions,
        'cancellation_policy', l.cancellation_policy,
        'late_return_policy', l.late_return_policy,
        'damage_policy', l.damage_policy,
        'category', json_build_object(
            'id', c.id,
            'name', c.name
        )
    ) INTO v_listing
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    WHERE l.id = p_listing_id;

    IF v_listing IS NULL THEN
        RETURN json_build_object('error', 'Listing not found');
    END IF;

    -- Get owner information
    SELECT json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'email', p.email,
        'phone', p.phone,
        'created_at', p.created_at,
        'is_verified', p.is_verified
    ) INTO v_owner
    FROM profiles p
    WHERE p.id = (v_listing->>'owner_id')::UUID;

    -- Get images (handle both field names)
    SELECT COALESCE(l.image_urls, l.images_urls, ARRAY[]::TEXT[]) INTO v_images
    FROM listings l
    WHERE l.id = p_listing_id;

    -- Get unavailable dates
    SELECT ARRAY_AGG(date) INTO v_unavailable_dates
    FROM unavailable_dates
    WHERE listing_id = p_listing_id;

    -- Get reviews and calculate average rating
    SELECT 
        json_agg(
            json_build_object(
                'id', r.id,
                'rating', r.rating,
                'comment', r.comment,
                'created_at', r.created_at,
                'user', json_build_object(
                    'id', p.id,
                    'full_name', p.full_name,
                    'avatar_url', p.avatar_url
                )
            )
        ),
        AVG(r.rating),
        COUNT(*)
    INTO v_reviews, v_average_rating, v_review_count
    FROM reviews r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.listing_id = p_listing_id;

    RETURN json_build_object(
        'listing', v_listing,
        'owner', v_owner,
        'images', COALESCE(v_images, ARRAY[]::TEXT[]),
        'unavailable_dates', COALESCE(v_unavailable_dates, ARRAY[]::DATE[]),
        'reviews', COALESCE(v_reviews, '[]'::json),
        'average_rating', COALESCE(v_average_rating, 0),
        'review_count', COALESCE(v_review_count, 0)
    );
END;
$$;

-- Function to get listings with pagination and filtering
CREATE OR REPLACE FUNCTION get_listings_paged(
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 12,
    p_category_id UUID DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset INTEGER;
    v_listings JSON;
    v_total_count INTEGER;
    v_total_pages INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Build dynamic query for filtering
    -- This is a simplified version - in production you'd want more sophisticated filtering
    SELECT 
        json_agg(
            json_build_object(
                'id', l.id,
                'title', l.title,
                'description', l.description,
                'price_per_day', l.price_per_day,
                'location', l.location,
                'status', l.status,
                'created_at', l.created_at,
                'views_count', l.views_count,
                'is_featured', l.is_featured,
                'images', COALESCE(l.image_urls, l.images_urls, ARRAY[]::TEXT[]),
                'owner', json_build_object(
                    'id', p.id,
                    'full_name', p.full_name,
                    'avatar_url', p.avatar_url
                ),
                'category', json_build_object(
                    'id', c.id,
                    'name', c.name
                )
            )
        ),
        COUNT(*) OVER()
    INTO v_listings, v_total_count
    FROM listings l
    LEFT JOIN profiles p ON p.id = COALESCE(l.owner_id, l.user_id)
    LEFT JOIN categories c ON l.category_id = c.id
    WHERE l.status = 'active'
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_search IS NULL OR (l.title ILIKE '%' || p_search || '%' OR l.description ILIKE '%' || p_search || '%'))
    AND (p_min_price IS NULL OR l.price_per_day >= p_min_price)
    AND (p_max_price IS NULL OR l.price_per_day <= p_max_price)
    AND (p_location IS NULL OR l.location ILIKE '%' || p_location || '%')
    ORDER BY 
        CASE WHEN p_sort_by = 'price_per_day' AND p_sort_order = 'asc' THEN l.price_per_day END ASC,
        CASE WHEN p_sort_by = 'price_per_day' AND p_sort_order = 'desc' THEN l.price_per_day END DESC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN l.created_at END ASC,
        CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN l.created_at END DESC,
        CASE WHEN p_sort_by = 'views_count' AND p_sort_order = 'asc' THEN l.views_count END ASC,
        CASE WHEN p_sort_by = 'views_count' AND p_sort_order = 'desc' THEN l.views_count END DESC
    LIMIT p_limit OFFSET v_offset;

    v_total_pages := CEIL(v_total_count::DECIMAL / p_limit);

    RETURN json_build_object(
        'listings', COALESCE(v_listings, '[]'::json),
        'pagination', json_build_object(
            'page', p_page,
            'limit', p_limit,
            'total', v_total_count,
            'total_pages', v_total_pages,
            'has_next', p_page < v_total_pages,
            'has_prev', p_page > 1
        )
    );
END;
$$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to increment views count
CREATE OR REPLACE FUNCTION increment_views_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE listings 
    SET views_count = views_count + 1 
    WHERE id = NEW.listing_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can view own listings" ON listings FOR SELECT USING (auth.uid() = COALESCE(owner_id, user_id));
CREATE POLICY "Users can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = COALESCE(owner_id, user_id));
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = COALESCE(owner_id, user_id));
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (auth.uid() = COALESCE(owner_id, user_id));

-- Unavailable dates policies
CREATE POLICY "Anyone can view unavailable dates" ON unavailable_dates FOR SELECT USING (true);
CREATE POLICY "Listing owners can manage unavailable dates" ON unavailable_dates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM listings 
        WHERE id = unavailable_dates.listing_id 
        AND (owner_id = auth.uid() OR user_id = auth.uid())
    )
);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Listing owners can view bookings for their listings" ON bookings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM listings 
        WHERE id = bookings.listing_id 
        AND (owner_id = auth.uid() OR user_id = auth.uid())
    )
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Wishlist policies
CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
('Electronics', 'Smartphones, laptops, cameras, and other electronic devices', '📱'),
('Tools & Equipment', 'Power tools, hand tools, and construction equipment', '🔧'),
('Sports & Recreation', 'Bicycles, camping gear, sports equipment', '🚴'),
('Party & Events', 'Tables, chairs, decorations, and event equipment', '🎉'),
('Transportation', 'Cars, bikes, scooters, and other vehicles', '🚗'),
('Home & Garden', 'Furniture, appliances, and gardening tools', '🏠'),
('Fashion & Accessories', 'Clothing, jewelry, and fashion accessories', '👗'),
('Books & Media', 'Books, DVDs, and other media items', '📚'),
('Musical Instruments', 'Guitars, pianos, drums, and other instruments', '🎸'),
('Photography', 'Cameras, lenses, lighting, and photography equipment', '📷')
ON CONFLICT (name) DO NOTHING;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_listings_price_range ON listings(price_per_day) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON bookings(start_date, end_date) WHERE status IN ('confirmed', 'pending');
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Add comments for documentation
COMMENT ON TABLE listings IS 'Main table for rental listings with support for both owner_id and user_id fields';
COMMENT ON TABLE unavailable_dates IS 'Dates when listings are not available for booking';
COMMENT ON TABLE bookings IS 'Rental bookings with availability checking';
COMMENT ON FUNCTION check_availability IS 'Checks if a listing is available for a given date range';
COMMENT ON FUNCTION get_listing_details IS 'Gets complete listing details with proper ID handling';
COMMENT ON FUNCTION get_listings_paged IS 'Gets paginated listings with filtering and sorting';

-- Final message
SELECT 'Rentify database schema created successfully with unavailable dates feature!' as message; 