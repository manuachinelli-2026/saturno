import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Browser-side singleton
let _client = null
export function createClient() {
  if (!_client) {
    _client = createSupabaseClient(url, anon)
  }
  return _client
}

// Convenience pre-initialized export for client components (lazy to avoid build-time errors)
export const supabase = {
  get from() { return createClient().from.bind(createClient()) },
  get auth() { return createClient().auth },
  get storage() { return createClient().storage },
  get functions() { return createClient().functions },
  get realtime() { return createClient().realtime },
  get rpc() { return createClient().rpc.bind(createClient()) },
  channel: (...args) => createClient().channel(...args),
  removeChannel: (...args) => createClient().removeChannel(...args),
  removeAllChannels: () => createClient().removeAllChannels(),
}

// Server-side client with service role (API routes only)
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}
