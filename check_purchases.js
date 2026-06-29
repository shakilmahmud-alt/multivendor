import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfyelfyjeklkqflhlbxy.supabase.co';
const supabaseKey = 'sb_publishable__nr_FdtzRa77Kj5VDcv3eg_yFVQ6mSk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPurchases() {
  const { data, error } = await supabase.from('purchases').select('*').limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify(data[0], null, 2));
}

checkPurchases();
