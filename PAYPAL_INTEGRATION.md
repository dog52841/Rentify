# PayPal Commerce Platform Integration for Rentify

This document outlines the implementation of PayPal Commerce Platform as the payment processing solution for Rentify.

## Overview

The PayPal integration replaces the previous Stripe implementation and provides the following features:

- Two-step booking process (request → approval → payment)
- Platform fee collection (7% from renters, 3% from listers)
- Real-time payment notifications
- Seamless checkout experience with PayPal Smart Buttons

## Database Schema

The integration requires several database tables and fields:

1. **Profile Updates**
   - `paypal_merchant_id` - Stores the PayPal merchant ID for listing owners

2. **Booking Updates**
   - `payment_id` - Transaction ID from PayPal
   - `payment_provider` - Set to 'paypal'
   - `paypal_order_id` - PayPal order ID
   - `approval_status` - Can be 'pending', 'approved', or 'rejected'
   - `payment_amount` - Total payment amount
   - `platform_fee` - Fee collected by the platform
   - `owner_payout` - Amount paid to the listing owner

3. **PayPal Transactions Table**
   - Tracks all PayPal transactions with detailed information

## Setup Instructions

### 1. Database Setup

Run the database migration script to add the required tables and fields:

```bash
# From the project root
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f database/paypal_integration.sql
```

Or use the provided batch script:

```bash
# Windows
update_database_for_paypal.bat
```

### 2. Environment Variables

Add the following environment variables to your Supabase project:

```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PUBLIC_SITE_URL=https://your-site-url.com
```

For local development, add these to your `.env.local` file:

```
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### 3. Deploy Edge Functions

Deploy the PayPal Edge Functions to your Supabase project:

```bash
supabase functions deploy create-paypal-order
supabase functions deploy capture-paypal-order
```

## Payment Flow

1. **Booking Request**
   - Renter selects dates and submits a booking request
   - Request is stored in the database with `approval_status = 'pending'`
   - Owner receives a notification about the new request

2. **Owner Approval**
   - Owner reviews the request in their dashboard
   - Owner approves or rejects the request
   - If approved, the booking status is updated to `approval_status = 'approved'`
   - Renter receives a notification that their request was approved

3. **Payment**
   - Renter sees the PayPal payment button after approval
   - Clicking the button creates a PayPal order via the Edge Function
   - After successful payment, the booking status is updated to `status = 'confirmed'`
   - Both parties receive notifications about the completed booking

## Fee Structure

- **Renter Fee**: 7% added to the booking total
- **Lister Fee**: 3% deducted from the payout
- **Total Platform Fee**: 10% of the booking amount

## Components

- **PayPalCheckoutButton**: Renders the PayPal Smart Button and handles the payment flow
- **BookingRequestsPane**: Dashboard component for owners to manage booking requests
- **Edge Functions**: Handle PayPal API interactions securely

## API Routes

- **/api/bookings/find-by-order**: Finds a booking by PayPal order ID

## Testing

Use PayPal Sandbox accounts for testing:

1. Create a sandbox business account for listing owners
2. Create a sandbox personal account for renters
3. Use the sandbox credentials in your environment variables during development 