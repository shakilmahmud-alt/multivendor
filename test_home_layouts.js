import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Testing insert into home_layouts...");
  const newLayout = {
    section_type: 'flash_deals',
    is_active: true,
    priority: 0,
    settings: {}
  };

  const { data, error } = await supabase.from('home_layouts').insert([newLayout]).select().single();
  
  if (error) {
    console.error("Insert failed with error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Insert succeeded!", data);
  }
}

testInsert();
