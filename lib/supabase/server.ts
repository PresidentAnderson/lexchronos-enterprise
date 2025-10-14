// Server-side Supabase client - safe for static builds
// Always returns null during static builds to prevent Edge Runtime issues

export const createServerSupabaseClient = () => {
  // Always return null during static builds, demo mode, or production
  if (process.env.NODE_ENV === 'production' || process.env.DEMO_MODE === 'true' || process.env.DISABLE_DATABASE === 'true') {
    return null
  }

  // Only create client in development mode
  try {
    const { cookies } = require('next/headers')
    const createServerClient = require('@supabase/ssr').createServerClient
    const cookieStore = cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Ignore cookie errors
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Ignore cookie errors
            }
          },
        },
      }
    )
  } catch (error) {
    return null
  }
}

// Admin client - always null during static builds
export const supabaseAdmin = null