import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bzefcqcrwwwxggqjovnw.supabase.co'

const supabaseKey =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZWZjcWNyd3d3eGdncWpvdm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTA2MDQsImV4cCI6MjA5Mjk2NjYwNH0.nk0jOuc-0mbrpdwrz6xoeizM-L13lv8Te7J1hbyllgU'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)