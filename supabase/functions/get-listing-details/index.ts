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

    const url = new URL(req.url)
    const listing_id = url.searchParams.get('listing_id')

    if (!listing_id) {
      return new Response(
        JSON.stringify({ error: 'Missing listing_id parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get listing details with owner information
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select(`
        *,
        profiles!listings_user_id_fkey(
          id,
          full_name,
          avatar_url,
          email,
          phone,
          created_at
        )
      `)
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get unavailable dates
    const { data: unavailableDates, error: unavailableError } = await supabaseClient
      .from('unavailable_dates')
      .select('unavailable_date')
      .eq('listing_id', listing_id)
      .order('unavailable_date')

    if (unavailableError) {
      return new Response(
        JSON.stringify({ error: unavailableError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get reviews
    const { data: reviews, error: reviewsError } = await supabaseClient
      .from('reviews')
      .select(`
        *,
        profiles!reviews_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('listing_id', listing_id)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      return new Response(
        JSON.stringify({ error: reviewsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process images - handle both image_urls and images_urls fields
    const images = listing.image_urls || listing.images_urls || []
    
    // Calculate average rating
    const averageRating = reviews && reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0

    const result = {
      ...listing,
      images,
      unavailable_dates: unavailableDates.map(d => d.unavailable_date),
      reviews,
      average_rating: Math.round(averageRating * 10) / 10,
      review_count: reviews.length
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        status: 200, 
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