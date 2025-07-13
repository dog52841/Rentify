// supabase/functions/_shared/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

// For TypeScript in the editor - these will be available at runtime in Deno
declare global {
  interface Deno {
    env: {
      get(key: string): string | undefined;
    };
  }
}

export const createSupabaseClient = (req: Request) => {
    // Create a Supabase client with the user's auth token
    // @ts-ignore - Deno.env will be available in production
    const supabaseUrl = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') : '') || '';
    // @ts-ignore - Deno.env will be available in production
    const supabaseKey = (typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_ANON_KEY') : '') || '';
    
    return createClient(
        supabaseUrl,
        supabaseKey,
        {
            global: { headers: { Authorization: req.headers.get('Authorization')! } },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );
}; 
