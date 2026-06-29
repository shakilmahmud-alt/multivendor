const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function check() {
  try {
    const content = fs.readFileSync('src/supabaseClient.ts', 'utf8');
    const urlMatch = content.match(/createClient\(['"`](.*?)['"`]/);
    const keyMatch = content.match(/,\s*['"`](.*?)['"`]\)/);
    if (!urlMatch || !keyMatch) {
      fs.writeFileSync('schema_output.txt', 'Could not find credentials');
      return;
    }
    const url = urlMatch[1];
    const key = keyMatch[1];

    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    
    if (error) {
      fs.writeFileSync('schema_output.txt', 'Error: ' + JSON.stringify(error));
    } else {
      const cols = data.length > 0 ? Object.keys(data[0]) : 'No data in table to infer columns';
      fs.writeFileSync('schema_output.txt', 'Columns: ' + JSON.stringify(cols) + '\nData: ' + JSON.stringify(data));
    }
  } catch (err) {
    fs.writeFileSync('schema_output.txt', 'Exception: ' + err.message);
  }
}
check();
