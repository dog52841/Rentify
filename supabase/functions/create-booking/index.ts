import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { listing_id, start_date, end_date, total_amount, message } = await req.json()

    if (!listing_id || !start_date || !end_date || !total_amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('id, user_id, owner_id, title, price_per_day')
      .eq('id', listing_id)
      .eq('status', 'active')
      .single()

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: 'Listing not found or not available' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const ownerId = listing.owner_id || listing.user_id
    if (ownerId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot book your own listing' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for unavailable dates
    const { data: unavailableDates, error: unavailableError } = await supabaseClient
      .from('unavailable_dates')
      .select('unavailable_date')
      .eq('listing_id', listing_id)
      .gte('unavailable_date', start_date)
      .lte('unavailable_date', end_date)

    if (unavailableError) {
      return new Response(
        JSON.stringify({ error: unavailableError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (unavailableDates.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Selected dates are not available',
          unavailable_dates: unavailableDates.map(d => d.unavailable_date)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for existing bookings
    const { data: existingBookings, error: bookingsError } = await supabaseClient
      .from('bookings')
      .select('start_date, end_date, status')
      .eq('listing_id', listing_id)
      .in('status', ['confirmed', 'pending'])
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)

    if (bookingsError) {
      return new Response(
        JSON.stringify({ error: bookingsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (existingBookings.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Selected dates conflict with existing bookings',
          conflicting_bookings: existingBookings
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        listing_id,
        user_id: user.id,
        start_date,
        end_date,
        total_amount,
        message: message || '',
        status: 'pending'
      })
      .select()
      .single()

    if (bookingError) {
      return new Response(
        JSON.stringify({ error: bookingError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: booking }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 