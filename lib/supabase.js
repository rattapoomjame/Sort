import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rnvkgdhgldxotqwszrtx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_pbOks5f6GA8VEpjRjacl0w_2GGYgfBh'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
