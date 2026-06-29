import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Fetching data for SEO generation (enforcing length rules)...");

  const [catsRes, subCatsRes, brandsRes, productsRes] = await Promise.all([
    supabase.from('categories').select('id, name'),
    supabase.from('sub_categories').select('id, name'),
    supabase.from('brands').select('id, name'),
    supabase.from('in_house_products').select('*')
  ]);

  if (productsRes.error) {
    console.error("Error fetching products:", productsRes.error);
    return;
  }

  const products = productsRes.data || [];
  const categories = catsRes.data || [];
  const subCategories = subCatsRes.data || [];
  const brands = brandsRes.data || [];

  console.log(`Found ${products.length} products to update.`);

  for (const p of products) {
    // Title (30-65 chars)
    let metaTitle = '';
    if (p.name_en) {
      metaTitle = `${p.name_en} | HolidayMart`;
      if (metaTitle.length < 30) {
        metaTitle += " - Buy Authentic Products Online in BD at Best Price";
      }
      if (metaTitle.length > 65) {
        metaTitle = metaTitle.substring(0, 65);
      }
    }

    // Description (120-320 chars)
    const sourceDesc = p.short_desc_en || p.desc_en || '';
    let cleanDesc = sourceDesc.replace(/<[^>]*>?/gm, '').trim();
    if (p.name_en && cleanDesc.length < 120) {
      cleanDesc += ` Buy the best quality ${p.name_en} from HolidayMart at the most reasonable price in Bangladesh. We offer fast and reliable home delivery. Order now to get the best deals on top products!`;
    }
    if (cleanDesc.length > 320) {
      cleanDesc = cleanDesc.substring(0, 317) + '...';
    }
    const metaDescription = cleanDesc;

    // Keywords
    let metaKeyword = '';
    if (p.name_en) {
      const nameWords = p.name_en.split(' ').filter(w => w.length > 2).join(', ');
      const cat = categories.find(c => c.id === p.category_id)?.name || '';
      const subCat = subCategories.find(c => c.id === p.sub_category_id)?.name || '';
      const brand = brands.find(b => b.id === p.brand_id)?.name || '';
      metaKeyword = [p.name_en, cat, subCat, brand, nameWords].filter(k => k).join(', ');
    }

    console.log(`Updating SEO for product: ${p.name_en}`);
    const { error } = await supabase.from('in_house_products').update({
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keyword: metaKeyword
    }).eq('id', p.id);

    if (error) {
      console.error(`Failed to update ${p.name_en}:`, error);
    }
  }

  console.log("Finished updating all existing products!");
}

main();
