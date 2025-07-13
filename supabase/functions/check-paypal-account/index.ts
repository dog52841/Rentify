// @ts-ignore
import { serve } from "std/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

// @ts-ignore - Deno.env will be available in production
const paypalClientId = (typeof Deno !== 'undefined' ? Deno.env.get('PAYPAL_CLIENT_ID') : '') || '';
// @ts-ignore - Deno.env will be available in production
const paypalClientSecret = (typeof Deno !== 'undefined' ? Deno.env.get('PAYPAL_CLIENT_SECRET') : '') || '';

// Generate PayPal access token
async function getPayPalAccessToken() {
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${data.error_description}`);
  }

  return data.access_token;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing user ID');
    }

    const supabase = createSupabaseClient(req);
    
    // Get user from auth header
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if the user is requesting their own account status or is an admin
    const { data: isAdmin } = await supabase.rpc('check_if_admin');
    if (user.id !== userId && !isAdmin) {
      throw new Error('Unauthorized');
    }

    // Get the user's PayPal status from the database
    const { data: accountStatus, error: accountError } = await supabase.rpc('check_paypal_account', {
      p_user_id: userId
    });

    if (accountError) {
      throw new Error(`Failed to get PayPal account status: ${accountError.message}`);
    }

    return new Response(
      JSON.stringify(accountStatus),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 