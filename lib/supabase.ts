import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ambzvfgwdbnaujvqfyny.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let supabaseInstance: SupabaseClient | null = null

export function getDb(): SupabaseClient {
  if (!supabaseInstance) {
    const key = supabaseServiceKey || supabaseAnonKey
    if (!supabaseUrl || !key) {
      throw new Error('Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.')
    }
    supabaseInstance = createClient(supabaseUrl, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return supabaseInstance
}
