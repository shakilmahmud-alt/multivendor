import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProductPage from './ProductPage';
import { ErrorBoundary } from './ErrorBoundary';

export default function ProductPageWrapper({ onAddToCart, onAddWishlist, onSelectProduct, allProducts, wishlist }: any) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    


    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('in_house_products')
          .select('*, brand:brands(name)')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        
        let catName = 'Category';
        let subCatName = undefined;
        let subSubCatName = undefined;

        if (data.category_id) {
          const { data: catData } = await supabase.from('categories').select('name').eq('id', data.category_id).single();
          if (catData) catName = catData.name;
        }
        if (data.sub_category_id) {
          const { data: subData } = await supabase.from('sub_categories').select('name').eq('id', data.sub_category_id).single();
          if (subData) subCatName = subData.name;
        }
        if (data.sub_sub_category_id) {
          const { data: subSubData } = await supabase.from('sub_sub_categories').select('name').eq('id', data.sub_sub_category_id).single();
          if (subSubData) subSubCatName = subSubData.name;
        }
        
        const unitPrice = parseFloat(data.unit_price) || 0;
        const discountAmt = parseFloat(data.discount_amount) || 0;
        const discountType = data.discount_type || 'Flat';
        
        let actualPrice = unitPrice;
        let discountBadgeValue = undefined;

        if (discountAmt > 0) {
          if (discountType === 'Percent') {
            actualPrice = Math.round(unitPrice - (unitPrice * (discountAmt / 100)));
            discountBadgeValue = `-${discountAmt}%`;
          } else {
            actualPrice = Math.round(unitPrice - discountAmt);
            discountBadgeValue = `-${discountAmt}`;
          }
        }

        let isFlashDeal = false;
        try {
          const { data: fdProduct } = await supabase
            .from('flash_deal_products')
            .select('flash_deal_id')
            .eq('product_id', data.id)
            .single();
            
          if (fdProduct) {
            const { data: activeDeal } = await supabase
              .from('flash_deals')
              .select('*')
              .eq('id', fdProduct.flash_deal_id)
              .single();
              
            if (activeDeal) {
              isFlashDeal = true;
              if (activeDeal.discount_type === "Percentage") {
                actualPrice = Math.round(unitPrice - unitPrice * (activeDeal.discount_amount / 100));
                discountBadgeValue = `-${activeDeal.discount_amount}% FLASH`;
              } else {
                actualPrice = Math.round(unitPrice - activeDeal.discount_amount);
                discountBadgeValue = `-${activeDeal.discount_amount} FLASH`;
              }
            }
          }
        } catch(e) {
          // ignore if no flash deal
        }

        // Transform to match the Product type expected by ProductPage
        const transformedProduct = {
          id: data.id,
          title: data.name_en,
          price: actualPrice,
          oldPrice: actualPrice < unitPrice ? unitPrice : undefined,
          rating: 0,
          reviewCount: 0,
          thumbnail: data.thumbnail_url,
          galleryImages: [
            ...(data.thumbnail_url ? [data.thumbnail_url] : []),
            ...(Array.isArray(data.additional_images) ? data.additional_images : [])
          ],
          category: catName,
          subCategory: subCatName,
          subSubCategory: subSubCatName,
          brand: data.brand?.name || '',
          discountBadge: discountBadgeValue,
          isFlashDeal: isFlashDeal,
          isNew: data.is_featured,
          storeName: data.attributes?.shop_name || (data.attributes?.seller_id ? 'Seller Store' : 'HolidayMart'),
          storeId: data.attributes?.seller_id || 'admin',
          productCode: data.sku,
          shortDescription: data.short_desc_en,
          specifications: data.attributes || {},
          description: data.desc_en,
          slug: data.slug,
          category_id: data.category_id,
          video_link: data.video_link
        };
        
        setProduct(transformedProduct);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading product...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-red-500">Product not found</div>;

  return (
    <ErrorBoundary>
      <ProductPage 
        product={product} 
        allProducts={allProducts || []}
        onAddToCart={onAddToCart}
        onAddWishlist={onAddWishlist}
        onBackToHome={() => navigate('/')}
        onSelectProduct={onSelectProduct}
        wishlist={wishlist}
      />
    </ErrorBoundary>
  );
}
