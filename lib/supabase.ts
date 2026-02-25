import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ambzvfgwdbnaujvqfyny.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let supabaseInstance: SupabaseClient | null = null

export function getDb(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey
    if (!url || !key) {
      throw new Error('Supabase credentials not configured.')
    }
    supabaseInstance = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return supabaseInstance
}
