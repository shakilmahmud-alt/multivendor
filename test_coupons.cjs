require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = 'https://wfyelfyjeklkqflhlbxy.supabase.co';
const key = 'sb_publishable__nr_FdtzRa77Kj5VDcv3eg_yFVQ6mSk';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .or(`target_type.eq."All Shops"`);
  console.log(data, error);
}
run();
