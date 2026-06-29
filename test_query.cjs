const { createClient } = require('@supabase/supabase-js');

const url = 'https://wfyelfyjeklkqflhlbxy.supabase.co';
const key = 'sb_publishable__nr_FdtzRa77Kj5VDcv3eg_yFVQ6mSk';

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('orders').select('*, customers(first_name, last_name), sellers(shop_name)').order('created_at', { ascending: false });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data count:', data.length);
    console.log('First row:', JSON.stringify(data[0], null, 2));
  }
}

test();
