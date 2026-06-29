import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Box, Settings, DollarSign, List, UploadCloud, Video, Globe, Save, Plus, X } from 'lucide-react';
import { useToast } from '../ToastContext';
import { uploadToCpanel } from '../../utils/mediaUpload';
import { getColorStyle } from '../../utils/color';
import JoditEditor from 'jodit-react';

export default function AddInHouseProduct() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const returnUrl = searchParams.get('returnUrl');
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'en' | 'bd'>('en');
  const [loading, setLoading] = useState(false);
  
  // Basic Info
  const [nameEn, setNameEn] = useState('');
  const [descEn, setDescEn] = useState('');
  const [shortDescEn, setShortDescEn] = useState('');
  
  // General Setup
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subSubCategoryId, setSubSubCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [productType, setProductType] = useState('Physical');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('pc');
  const [searchTags, setSearchTags] = useState('');

  // Pricing
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [unitPrice, setUnitPrice] = useState('0');
  const [minOrderQty, setMinOrderQty] = useState('1');
  const [stockQty, setStockQty] = useState('0');
  const [discountType, setDiscountType] = useState('Flat');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [taxAmount, setTaxAmount] = useState('0');
  const [taxCalculation, setTaxCalculation] = useState('Include with product');
  const [shippingCost, setShippingCost] = useState('0');
  const [shippingMultiply, setShippingMultiply] = useState(false);

  // Variation
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string[]>>({});
  const [attributeInput, setAttributeInput] = useState<Record<string, string>>({});
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);

  // Media
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [additionalImageUrl, setAdditionalImageUrl] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeyword, setMetaKeyword] = useState('');
  const [metaImageUrl, setMetaImageUrl] = useState('');
  const [uploadingState, setUploadingState] = useState<{ thumb?: boolean, add?: boolean, meta?: boolean }>({});

  // Dependency Data
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [subCategoriesList, setSubCategoriesList] = useState<any[]>([]);
  const [subSubCategoriesList, setSubSubCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);

  // Brand Creation
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  // Db Attributes
  const [dbAttributesList, setDbAttributesList] = useState<any[]>([]);

  useEffect(() => {
    fetchDependencies();
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (hasVariations) {
       const keys = Object.keys(attributeValues).filter(k => attributeValues[k].length > 0);
       if (keys.length === 0) { setVariations([]); return; }
       
       let combos = attributeValues[keys[0]].map(v => ({ [keys[0]]: v }));
       for (let i = 1; i < keys.length; i++) {
         const key = keys[i];
         const values = attributeValues[key];
         const newCombos: any[] = [];
         for (const combo of combos) {
           for (const val of values) {
             newCombos.push({ ...combo, [key]: val });
           }
         }
         combos = newCombos;
       }
       
       const newVars = combos.map(combo => {
          const comboName = Object.values(combo).join('-');
          const existing = variations.find(v => v.name === comboName);
          return existing || { name: comboName, attributes: combo, price: parseFloat(unitPrice) || 0, stock: 0, sku: `${sku}-${comboName}` };
       });
       setVariations(newVars);
    }
  }, [attributeValues, hasVariations, unitPrice, sku]);

  const fetchDependencies = async () => {
    try {
      const [catRes, subRes, subSubRes, brandRes, attrRes] = await Promise.all([
        supabase.from('categories').select('*').order('priority'),
        supabase.from('sub_categories').select('*').order('priority'),
        supabase.from('sub_sub_categories').select('*').order('priority'),
        supabase.from('brands').select('*'),
        supabase.from('product_attributes').select('*').order('created_at', { ascending: true })
      ]);

      if (catRes.data) setCategoriesList(catRes.data);
      if (subRes.data) setSubCategoriesList(subRes.data);
      if (subSubRes.data) setSubSubCategoriesList(subSubRes.data);
      if (brandRes.data) setBrandsList(brandRes.data);
      if (attrRes.data) setDbAttributesList(attrRes.data);
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    }
  };

  const filteredSubCategories = useMemo(() => {
    if (!categoryId) return [];
    return subCategoriesList.filter(s => s.category_id === categoryId);
  }, [categoryId, subCategoriesList]);

  const filteredSubSubCategories = useMemo(() => {
    if (!subCategoryId) return [];
    return subSubCategoriesList.filter(ss => ss.sub_category_id === subCategoryId);
  }, [subCategoryId, subSubCategoriesList]);

  // Auto-generate SEO
  useEffect(() => {
    // Title (30-65 chars)
    if (nameEn) {
      let baseTitle = `${nameEn} | HolidayMart`;
      if (baseTitle.length < 30) {
        const extra = " - Buy Authentic Products Online in BD at Best Price";
        baseTitle += extra;
      }
      if (baseTitle.length > 65) {
        baseTitle = baseTitle.substring(0, 65);
      }
      setMetaTitle(baseTitle);
    } else {
      setMetaTitle('');
    }

    // Description (120-320 chars)
    const sourceDesc = shortDescEn || descEn || '';
    let cleanDesc = sourceDesc.replace(/<[^>]*>?/gm, '').trim();
    if (nameEn && cleanDesc.length < 120) {
      const padText = ` Buy the best quality ${nameEn} from HolidayMart at the most reasonable price in Bangladesh. We offer fast and reliable home delivery. Order now to get the best deals on top products!`;
      cleanDesc += padText;
    }
    if (cleanDesc.length > 320) {
      cleanDesc = cleanDesc.substring(0, 317) + '...';
    }
    setMetaDescription(cleanDesc);

    // Keywords (Name + Brand + Categories)
    if (nameEn) {
      const nameWords = nameEn.split(' ').filter(w => w.length > 2).join(', ');
      const cat = categoriesList.find(c => c.id === categoryId)?.name || '';
      const subCat = subCategoriesList.find(c => c.id === subCategoryId)?.name || '';
      const brand = brandsList.find(b => b.id === brandId)?.name || '';
      const keywords = [nameEn, cat, subCat, brand, nameWords].filter(k => k).join(', ');
      setMetaKeyword(keywords);
    } else {
      setMetaKeyword('');
    }
  }, [nameEn, shortDescEn, descEn, categoryId, subCategoryId, brandId, categoriesList, subCategoriesList, brandsList]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
    setSubCategoryId('');
    setSubSubCategoryId('');
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubCategoryId(e.target.value);
    setSubSubCategoryId('');
  };

  const [originalProduct, setOriginalProduct] = useState<any>(null);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('in_house_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setOriginalProduct(data);
        setNameEn(data.name_en || '');
        setDescEn(data.desc_en || '');
        setShortDescEn(data.short_desc_en || '');
        setCategoryId(data.category_id || '');
        setSubCategoryId(data.sub_category_id || '');
        setSubSubCategoryId(data.sub_sub_category_id || '');
        setBrandId(data.brand_id || '');
        setProductType(data.product_type || 'Physical');
        setSku(data.sku || '');
        setUnit(data.unit || 'pc');
        setSearchTags(data.search_tags || '');
        setPurchasePrice(data.purchase_price?.toString() || '0');
        setUnitPrice(data.unit_price?.toString() || '0');
        setMinOrderQty(data.minimum_order_qty?.toString() || '1');
        setStockQty(data.current_stock_qty?.toString() || '0');
        setDiscountType(data.discount_type || 'Flat');
        setDiscountAmount(data.discount_amount?.toString() || '0');
        setTaxAmount(data.tax_amount?.toString() || '0');
        setTaxCalculation(data.tax_calculation || 'Include with product');
        setShippingCost(data.shipping_cost?.toString() || '0');
        setShippingMultiply(data.shipping_multiply || false);
        if (data.attributes) {
          const attrs = data.attributes;
          if (attrs.selected_attributes) setSelectedAttributes(attrs.selected_attributes);
          if (attrs.attribute_values) setAttributeValues(attrs.attribute_values);
          if (attrs.has_variations) setHasVariations(attrs.has_variations);
          if (attrs.variations) setVariations(attrs.variations);
        }
        setThumbnailUrl(data.thumbnail_url || '');
        setAdditionalImageUrl(data.additional_images?.[0] || '');
        setVideoLink(data.video_link || '');
        setMetaTitle(data.meta_title || '');
        setMetaDescription(data.meta_description || '');
        setMetaKeyword(data.meta_keyword || '');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch product details', 'error');
    }
  };

  const generateSku = () => {
    setSku(Math.floor(100000 + Math.random() * 900000).toString());
  };

  // Convert name to slug
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!nameEn) {
      showToast('Product Name is required', 'error');
      return;
    }

    setLoading(true);
    const slug = slugify(nameEn) + (isEditMode ? '' : `-${Math.floor(Math.random()*1000)}`);

    const changes: string[] = [];
    if (isEditMode && originalProduct) {
      if (originalProduct.name_en !== nameEn) changes.push(`Name changed to: ${nameEn}`);
      if (originalProduct.unit_price?.toString() !== parseFloat(unitPrice).toString()) changes.push(`Price changed to: ৳${unitPrice}`);
      if (originalProduct.current_stock_qty?.toString() !== parseInt(stockQty).toString()) changes.push(`Stock updated to: ${stockQty}`);
      if (originalProduct.discount_amount?.toString() !== parseFloat(discountAmount).toString()) changes.push(`Discount updated to: ${discountAmount}`);
      if (originalProduct.category_id !== categoryId || originalProduct.sub_category_id !== subCategoryId) changes.push(`Category/Sub-category was updated`);
      if (originalProduct.thumbnail_url !== thumbnailUrl) changes.push(`Main product image was updated`);
      if (originalProduct.short_desc_en !== shortDescEn) changes.push(`Short description was updated`);
      if (changes.length === 0) changes.push(`Minor details were updated`);
    }

    const payload = {
      name_en: nameEn,
      desc_en: descEn,
      short_desc_en: shortDescEn,
      product_type: productType,
      sku: sku,
      unit: unit,
      search_tags: searchTags,
      purchase_price: parseFloat(purchasePrice) || 0,
      unit_price: parseFloat(unitPrice) || 0,
      minimum_order_qty: parseInt(minOrderQty) || 1,
      current_stock_qty: parseInt(stockQty) || 0,
      discount_type: discountType,
      discount_amount: parseFloat(discountAmount) || 0,
      tax_amount: parseFloat(taxAmount) || 0,
      tax_calculation: taxCalculation,
      shipping_cost: parseFloat(shippingCost) || 0,
      shipping_multiply: shippingMultiply,
      thumbnail_url: thumbnailUrl,
      additional_images: additionalImageUrl ? [additionalImageUrl] : [],
      video_link: videoLink,
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keyword: metaKeyword,
      category_id: categoryId || null,
      sub_category_id: subCategoryId || null,
      sub_sub_category_id: subSubCategoryId || null,
      brand_id: brandId || null,
      attributes: user?.role === 'seller' ? { 
        ...(originalProduct?.attributes || {}),
        seller_id: user.id, 
        shop_name: user.shop_name, 
        request_status: isEditMode ? (originalProduct?.attributes?.request_status === 'denied' ? 'new-requests' : 'update-requests') : 'new-requests',
        changes: isEditMode ? changes : [],
        selected_attributes: selectedAttributes,
        attribute_values: attributeValues,
        has_variations: hasVariations,
        variations: variations
      } : { 
        added_by_admin: true,
        selected_attributes: selectedAttributes,
        attribute_values: attributeValues,
        has_variations: hasVariations,
        variations: variations
      },
    };

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('in_house_products')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        showToast('Product updated successfully!');
        
        if (user?.role === 'seller') {
          await supabase.from('notifications').insert([{
            target_role: 'admin',
            title: 'Product Update Request',
            message: `Seller "${user.shop_name}" updated the product "${nameEn}".`,
            link: `/admin/seller-products/update-requests`
          }]);
        }
      } else {
        const isActive = user?.role !== 'seller';
        const { error } = await supabase
          .from('in_house_products')
          .insert([{ ...payload, slug, is_active: isActive, is_featured: false }]);
        if (error) throw error;
        showToast(user?.role === 'seller' ? 'Product submitted for approval!' : 'Product added successfully!');
        
        if (user?.role === 'seller') {
          await supabase.from('notifications').insert([{
            target_role: 'admin',
            title: 'New Product Request',
            message: `Seller "${user.shop_name}" submitted a new product "${nameEn}".`,
            link: `/admin/seller-products/new-requests`
          }]);
        }
      }
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate(user?.role === 'seller' ? '/seller/products/list' : '/admin/in-house-products/list');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (isEditMode) fetchProduct();
    else {
      setNameEn(''); setDescEn(''); setShortDescEn(''); setSku(''); setThumbnailUrl('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumb' | 'add' | 'meta') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'thumb' || type === 'add') {
        if (file.size > 200 * 1024) {
          showToast('Image size must be less than 200KB', 'error');
          return;
        }
        
        const validDimension = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (img.width !== 800 || img.height !== 800) {
              resolve(false);
            } else {
              resolve(true);
            }
          };
          img.onerror = () => resolve(false);
          img.src = URL.createObjectURL(file);
        });

        if (!validDimension) {
          showToast('Image dimensions must be exactly 800x800 pixels', 'error');
          return;
        }
      }

      setUploadingState(prev => ({ ...prev, [type]: true }));
      try {
        const url = await uploadToCpanel(file, 'products');
        if (type === 'thumb') setThumbnailUrl(url);
        if (type === 'add') setAdditionalImageUrl(url);
        showToast('Image uploaded successfully!');
      } catch (err) {
        showToast('Failed to upload image', 'error');
      } finally {
        setUploadingState(prev => ({ ...prev, [type]: false }));
      }
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    setIsAddingBrand(true);
    try {
      const { data, error } = await supabase.from('brands').insert([{
        name: newBrandName.trim()
      }]).select('*').single();
      
      if (error) throw error;
      
      setBrandsList(prev => [...prev, data]);
      setBrandId(data.id);
      showToast('Brand added successfully!');
      setShowBrandModal(false);
      setNewBrandName('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add brand', 'error');
    } finally {
      setIsAddingBrand(false);
    }
  };

  // Rich Text Editor Component
  const Editor = ({ value, onChange }: any) => {
    return (
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
        <JoditEditor
          value={value}
          config={{
            height: 300,
            allowResizeY: true
          }}
          onChange={newContent => onChange(newContent)}
        />
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Box className="w-5 h-5 text-orange-500" />
        <h1 className="text-lg font-bold text-slate-800">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-600 mb-2">Product Name</label>
              <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Description</label>
              <Editor value={descEn} onChange={setDescEn} />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Short Description</label>
              <Editor value={shortDescEn} onChange={setShortDescEn} />
            </div>
          </div>
        </div>

        {/* General Setup */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
            <Settings className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-700">General setup</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm text-slate-600 mb-2">Category</label>
              <select value={categoryId} onChange={handleCategoryChange} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm bg-white">
                <option value="">Select category</option>
                {categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sub Category</label>
              <select value={subCategoryId} onChange={handleSubCategoryChange} disabled={!categoryId} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm bg-white disabled:bg-slate-50">
                <option value="">Select Sub Category</option>
                {filteredSubCategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sub Sub Category</label>
              <select value={subSubCategoryId} onChange={(e) => setSubSubCategoryId(e.target.value)} disabled={!subCategoryId} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm bg-white disabled:bg-slate-50">
                <option value="">Select Sub Sub Category</option>
                {filteredSubSubCategories.map(subSub => (
                  <option key={subSub.id} value={subSub.id}>{subSub.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex justify-between items-center text-sm text-slate-600 mb-2">
                <span>Brand</span>
                <button type="button" onClick={() => setShowBrandModal(true)} className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              </label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm bg-white">
                <option value="">Select Brand</option>
                {brandsList.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Product Type</label>
              <select value={productType} onChange={(e) => setProductType(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm">
                <option>Physical</option>
                <option>Digital</option>
              </select>
            </div>
            <div>
              <label className="flex justify-between items-center text-sm text-slate-600 mb-2">
                <span>Product SKU</span>
                <button type="button" onClick={generateSku} className="text-blue-500 text-xs">Generate Code</button>
              </label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Code" className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm">
                <option>kg</option>
                <option>pc</option>
                <option>ltr</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Search tags</label>
              <input type="text" value={searchTags} onChange={(e) => setSearchTags(e.target.value)} placeholder="Enter tag" className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
          </div>
        </div>

        {/* Pricing & Others */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-700">Pricing & others</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm text-slate-600 mb-2">Purchase Price (৳)</label>
              <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Unit Price (৳)</label>
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Minimum Order Qty</label>
              <input type="number" value={minOrderQty} onChange={(e) => setMinOrderQty(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Current Stock Qty</label>
              <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Discount Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm">
                <option>Flat</option>
                <option>Percent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Discount Amount (৳)</label>
              <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Tax Amount (%)</label>
              <input type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Tax Calculation</label>
              <select value={taxCalculation} onChange={(e) => setTaxCalculation(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm">
                <option>Include with product</option>
                <option>Exclude</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Shipping Cost (৳)</label>
              <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
            </div>
            <div className="flex items-center gap-3 mt-6">
              <label className="text-sm text-slate-600">Shipping Cost Multiply With Quantity</label>
              <div 
                className={`w-10 h-5 rounded-full relative cursor-pointer ${shippingMultiply ? 'bg-blue-500' : 'bg-slate-300'}`}
                onClick={() => setShippingMultiply(!shippingMultiply)}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${shippingMultiply ? 'left-5' : 'left-0.5'}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Product variation setup */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
            <List className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-700">Product variation setup</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-600 mb-2">Select Attributes</label>
              <select 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !selectedAttributes.includes(val)) {
                    setSelectedAttributes([...selectedAttributes, val]);
                    setAttributeValues({ ...attributeValues, [val]: [] });
                  }
                  e.target.value = '';
                }}
                className="w-full md:w-1/2 px-4 py-2 border border-slate-200 rounded-md text-sm bg-white"
              >
                <option value="">Select attribute...</option>
                {dbAttributesList.map(attr => (
                  <option key={attr.id} value={attr.name} disabled={selectedAttributes.includes(attr.name)}>{attr.name}</option>
                ))}
              </select>
            </div>

            {selectedAttributes.length > 0 && (
              <div className="space-y-4">
                {selectedAttributes.map(attr => (
                  <div key={attr} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-slate-50 p-4 rounded-md border border-slate-200">
                    <div className="w-full md:w-1/4 font-medium text-slate-700 flex justify-between items-center">
                      {attr}
                      <button type="button" onClick={() => {
                        setSelectedAttributes(selectedAttributes.filter(a => a !== attr));
                        const newVals = { ...attributeValues };
                        delete newVals[attr];
                        setAttributeValues(newVals);
                      }} className="text-red-500 hover:text-red-700 px-2 text-xl">&times;</button>
                    </div>
                    <div className="w-full md:w-3/4 flex flex-wrap gap-3">
                      {[...(dbAttributesList.find(a => a.name === attr)?.values || [])]
                        .sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' }))
                        .map((v: string) => {
                        const isColor = attr.toLowerCase() === 'color';
                        let colorName = v;
                        let codes: string[] = [];
                        if (isColor && v.includes(' - ')) {
                          const parts = v.split(' - ');
                          colorName = parts[0];
                          if (parts[1] && parts[1].includes('#')) {
                            codes = parts[1].split(',');
                          }
                        }
                        return (
                          <label key={v} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-slate-200 rounded-md shadow-sm hover:border-blue-300 transition">
                            <input 
                              type="checkbox" 
                              checked={attributeValues[attr]?.includes(v) || false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAttributeValues({ ...attributeValues, [attr]: [...(attributeValues[attr] || []), v] });
                                } else {
                                  setAttributeValues({ ...attributeValues, [attr]: attributeValues[attr].filter(val => val !== v) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            {isColor && codes.length > 0 && (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 block shrink-0 shadow-inner" style={getColorStyle(codes)} />
                            )}
                            <span className="text-sm font-medium text-slate-700">{colorName}</span>
                          </label>
                        );
                      })}
                      {(dbAttributesList.find(a => a.name === attr)?.values?.length || 0) === 0 && (
                        <span className="text-sm text-slate-400 italic py-1.5">No predefined values found. Please add values from Attribute Setup.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
               <input 
                 type="checkbox" 
                 id="hasVariations" 
                 checked={hasVariations} 
                 onChange={(e) => setHasVariations(e.target.checked)}
                 className="w-4 h-4 cursor-pointer"
               />
               <label htmlFor="hasVariations" className="text-sm font-medium text-slate-700 cursor-pointer">Enable Product Variations</label>
            </div>

            {hasVariations && variations.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left border border-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-medium">
                    <tr>
                      <th className="px-4 py-3 border-b border-r border-slate-200">Variant</th>
                      <th className="px-4 py-3 border-b border-r border-slate-200">Price (৳)</th>
                      <th className="px-4 py-3 border-b border-r border-slate-200">SKU</th>
                      <th className="px-4 py-3 border-b border-slate-200">Stock Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variations.map((v, idx) => (
                      <tr key={v.name} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-700">{v.name}</td>
                        <td className="px-4 py-3 border-r border-slate-200">
                          <input type="number" value={v.price} onChange={(e) => {
                             const newVars = [...variations];
                             newVars[idx].price = parseFloat(e.target.value) || 0;
                             setVariations(newVars);
                          }} className="w-24 px-2 py-1 border border-slate-200 rounded" />
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200">
                          <input type="text" value={v.sku} onChange={(e) => {
                             const newVars = [...variations];
                             newVars[idx].sku = e.target.value;
                             setVariations(newVars);
                          }} className="w-32 px-2 py-1 border border-slate-200 rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={v.stock} onChange={(e) => {
                             const newVars = [...variations];
                             newVars[idx].stock = parseInt(e.target.value) || 0;
                             setVariations(newVars);
                          }} className="w-24 px-2 py-1 border border-slate-200 rounded" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-700">Product Thumbnail <span className="text-cyan-500 text-xs">Ratio 1:1 (800x800); Max Size: 200kb</span></h2>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
              {uploadingState.thumb ? (
                <div className="text-slate-400 text-sm animate-pulse mb-4 h-32 flex items-center">Uploading...</div>
              ) : thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Thumbnail" className="h-32 object-cover mb-4 rounded" />
              ) : (
                <UploadCloud className="w-10 h-10 text-slate-300 mb-4" />
              )}
              <label className={`px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded cursor-pointer hover:bg-slate-200 ${uploadingState.thumb ? 'opacity-50 pointer-events-none' : ''}`}>
                Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'thumb')} disabled={uploadingState.thumb} />
              </label>
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-700">Upload Additional Image <span className="text-cyan-500 text-xs">Ratio 1:1 (800x800); Max Size: 200kb</span></h2>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
              {uploadingState.add ? (
                <div className="text-slate-400 text-sm animate-pulse mb-4 h-32 flex items-center">Uploading...</div>
              ) : additionalImageUrl ? (
                <img src={additionalImageUrl} alt="Additional" className="h-32 object-cover mb-4 rounded" />
              ) : (
                <UploadCloud className="w-10 h-10 text-slate-300 mb-4" />
              )}
              <label className={`px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded cursor-pointer hover:bg-slate-200 ${uploadingState.add ? 'opacity-50 pointer-events-none' : ''}`}>
                Upload Image
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'add')} disabled={uploadingState.add} />
              </label>
            </div>
          </div>
        </div>

        {/* Video */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
            <Video className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-700">Product video</h2>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">Youtube Video Link</label>
            <input type="text" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="Ex: https://www.youtube.com/embed/..." className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm" />
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
            <Globe className="w-4 h-4 text-slate-500" />
            <h2 className="text-base font-semibold text-slate-700">Seo section</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Meta Title</label>
                <input type="text" value={metaTitle} readOnly className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 text-slate-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Meta Description</label>
                <textarea value={metaDescription} readOnly className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm h-24 bg-slate-50 text-slate-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-2">Meta Keyword</label>
                <input type="text" value={metaKeyword} readOnly className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 text-slate-500 outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pb-12">
          <button type="button" onClick={handleReset} className="px-8 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded shadow-sm hover:bg-slate-200 transition">
            Reset
          </button>
          <button type="submit" disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-medium rounded shadow-sm hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>

      {/* Add Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden font-sans">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Add New Brand</h3>
              <button onClick={() => setShowBrandModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">Brand Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={newBrandName} 
                  onChange={(e) => setNewBrandName(e.target.value)} 
                  placeholder="Enter brand name" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowBrandModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded font-medium">Cancel</button>
              <button 
                type="button" 
                onClick={handleAddBrand}
                disabled={!newBrandName.trim() || isAddingBrand}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded font-medium disabled:opacity-50"
              >
                {isAddingBrand ? 'Adding...' : 'Add Brand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
