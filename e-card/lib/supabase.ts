import { createClient } from '@supabase/supabase-js'
import { error } from 'console';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; 
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY; 

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)