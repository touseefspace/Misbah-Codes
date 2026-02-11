import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Standard Supabase client for use in both Client and Server Components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
