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

export const supabase = createClient(
  SUPABASE_URL || 'http://placeholder.invalid',
  SUPABASE_SERVICE_KEY || 'placeholder',
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export default supabase;
