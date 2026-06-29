import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const CPANEL_UPLOAD_URL = process.env.VITE_CPANEL_UPLOAD_URL;
const CPANEL_SECRET_TOKEN = process.env.VITE_CPANEL_SECRET_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase credentials are required in .env');
  process.exit(1);
}

if (!CPANEL_UPLOAD_URL || !CPANEL_SECRET_TOKEN) {
  console.error('Error: cPanel upload credentials are required in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const migrationTargets = [
  { table: 'in_house_products', type: 'products', primaryKey: 'id', columns: { thumbnail_url: 'text', additional_images: 'array', meta_image: 'text' } },
  { table: 'brands', type: 'categories', primaryKey: 'id', columns: { logo_url: 'text' } },
  { table: 'banners', type: 'products', primaryKey: 'id', columns: { image_url: 'text' } },
  { table: 'categories', type: 'categories', primaryKey: 'id', columns: { image_url: 'text' } },
  { table: 'sub_categories', type: 'categories', primaryKey: 'id', columns: { image_url: 'text' } },
  { table: 'sub_sub_categories', type: 'categories', primaryKey: 'id', columns: { image_url: 'text' } },
  { table: 'sellers', type: 'vendors', primaryKey: 'id', columns: { seller_image_url: 'text', shop_logo_url: 'text', shop_banner_url: 'text' } },
  { table: 'customers', type: 'vendors', primaryKey: 'id', columns: { image_url: 'text' } },
  { table: 'support_tickets', type: 'products', primaryKey: 'id', columns: { attachments: 'array' } }
];

const LOG_FILE = path.join(process.cwd(), 'migration_log.json');

function appendLog(logEntry) {
  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch (e) {
      logs = [];
    }
  }
  logs.push({ timestamp: new Date().toISOString(), ...logEntry });
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

// Helper to check if string is an ImageKit URL
function isImageKitUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('imagekit.io');
}

async function migrateUrl(url, folderType, dryRun) {
  if (!isImageKitUrl(url)) {
    return url;
  }

  console.log(`[Migrating] Downloading: ${url}`);
  if (dryRun) {
    console.log(`[Dry-Run] Would migrate ${url} to cPanel folder: ${folderType}`);
    return `https://media.mydomain.com/uploads/${folderType}/dry_run_placeholder.webp`;
  }

  try {
    // Step 1: Download from ImageKit
    const downloadRes = await fetch(url);
    if (!downloadRes.ok) {
      throw new Error(`Failed to download image from ImageKit. Status: ${downloadRes.status}`);
    }
    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get MIME type and filename
    const contentType = downloadRes.headers.get('content-type') || 'image/jpeg';
    const originalFilename = url.split('/').pop() || 'image.jpg';

    // Step 2: Upload to cPanel
    const formData = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    formData.append('file', blob, originalFilename);
    formData.append('type', folderType);

    const uploadRes = await fetch(CPANEL_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'X-Storage-Token': CPANEL_SECRET_TOKEN
      },
      body: formData
    });

    if (!uploadRes.ok) {
      const errorMsg = await uploadRes.text();
      throw new Error(`Failed to upload to cPanel. Status: ${uploadRes.status}, Error: ${errorMsg}`);
    }

    const uploadData = await uploadRes.json();
    if (uploadData.status !== 'success' || !uploadData.url) {
      throw new Error(`cPanel upload response error: ${uploadData.message || 'Unknown error'}`);
    }

    const newUrl = uploadData.url;
    console.log(`[Migrated] Uploaded: ${newUrl}`);

    // Step 3 & 4: Verify uploaded image returns HTTP 200 and renders correctly
    console.log(`[Verifying] Checking: ${newUrl}`);
    const verifyRes = await fetch(newUrl, { method: 'GET' });
    if (!verifyRes.ok) {
      throw new Error(`Verification failed. New URL returned status: ${verifyRes.status}`);
    }
    console.log(`[Verified] URL is valid: ${newUrl}`);

    appendLog({ status: 'success', originalUrl: url, newUrl, folderType });
    return newUrl;
  } catch (error) {
    console.error(`[Error] Failed to migrate ${url}: ${error.message}`);
    appendLog({ status: 'failure', originalUrl: url, error: error.message, folderType });
    // Keep old URL on failure
    return url;
  }
}

async function runMigration() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetTable = args.find(a => a.startsWith('--table='))?.split('=')[1];
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');

  console.log(`=== Starting Image Migration ===`);
  console.log(`Dry Run: ${dryRun}`);
  console.log(`Batch Limit: ${limit}`);
  if (targetTable) console.log(`Targeting Table: ${targetTable}`);
  console.log(`================================\n`);

  for (const target of migrationTargets) {
    if (targetTable && target.table !== targetTable) {
      continue;
    }

    console.log(`Processing table: ${target.table}...`);
    let page = 0;
    let hasMore = true;
    let migratedCount = 0;
    let failedCount = 0;
    let totalProcessed = 0;

    while (hasMore) {
      const from = page * limit;
      const to = from + limit - 1;

      // Fetch batch of rows
      const { data: rows, error } = await supabase
        .from(target.table)
        .select('*')
        .range(from, to);

      if (error) {
        console.error(`Error fetching rows from ${target.table}:`, error.message);
        break;
      }

      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Fetched ${rows.length} rows (range ${from} to ${to}) from ${target.table}`);

      for (const row of rows) {
        let rowUpdated = false;
        const updatedColumns = {};

        for (const [colName, colType] of Object.entries(target.columns)) {
          const val = row[colName];

          if (colType === 'text') {
            if (isImageKitUrl(val)) {
              const newUrl = await migrateUrl(val, target.type, dryRun);
              if (newUrl !== val) {
                updatedColumns[colName] = newUrl;
                rowUpdated = true;
                migratedCount++;
              } else {
                failedCount++;
              }
            }
          } else if (colType === 'array' && Array.isArray(val)) {
            const newArray = [];
            let arrayChanged = false;
            for (const item of val) {
              if (isImageKitUrl(item)) {
                const newUrl = await migrateUrl(item, target.type, dryRun);
                if (newUrl !== item) {
                  newArray.push(newUrl);
                  arrayChanged = true;
                  migratedCount++;
                } else {
                  newArray.push(item);
                  failedCount++;
                }
              } else {
                newArray.push(item);
              }
            }
            if (arrayChanged) {
              updatedColumns[colName] = newArray;
              rowUpdated = true;
            }
          }
        }

        if (rowUpdated && !dryRun) {
          console.log(`[Database] Updating ${target.table} row ${target.primaryKey} = ${row[target.primaryKey]}`);
          const { error: updateError } = await supabase
            .from(target.table)
            .update(updatedColumns)
            .eq(target.primaryKey, row[target.primaryKey]);

          if (updateError) {
            console.error(`[Database Error] Failed to update row in ${target.table}:`, updateError.message);
          } else {
            console.log(`[Database] Successfully updated row.`);
          }
        }
      }

      totalProcessed += rows.length;
      if (rows.length < limit) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`Finished table ${target.table}. Total Processed: ${totalProcessed}, Migrated: ${migratedCount}, Failed: ${failedCount}\n`);
  }

  console.log(`=== Migration Job Finished ===`);
}

runMigration().catch(err => {
  console.error('Unhandled migration error:', err);
});
