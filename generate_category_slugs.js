import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/&/g, '-')           // Replace & with -
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with -
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
};

async function backfillSlugs() {
  console.log('Starting slug backfill...');
  const usedSlugs = new Set();

  const getUniqueSlug = (baseName) => {
    let slug = generateSlug(baseName);
    if (!slug) slug = 'category';
    
    let originalSlug = slug;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);
    return slug;
  };

  try {
    // 1. Categories
    const { data: categories, error: cErr } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (cErr) throw cErr;
    
    for (const cat of categories) {
      const slug = getUniqueSlug(cat.name);
      console.log(`Updating category: ${cat.name} -> ${slug}`);
      const { error } = await supabase.from('categories').update({ slug }).eq('id', cat.id);
      if (error) throw error;
    }

    // 2. Sub-categories
    const { data: subCategories, error: sErr } = await supabase.from('sub_categories').select('*').order('created_at', { ascending: true });
    if (sErr) throw sErr;

    for (const sub of subCategories) {
      const slug = getUniqueSlug(sub.name);
      console.log(`Updating sub_category: ${sub.name} -> ${slug}`);
      const { error } = await supabase.from('sub_categories').update({ slug }).eq('id', sub.id);
      if (error) throw error;
    }

    // 3. Sub-sub-categories
    const { data: subSubCategories, error: ssErr } = await supabase.from('sub_sub_categories').select('*').order('created_at', { ascending: true });
    if (ssErr) throw ssErr;

    for (const subSub of subSubCategories) {
      const slug = getUniqueSlug(subSub.name);
      console.log(`Updating sub_sub_category: ${subSub.name} -> ${slug}`);
      const { error } = await supabase.from('sub_sub_categories').update({ slug }).eq('id', subSub.id);
      if (error) throw error;
    }

    console.log('Slug backfill completed successfully!');
  } catch (error) {
    console.error('Error during backfill:', error);
  }
}

backfillSlugs();
