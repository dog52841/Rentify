import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

// Fee configuration
const FEE_CONFIG = {
  RENTER_FEE_PERCENTAGE: 0.07, // 7% fee charged to renters
  LISTER_FEE_PERCENTAGE: 0.03, // 3% fee charged to listers
  TOTAL_FEE_PERCENTAGE: 0.10, // Total platform fee (7% + 3%)
};

interface RequestBody {
  amount: number; // Amount in dollars
  listingId: string;
  startDate: string;
  endDate: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { amount, listingId, startDate, endDate } = await req.json() as RequestBody;
    
    // Validate inputs
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'Listing ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Get user ID from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('*, user_id, profiles:user_id(paypal_merchant_id)')
      .eq('id', listingId)
      .single();
    
    if (listingError || !listing) {
      console.error('Error fetching listing:', listingError);
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Check if the listing owner has a PayPal merchant ID
    const paypalMerchantId = listing.profiles?.paypal_merchant_id;
    
    if (!paypalMerchantId) {
      return new Response(
        JSON.stringify({ error: 'Listing owner does not have a PayPal account set up' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Get PayPal API credentials from environment variables
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.error('Missing PayPal API credentials');
      return new Response(
        JSON.stringify({ error: 'Payment configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get access token from PayPal
    const tokenResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Error getting PayPal access token:', tokenData);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with PayPal' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Calculate fees
    const subtotal = amount;
    const platformFee = subtotal * FEE_CONFIG.TOTAL_FEE_PERCENTAGE;
    const listerAmount = subtotal - (subtotal * FEE_CONFIG.LISTER_FEE_PERCENTAGE);
    
    // Find the booking that was approved
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('listing_id', listingId)
      .eq('renter_id', user.id)
      .eq('approval_status', 'approved')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (bookingError || !booking) {
      console.error('Error finding approved booking:', bookingError);
      return new Response(
        JSON.stringify({ error: 'No approved booking found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Create PayPal order
    const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: booking.id,
            description: `Booking for ${listing.title} from ${startDate} to ${endDate}`,
            amount: {
              currency_code: 'USD',
              value: subtotal.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: subtotal.toFixed(2),
                },
              },
            },
            items: [
              {
                name: listing.title,
                description: `Booking from ${startDate} to ${endDate}`,
                quantity: '1',
                unit_amount: {
                  currency_code: 'USD',
                  value: subtotal.toFixed(2),
                },
              },
            ],
            payee: {
              merchant_id: paypalMerchantId,
            },
            payment_instruction: {
              disbursement_mode: 'INSTANT',
              platform_fees: [
                {
                  amount: {
                    currency_code: 'USD',
                    value: platformFee.toFixed(2),
                  },
                },
              ],
            },
          },
        ],
        application_context: {
          return_url: `${Deno.env.get('PUBLIC_SITE_URL')}/payment-success`,
          cancel_url: `${Deno.env.get('PUBLIC_SITE_URL')}/payment-cancel`,
        },
      }),
    });
    
    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok) {
      console.error('Error creating PayPal order:', orderData);
      return new Response(
        JSON.stringify({ error: 'Failed to create PayPal order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Update booking with PayPal order ID
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        paypal_order_id: orderData.id,
        payment_amount: subtotal,
        platform_fee: platformFee,
        owner_payout: listerAmount
      })
      .eq('id', booking.id);
    
    if (updateError) {
      console.error('Error updating booking with PayPal order ID:', updateError);
    }
    
    // Store transaction information
    const { error: transactionError } = await supabaseClient
      .from('paypal_transactions')
      .insert({
        booking_id: booking.id,
        order_id: orderData.id,
        status: 'CREATED',
        amount: subtotal,
        fee_amount: platformFee,
        merchant_id: paypalMerchantId
      });
    
    if (transactionError) {
      console.error('Error storing transaction in database:', transactionError);
    }
    
    return new Response(
      JSON.stringify({ orderId: orderData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 