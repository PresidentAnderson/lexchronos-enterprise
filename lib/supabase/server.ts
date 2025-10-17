import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let cachedAdminClient: SupabaseClient | null = null

const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const createServerSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase environment variables are not configured')
    return null
  }

  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          console.error('Failed to set Supabase cookie', error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', maxAge: 0, ...options })
        } catch (error) {
          console.error('Failed to remove Supabase cookie', error)
        }
      },
    },
  })
}

export const getSupabaseAdminClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured() || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase admin client requested without proper configuration')
    return null
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return cachedAdminClient
}

export const supabaseAdmin = getSupabaseAdminClient()
