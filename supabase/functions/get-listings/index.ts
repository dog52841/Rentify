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
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '12')
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')
    const minPrice = url.searchParams.get('min_price')
    const maxPrice = url.searchParams.get('max_price')
    const location = url.searchParams.get('location')
    const user_id = url.searchParams.get('user_id')

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseClient
      .from('listings')
      .select(`
        *,
        profiles!listings_user_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        categories(name)
      `)
      .eq('status', 'active')

    // Apply filters
    if (category) {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (minPrice) {
      query = query.gte('price_per_day', parseFloat(minPrice))
    }

    if (maxPrice) {
      query = query.lte('price_per_day', parseFloat(maxPrice))
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    if (user_id) {
      query = query.or(`user_id.eq.${user_id},owner_id.eq.${user_id}`)
    }

    // Get total count for pagination
    const { count, error: countError } = await query.count()

    if (countError) {
      return new Response(
        JSON.stringify({ error: countError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get listings with pagination
    const { data: listings, error: listingsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (listingsError) {
      return new Response(
        JSON.stringify({ error: listingsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process listings
    const processedListings = listings.map(listing => {
      const images = listing.image_urls || listing.images_urls || []
      return {
        ...listing,
        images,
        owner: listing.profiles
      }
    })

    const result = {
      listings: processedListings,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
        has_next: page < Math.ceil(count / limit),
        has_prev: page > 1
      }
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