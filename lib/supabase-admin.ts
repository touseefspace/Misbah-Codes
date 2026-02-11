import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey) {
    console.error('❌ CRITICAL: Supabase Service Role Key is missing from environment variables.');
}

export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
