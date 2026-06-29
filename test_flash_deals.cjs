const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('flash_deal_products').insert([{
    flash_deal_id: 'some_deal_id',
    product_id: 'some_product_id',
    seller_id: 'some_seller_id',
    status: 'approved'
  }]);
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
