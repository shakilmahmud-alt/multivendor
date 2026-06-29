require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data: customerData } = await supabase.from('customers').select('id').limit(1).single();
  const { data: orderData } = await supabase.from('orders').select('id').limit(1).single();
  
  if (customerData && orderData) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);
    
    const { data, error } = await supabase.from('loyalty_points').insert([{
      customer_id: customerData.id,
      order_id: orderData.id,
      points_earned: 10,
      remaining_points: 10,
      expires_at: expiresAt.toISOString()
    }]);
    
    if (error) console.error("Insert Error:", error);
    else console.log("Insert Success:", data);
  } else {
    console.log("No customer or order found");
  }
}

testInsert();
