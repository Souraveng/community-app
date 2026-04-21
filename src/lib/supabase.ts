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


// Robust, infinitely chainable mock client for "Demo Mode"
// This allows the UI to function perfectly even without environment variables.
const createMockClient = () => {
  const chainable = (target: any = {}): any => {
    return new Proxy(target, {
      get(target, prop) {
        // 1. Handle specialized objects
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: { user: { id: 'demo-user', email: 'curator@gallery.demo' } } }, error: null }),
            getUser: async () => ({ data: { user: { id: 'demo-user', email: 'curator@gallery.demo' } }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: async () => ({ data: { user: { id: 'demo-user' }, session: {} }, error: null }),
            signOut: async () => ({ error: null }),
          };
        }

        if (prop === 'storage') {
          return {
            from: () => ({
              // Simulate successful upload and return the path
              upload: async (path: string, file: File) => ({ data: { path }, error: null }),
              getPublicUrl: (path: string) => ({ 
                // Return a temporary blob URL for the "uploaded" file so it shows in the UI
                data: { publicUrl: path.startsWith('blob:') ? path : 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000' } 
              }),
            }),
          };
        }

        // 2. Standard Promise method (e.g., .then(), .select(), .from())
        if (prop === 'then') {
          return (resolve: any) => resolve({ data: [], error: null });
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
