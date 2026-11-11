import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nnagiswnnzwcxyaxgbge.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uYWdpc3dubnp3Y3h5YXhnYmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNjMzMjksImV4cCI6MjEwOTkzOTMyOX0.Lz6OujoUM_eZ1p2soU65B-B1RKGj3nTUv97cPGWH1NA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
