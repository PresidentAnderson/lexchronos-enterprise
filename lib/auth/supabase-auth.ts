import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export type AuthError = {
  message: string
  status?: number
}

export type AuthResult<T = any> = {
  data: T | null
  error: AuthError | null
}

export class SupabaseAuth {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<AuthResult<User>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data.user, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during sign up' } 
      }
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResult<User>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data.user, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during sign in' } 
      }
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: null, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during sign out' } 
      }
    }
  }

  /**
   * Get the current user
   */
  static async getCurrentUser(): Promise<AuthResult<User>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: user, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred getting user' } 
      }
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: null, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during password reset' } 
      }
    }
  }

  /**
   * Update password
   */
  static async updatePassword(password: string): Promise<AuthResult<User>> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data.user, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred updating password' } 
      }
    }
  }

  /**
   * Sign in with OAuth provider
   */
  static async signInWithOAuth(provider: 'google' | 'github' | 'microsoft'): Promise<AuthResult<void>> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: null, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred during OAuth sign in' } 
      }
    }
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  }

  /**
   * Get the current session
   */
  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    return session
  }

  /**
   * Refresh the current session
   */
  static async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Error refreshing session:', error)
      return null
    }
    
    return data.session
  }
}