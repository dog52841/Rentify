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

    // Get the request body
    const { listing_id, dates } = await req.json()

    // Validate input
    if (!listing_id || !dates || !Array.isArray(dates)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: listing_id and dates array required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the listing exists and belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
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

    if (listing.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only manage your own listings' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if unavailable_dates table exists, if not create it
    const { error: tableCheckError } = await supabase
      .from('unavailable_dates')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      // Create the table if it doesn't exist
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.unavailable_dates (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
            date date NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            UNIQUE(listing_id, date)
          );
          
          ALTER TABLE public.unavailable_dates ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Users can manage unavailable dates for their own listings" 
          ON public.unavailable_dates 
          FOR ALL USING (
            auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
          );
        `
      })

      if (createTableError) {
        console.error('Error creating unavailable_dates table:', createTableError)
        return new Response(
          JSON.stringify({ error: 'Failed to set up unavailable dates table' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Insert the unavailable dates using the correct column name
    const unavailableDatesData = dates.map((date: string) => ({
      listing_id,
      unavailable_date: date
    }))

    const { error: insertError } = await supabase
      .from('unavailable_dates')
      .upsert(unavailableDatesData, { 
        onConflict: 'listing_id,unavailable_date',
        ignoreDuplicates: false 
      })

    if (insertError) {
      console.error('Error inserting unavailable dates:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to add unavailable dates' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Added ${dates.length} unavailable date(s)` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in add-unavailable-dates:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 