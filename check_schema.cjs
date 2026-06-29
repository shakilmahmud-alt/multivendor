const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check() {
  const content = fs.readFileSync('src/supabaseClient.ts', 'utf8');
  const urlMatch = content.match(/createClient\(['"`](.*?)['"`]/);
  const keyMatch = content.match(/,\s*['"`](.*?)['"`]\)/);
  if (!urlMatch || !keyMatch) return;
  const url = urlMatch[1];
  const key = keyMatch[1];

  const res = await fetch(url + '/rest/v1/orders?limit=1', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const data = await res.json();
  console.log('Error?', data.message || data.error);
  console.log('Columns:', data[0] ? Object.keys(data[0]) : (data.length === 0 ? 'No rows, trying to fetch schema...' : data));
}
check();
