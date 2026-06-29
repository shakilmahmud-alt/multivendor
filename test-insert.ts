import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([{ name: 'Test', email: 'test@test.com' }]);
  
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert success:', data);
  }
}

testInsert();
