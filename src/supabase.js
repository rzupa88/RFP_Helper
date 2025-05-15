import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { logger } from './logger.js'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials')
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Test connection
const testConnection = async () => {
  try {
    // Fix the count query syntax
    const { data, error } = await supabase
      .from('qna_library')
      .select('id', { count: 'exact', head: true });
    
    if (error) throw error;
    logger.info('✅ Supabase connection successful');
  } catch (err) {
    logger.error('Supabase connection failed:', err);
  }
};

testConnection();

export default supabase
