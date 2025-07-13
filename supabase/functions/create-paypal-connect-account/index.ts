// @ts-ignore
import { serve } from "std/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

// @ts-ignore - Deno.env will be available in production
const paypalClientId = (typeof Deno !== 'undefined' ? Deno.env.get('PAYPAL_CLIENT_ID') : '') || '';
// @ts-ignore - Deno.env will be available in production
const paypalClientSecret = (typeof Deno !== 'undefined' ? Deno.env.get('PAYPAL_CLIENT_SECRET') : '') || '';
// @ts-ignore - Deno.env will be available in production
const siteUrl = (typeof Deno !== 'undefined' ? Deno.env.get('SITE_URL') : '') || '';

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
    const supabase = createSupabaseClient(req);
    
    // Get user from auth header
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal partner referral
    const referralResponse = await fetch('https://api-m.sandbox.paypal.com/v2/customer/partner-referrals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tracking_id: user.id,
        partner_config_override: {
          return_url: `${siteUrl}/dashboard/settings?paypal_onboarding=success`,
          action_renewal_url: `${siteUrl}/dashboard/settings?paypal_onboarding=renew`,
        },
        operations: [
          {
            operation: "API_INTEGRATION",
            api_integration_preference: {
              rest_api_integration: {
                integration_method: "PAYPAL",
                integration_type: "THIRD_PARTY",
                third_party_details: {
                  features: ["PAYMENT", "REFUND", "PARTNER_FEE"]
                }
              }
            }
          }
        ],
        legal_consents: [
          {
            type: "SHARE_DATA_CONSENT",
            granted: true
          }
        ],
        products: ["EXPRESS_CHECKOUT"]
      }),
    });

    const referralData = await referralResponse.json();
    
    if (!referralResponse.ok) {
      console.error('PayPal referral error:', referralData);
      throw new Error(`Failed to create PayPal referral: ${referralData.message || 'Unknown error'}`);
    }

    // Find the action URL for onboarding
    const actionUrl = referralData.links.find((link: any) => link.rel === 'action_url')?.href;
    if (!actionUrl) {
      throw new Error('No action URL found in PayPal response');
    }

    // Store the tracking ID in the database
    await supabase.from('paypal_onboarding').insert({
      user_id: user.id,
      tracking_id: user.id,
      status: 'CREATED',
      links: referralData.links
    });

    return new Response(
      JSON.stringify({ url: actionUrl }),
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