// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmwmxzsjxkjzawnlmyrh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd214enNqeGtqemF3bmxteXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTg0NzMsImV4cCI6MjA2MjczNDQ3M30.muJvANRzqe1zvaNQ4iAIPFVLKJEU-Awt1vkas8TgXN0' // From Supabase Project → Settings → API

export const supabase = createClient(supabaseUrl, supabaseKey)
