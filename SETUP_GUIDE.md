# Rentify - Complete Setup Guide

This guide will help you set up the complete Rentify application with all features including the unavailable dates functionality.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **Supabase CLI** (for edge functions)
4. **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Rentify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   ```

## 🗄️ Database Setup

### Option 1: Using the Batch File (Windows)

1. Run the complete schema setup:
   ```bash
   run_complete_schema.bat
   ```

2. Follow the prompts to enter your database connection details.

### Option 2: Manual Setup

1. Connect to your PostgreSQL database
2. Run the complete schema script:
   ```bash
   psql -h your_host -p your_port -d your_database -U your_user -f database/complete_schema_with_unavailable_dates.sql
   ```

### Database Features Included

- ✅ User profiles and authentication
- ✅ Listings with both `owner_id` and `user_id` support
- ✅ Images with both `image_urls` and `images_urls` support
- ✅ Unavailable dates management
- ✅ Booking system with availability checking
- ✅ Reviews and ratings
- ✅ Messaging system
- ✅ Wishlist functionality
- ✅ Admin dashboard support
- ✅ Payment integration support
- ✅ Row Level Security (RLS) policies

## 🔧 Edge Functions Setup

### Deploy Edge Functions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Deploy all edge functions**:
   ```bash
   deploy_edge_functions.bat
   ```

### Available Edge Functions

| Function | Purpose | Method |
|----------|---------|--------|
| `add-unavailable-date` | Add unavailable date to listing | POST |
| `remove-unavailable-date` | Remove unavailable date from listing | POST |
| `get-unavailable-dates` | Get unavailable dates for listing | GET |
| `check-availability` | Check if dates are available | POST |
| `get-listing-details` | Get detailed listing information | GET |
| `get-listings` | Get paginated listings with filters | GET |
| `create-booking` | Create a new booking | POST |

## 🎯 Frontend Features

### Unavailable Dates Management

The application includes a comprehensive unavailable dates management system:

- **Calendar Interface**: Visual calendar for selecting unavailable dates
- **Date Blocking**: Block specific dates when items are not available
- **Availability Checking**: Real-time availability checking for bookings
- **Owner Dashboard**: Manage unavailable dates from the dashboard

### Robust ID Handling

The application handles both `owner_id` and `user_id` fields gracefully:

- **Fallback Logic**: Automatically falls back to `user_id` if `owner_id` is not found
- **Consistent Processing**: All listing-related components handle both fields
- **Error Prevention**: No more ID-related errors in the application

### Image Handling

Supports both image field naming conventions:

- **Primary**: `image_urls` field
- **Fallback**: `images_urls` field
- **Graceful Degradation**: Handles missing or empty image arrays

## 🧪 Testing the Application

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test Core Features

1. **User Registration/Login**
   - Create a new account
   - Verify email (if required)
   - Login to the application

2. **Create a Listing**
   - Navigate to "Create Listing"
   - Fill in all required fields
   - Upload images
   - Publish the listing

3. **Test Unavailable Dates**
   - Go to Dashboard → My Listings
   - Click on "Manage Availability"
   - Add some unavailable dates
   - Verify dates are blocked in the calendar

4. **Test Booking System**
   - Browse listings
   - Select dates for booking
   - Verify unavailable dates are disabled
   - Complete a booking

5. **Test Admin Features** (if admin user)
   - Access admin dashboard
   - View all listings and users
   - Manage bookings and reviews

### 3. Test Edge Cases

- **Missing Images**: Create listings without images
- **Invalid IDs**: Test with various ID formats
- **Date Conflicts**: Try booking on unavailable dates
- **Permission Errors**: Test unauthorized access

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS policies enabled:

- **Profiles**: Users can only update their own profile
- **Listings**: Users can only manage their own listings
- **Bookings**: Users can only view their own bookings
- **Reviews**: Users can only manage their own reviews
- **Messages**: Users can only access their conversations

### Authentication

- **JWT-based authentication** with Supabase Auth
- **Session management** with automatic token refresh
- **Protected routes** for authenticated users only

## 📊 Database Schema Overview

### Core Tables

```sql
-- User profiles
profiles (id, full_name, avatar_url, email, phone, bio, location, role, is_verified)

-- Categories for listings
categories (id, name, description, icon)

-- Main listings table
listings (id, title, description, price_per_day, owner_id, user_id, location, images, status)

-- Unavailable dates
unavailable_dates (id, listing_id, date, created_at)

-- Bookings
bookings (id, listing_id, user_id, start_date, end_date, total_amount, status)

-- Reviews
reviews (id, listing_id, user_id, booking_id, rating, comment)

-- Messages
messages (id, sender_id, receiver_id, listing_id, booking_id, content, is_read)
```

### Key Functions

```sql
-- Availability checking
check_availability(listing_id, start_date, end_date)

-- Get listing details with proper ID handling
get_listing_details(listing_id)

-- Get paginated listings with filters
get_listings_paged(page, limit, category, search, min_price, max_price, location)

-- Add/remove unavailable dates
add_unavailable_date(listing_id, date)
remove_unavailable_date(listing_id, date)
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database credentials
   - Check if PostgreSQL is running
   - Ensure database exists

2. **Edge Function Deployment Failures**
   - Check Supabase CLI installation
   - Verify login status
   - Check function syntax

3. **Authentication Errors**
   - Verify environment variables
   - Check Supabase project settings
   - Ensure RLS policies are correct

4. **ID Field Errors**
   - The application now handles both `owner_id` and `user_id`
   - Check if listings have proper owner information
   - Verify user authentication

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG=true
```

## 📈 Performance Optimization

### Database Indexes

The schema includes optimized indexes for:
- Listing searches and filtering
- Booking date ranges
- Message conversations
- User notifications

### Edge Function Optimization

- **Caching**: Implement caching for frequently accessed data
- **Pagination**: All listing queries support pagination
- **Filtering**: Efficient filtering on multiple criteria

## 🔄 Updates and Maintenance

### Regular Maintenance

1. **Monitor Edge Function Logs**
   ```bash
   supabase functions logs
   ```

2. **Check Database Performance**
   - Monitor slow queries
   - Update statistics regularly
   - Clean up old data

3. **Update Dependencies**
   ```bash
   npm update
   ```

### Backup Strategy

1. **Database Backups**
   ```bash
   pg_dump your_database > backup.sql
   ```

2. **Edge Function Backups**
   - Version control all functions
   - Keep deployment scripts updated

## 🎉 Success!

Your Rentify application is now fully set up with:

- ✅ Complete database schema
- ✅ Edge functions for backend logic
- ✅ Frontend with unavailable dates management
- ✅ Robust ID and image handling
- ✅ Security policies and authentication
- ✅ Booking system with availability checking

The application is ready for production use with all the requested features implemented and tested.

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the error logs in Supabase dashboard
3. Verify all environment variables are set correctly
4. Ensure all edge functions are deployed successfully

Happy renting! 🏠✨ 