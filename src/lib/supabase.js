import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'subariyantoss3@gmail.com';

export const supabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR_PROJECT'));

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
