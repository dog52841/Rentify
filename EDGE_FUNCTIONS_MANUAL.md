# Edge Functions Manual - Complete Implementation

This manual contains all the edge functions needed for the unavailable dates feature. Copy and paste each function into your Supabase project.

## 🚀 Quick Deploy

1. **Create each function folder** in `supabase/functions/`
2. **Copy the code** for each function
3. **Deploy** using the batch file or manually

## 📁 Function 1: add-unavailable-dates

**Path:** `supabase/functions/add-unavailable-dates/index.ts`

```typescript
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

    const { listing_id, dates } = await req.json()

    if (!listing_id || !dates || !Array.isArray(dates)) {
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

    // Verify user owns the listing
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('id, user_id, owner_id')
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

    const ownerId = listing.owner_id || listing.user_id
    if (ownerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to modify this listing' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert unavailable dates
    const unavailableDates = dates.map((date: string) => ({
      listing_id,
      unavailable_date: date
    }))

    const { data, error } = await supabaseClient
      .from('unavailable_dates')
      .insert(unavailableDates)
      .select()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
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
```

## 📁 Function 2: remove-unavailable-dates

**Path:** `supabase/functions/remove-unavailable-dates/index.ts`

```typescript
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

    const { listing_id, dates } = await req.json()

    if (!listing_id || !dates || !Array.isArray(dates)) {
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

    // Verify user owns the listing
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('id, user_id, owner_id')
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

    const ownerId = listing.owner_id || listing.user_id
    if (ownerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized to modify this listing' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Remove unavailable dates
    const { data, error } = await supabaseClient
      .from('unavailable_dates')
      .delete()
      .eq('listing_id', listing_id)
      .in('unavailable_date', dates)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
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
```

## 📁 Function 3: get-unavailable-dates

**Path:** `supabase/functions/get-unavailable-dates/index.ts`

```typescript
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

    // Get unavailable dates for the listing
    const { data, error } = await supabaseClient
      .from('unavailable_dates')
      .select('unavailable_date')
      .eq('listing_id', listing_id)
      .order('unavailable_date')

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const dates = data.map(item => item.unavailable_date)

    return new Response(
      JSON.stringify({ success: true, dates }),
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
```

## 📁 Function 4: check-availability

**Path:** `supabase/functions/check-availability/index.ts`

```typescript
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

    const { listing_id, start_date, end_date } = await req.json()

    if (!listing_id || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if listing exists and is active
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('id, status')
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

    // Check for unavailable dates in the range
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

    // Check for existing bookings in the range
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

    const isAvailable = unavailableDates.length === 0 && existingBookings.length === 0
    const conflicts = {
      unavailableDates: unavailableDates.map(d => d.unavailable_date),
      existingBookings: existingBookings.map(b => ({
        start_date: b.start_date,
        end_date: b.end_date,
        status: b.status
      }))
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        available: isAvailable,
        conflicts
      }),
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
```

## 📁 Function 5: get-listing-details

**Path:** `supabase/functions/get-listing-details/index.ts`

```typescript
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
```

## 📁 Function 6: get-listings

**Path:** `supabase/functions/get-listings/index.ts`

```typescript
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
```

## 📁 Function 7: create-booking

**Path:** `supabase/functions/create-booking/index.ts`

```typescript
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
```

## 🚀 Deployment Instructions

### Step 1: Create Function Folders
Create these folders in your `supabase/functions/` directory:
- `add-unavailable-dates/`
- `remove-unavailable-dates/`
- `get-unavailable-dates/`
- `check-availability/`
- `get-listing-details/`
- `get-listings/`
- `create-booking/`

### Step 2: Add Function Files
In each folder, create an `index.ts` file and paste the corresponding code above.

### Step 3: Deploy Functions
Run the deployment script:
```bash
deploy_edge_functions.bat
```

Or deploy manually:
```bash
supabase functions deploy add-unavailable-dates
supabase functions deploy remove-unavailable-dates
supabase functions deploy get-unavailable-dates
supabase functions deploy check-availability
supabase functions deploy get-listing-details
supabase functions deploy get-listings
supabase functions deploy create-booking
```

## 🔧 Environment Variables

Make sure these environment variables are set in your Supabase project:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 📱 Frontend Integration

The frontend is already updated with:
- ✅ `UnavailableDatesPane` component
- ✅ Updated `DashboardPage` with unavailable dates tab
- ✅ All listing pages with proper ID handling
- ✅ Real data integration (no sample data)

## 🎯 Testing

Test each function with these endpoints:
- `POST /functions/v1/add-unavailable-dates`
- `POST /functions/v1/remove-unavailable-dates`
- `GET /functions/v1/get-unavailable-dates`
- `POST /functions/v1/check-availability`
- `GET /functions/v1/get-listing-details`
- `GET /functions/v1/get-listings`
- `POST /functions/v1/create-booking`

## 🎉 Success!

Your unavailable dates feature is now fully implemented and ready to use! 🚀 