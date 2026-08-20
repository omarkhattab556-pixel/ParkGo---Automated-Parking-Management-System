import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_KEY missing — DB calls will fail until .env is filled in.'
  );
}

/**
 * Shared server-only Supabase client.
 *
 * `SUPABASE_SERVICE_KEY` is privileged and may bypass Row Level Security, so it
 * must never be shipped to the browser; authorization remains the API layer's
 * responsibility. Token refresh and session persistence are disabled because
 * this process performs backend database operations rather than user sessions.
 * Placeholder credentials let the process boot without configuration, but all
 * real database calls will fail until both environment variables are supplied.
 */
export const supabase = createClient(
  SUPABASE_URL || 'http://placeholder.invalid',
  SUPABASE_SERVICE_KEY || 'placeholder',
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export default supabase;
