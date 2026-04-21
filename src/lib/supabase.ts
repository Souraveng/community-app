import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug logging for client-side (visible in Browser Console)
if (typeof window !== 'undefined') {
  console.log('Supabase Init Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'none'
  });
}

const hasKeys = supabaseUrl && supabaseAnonKey;


// Robust, infinitely chainable mock client using Proxies
// This prevents "TypeError: x is not a function" crashes when environment variables are missing
const createMockClient = () => {
  const chainable = (target: any = {}): any => {
    return new Proxy(target, {
      get(target, prop) {
        // 1. If it's a standard Promise method, return a resolved promise with mock data
        if (prop === 'then') {
          return (resolve: any) => resolve({ data: [], error: null });
        }
        
        // 2. Handle specialized objects
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: async () => ({ data: {}, error: new Error('Supabase not configured') }),
            signOut: async () => ({ error: null }),
          };
        }

        if (prop === 'storage') {
          return {
            from: () => ({
              upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
              getPublicUrl: () => ({ data: { publicUrl: '' } }),
            }),
          };
        }

        // 3. For everything else (from, select, eq, order, etc.), return the chainable proxy again
        return (...args: any[]) => chainable();
      }
    });
  };

  return chainable();
};

export const supabase = hasKeys 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createMockClient() as any);
