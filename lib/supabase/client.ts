// Supabase clients - safe for static builds
// Using dynamic imports to prevent Edge Runtime issues during build

let supabase: any = null
let supabaseAdmin: any = null

// Create mock clients for static builds
const createMockClient = () => ({
  auth: {
    signUp: async () => ({ data: null, error: { message: 'Auth not available in static mode' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Auth not available in static mode' } }),
    signOut: async () => ({ data: null, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: async () => ({ error: { message: 'Auth not available in static mode' } }),
    updateUser: async () => ({ data: null, error: { message: 'Auth not available in static mode' } }),
    signInWithOAuth: async () => ({ error: { message: 'Auth not available in static mode' } }),
    refreshSession: async () => ({ data: { session: null }, error: null }),
  }
})

// Only initialize Supabase in browser environment or when explicitly enabled
if (typeof window !== 'undefined' && process.env.DEMO_MODE !== 'true') {
  // Browser-side client
  import('@supabase/supabase-js').then(({ createClient }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key'
    
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }).catch(() => {
    supabase = createMockClient()
  })
} else {
  // Static build or demo mode - use mock client
  supabase = createMockClient()
}

// Server-side admin client - only for non-static builds
if (process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE !== 'true') {
  import('@supabase/supabase-js').then(({ createClient }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
    
    supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }).catch(() => {
    supabaseAdmin = createMockClient()
  })
} else {
  supabaseAdmin = createMockClient()
}

export { supabase, supabaseAdmin }