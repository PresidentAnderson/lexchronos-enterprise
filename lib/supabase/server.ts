import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  // Skip in demo/static mode
  if (process.env.DEMO_MODE === 'true' || process.env.DISABLE_DATABASE === 'true') {
    return null
  }

  // Dynamic import to avoid build issues in static mode
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Admin client for server-side operations
export const supabaseAdmin = (() => {
  // Skip in demo/static mode
  if (process.env.DEMO_MODE === 'true' || process.env.DISABLE_DATABASE === 'true') {
    return null
  }

  try {
    const createServerClient = require('@supabase/ssr').createServerClient
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() {
            return undefined
          },
          set() {
            // No-op
          },
          remove() {
            // No-op
          },
        },
      }
    )
  } catch (error) {
    console.warn('Supabase SSR not available for admin client')
    return null
  }
})()