// Supabase client — used for the global (shared) scoreboard.
//
// Credentials come from Vite env vars, which you set in game/.env
// (see .env.example). They are PUBLIC by design: the anon key is safe to ship in
// a browser app as long as Row Level Security (RLS) is enabled on the table and
// its policies only allow the operations you intend (here: read all, insert new).
//
// If the env vars are missing (e.g. a fresh checkout with no .env), `supabase`
// is null and the scoreboard automatically falls back to per-device localStorage,
// so the game still runs.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null

// Handy for showing "global vs local" wording in the UI.
export const isGlobal = Boolean(supabase)
