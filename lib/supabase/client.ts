import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const createMockClient = () => ({
  auth: {
    signUp: async () => ({ data: null, error: { message: 'Supabase auth unavailable in static mode' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase auth unavailable in static mode' } }),
    signOut: async () => ({ data: null, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: async () => ({ error: { message: 'Supabase auth unavailable in static mode' } }),
    updateUser: async () => ({ data: null, error: { message: 'Supabase auth unavailable in static mode' } }),
    signInWithOAuth: async () => ({ error: { message: 'Supabase auth unavailable in static mode' } }),
    refreshSession: async () => ({ data: { session: null }, error: null }),
  },
})

const buildBrowserClient = (): SupabaseClient => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase browser client requested without configuration')
    return createMockClient() as unknown as SupabaseClient
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

let cachedBrowserClient: SupabaseClient | null = null

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (typeof window === 'undefined') {
    return createMockClient() as unknown as SupabaseClient
  }

  if (!cachedBrowserClient) {
    cachedBrowserClient = buildBrowserClient()
  }

  return cachedBrowserClient
}

export const supabase = getSupabaseBrowserClient()
