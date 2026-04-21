import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Build-time resilience: Ensure we don't crash the build if keys are missing
// Next.js attempts to evaluate all imports during static generation.
const isServer = typeof window === 'undefined';
const hasKeys = supabaseUrl && supabaseAnonKey;

if (!hasKeys && !isServer) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// We only initialize the client if we have keys. 
// If missing during build (server-side), we export a placeholder to prevent "supabaseUrl is required" error.
export const supabase = hasKeys 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);
