import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get request body
    const { orderId } = await req.json();
    
    // Validate inputs
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
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
    
    // Capture the PayPal order
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    const captureData = await captureResponse.json();
    
    if (!captureResponse.ok) {
      console.error('Error capturing PayPal order:', captureData);
      return new Response(
        JSON.stringify({ error: 'Failed to capture PayPal order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Get the transaction ID from the capture response
    const transactionId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
    
    // Get payer information
    const payerId = captureData.payer?.payer_id;
    const payerEmail = captureData.payer?.email_address;
    
    // Find the booking associated with this order
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, listings(user_id, title)')
      .eq('paypal_order_id', orderId)
      .single();
    
    if (bookingError || !booking) {
      console.error('Error finding booking for PayPal order:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found for this order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Update the booking status
    const { error: updateError } = await supabaseClient
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_id: transactionId,
        payment_provider: 'paypal'
      })
      .eq('id', booking.id);
    
    if (updateError) {
      console.error('Error updating booking status:', updateError);
    }
    
    // Update the transaction record
    const { error: transactionError } = await supabaseClient
      .from('paypal_transactions')
      .update({
        status: 'COMPLETED',
        transaction_id: transactionId,
        payer_id: payerId,
        payer_email: payerEmail,
        capture_data: captureData
      })
      .eq('order_id', orderId);
    
    if (transactionError) {
      console.error('Error updating transaction record:', transactionError);
    }
    
    // Send notification to the listing owner
    if (booking.listings) {
      await supabaseClient.from('notifications').insert({
        user_id: booking.listings.user_id,
        type: 'booking_paid',
        title: 'New Booking Payment',
        content: `You have received a payment for your listing "${booking.listings.title}"`,
        action_link: '/dashboard/bookings',
        related_id: booking.id
      });
    }
    
    // Send confirmation notification to the renter
    await supabaseClient.from('notifications').insert({
      user_id: booking.renter_id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      content: 'Your payment was successful and your booking is now confirmed.',
      action_link: `/booking/${booking.id}`,
      related_id: booking.id
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionId,
        status: captureData.status 
      }),
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