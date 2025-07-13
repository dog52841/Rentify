import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the listing_id from query parameters
    const url = new URL(req.url)
    const listing_id = url.searchParams.get('listing_id')

    // Validate input
    if (!listing_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: listing_id required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id')
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

    // Get the unavailable dates using the correct column name
    const { data: unavailableDates, error: fetchError } = await supabase
      .from('unavailable_dates')
      .select('unavailable_date')
      .eq('listing_id', listing_id)
      .order('unavailable_date', { ascending: true })

    if (fetchError) {
      // If table doesn't exist, return empty array
      if (fetchError.code === '42P01') { // Table doesn't exist
        return new Response(
          JSON.stringify({ dates: [] }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      console.error('Error fetching unavailable dates:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch unavailable dates' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract just the date strings
    const dates = unavailableDates?.map(ud => ud.unavailable_date) || []

    return new Response(
      JSON.stringify({ dates }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-unavailable-dates:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 