import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  RefreshCw,
  MapPin,
  CheckCircle,
  MessageSquare,
  Store,
  Share2,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { Product } from "../types";
import { generateSlug } from "../utils/slugs";
import { ProductCard } from "../App";
import { useToast } from "./ToastContext";
import { supabase } from "../supabaseClient";

interface ProductPageProps {
  product: Product;
  allProducts: Product[];
  onAddToCart: (p: Product, quantity?: number, selectedVariation?: any) => void;
  onAddWishlist: (p: Product) => void;
  onBackToHome: () => void;
  onSelectProduct: (p: Product) => void;
  wishlist?: Product[];
}

export default function ProductPage({
  product,
  allProducts,
  onAddToCart,
  onAddWishlist,
  onBackToHome,
  onSelectProduct,
  wishlist,
}: ProductPageProps) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(product.thumbnail);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "video">(
    "overview",
  );

  const spec = product.specifications || {};
  const hasVariations = spec.has_variations && spec.variations && spec.variations.length > 0;

  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});

  const selectedVariation = useMemo(() => {
    if (!hasVariations) return null;
    return spec.variations.find((v: any) => {
      return Object.entries(selectedVariantOptions).every(([key, val]) => v.attributes && v.attributes[key] === val);
    }) || null;
  }, [hasVariations, spec.variations, selectedVariantOptions]);

  useEffect(() => {
    if (selectedVariation?.image) {
      setActiveImage(selectedVariation.image);
    } else {
      setActiveImage(product.thumbnail);
    }
  }, [selectedVariation, product.thumbnail]);


  const [reviews, setReviews] = useState<any[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (wishlist && Array.isArray(wishlist)) {
      const isAlready = wishlist.some((item) => String(item.id) === String(product.id));
      setIsWishlisted(isAlready);
    } else {
      const saved = localStorage.getItem("wishlist");
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setIsWishlisted(Array.isArray(list) && list.some((item: any) => String(item.id) === String(product.id)));
        } catch (e) {
          setIsWishlisted(false);
        }
      } else {
        setIsWishlisted(false);
      }
    }
  }, [product.id, wishlist]);

  const handleWishlistClick = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      addToast("Please login to add to wishlist", "error");
      return;
    }
    
    onAddWishlist(product);
    
    if (isWishlisted) {
      setIsWishlisted(false);
      setWishlistCount((prev) => Math.max(0, prev - 1));
      addToast(`Removed "${product.title}" from your wishlist.`, "success");
    } else {
      setIsWishlisted(true);
      setWishlistCount((prev) => prev + 1);
      addToast(`Added "${product.title}" to your wishlist.`, "success");
    }
  };

  useEffect(() => {
    setActiveImage(product.thumbnail);

    if (hasVariations && spec.selected_attributes && spec.attribute_values) {
      const initSel: Record<string, string> = {};
      spec.selected_attributes.forEach((attr: string) => {
        if (spec.attribute_values[attr] && spec.attribute_values[attr].length > 0) {
          initSel[attr] = spec.attribute_values[attr][0];
        }
      });
      setSelectedVariantOptions(initSel);
    } else {
      setSelectedVariantOptions({});
    }

    const fetchStats = async () => {
      // Fetch reviews
      const { data: revs } = await supabase
        .from("reviews")
        .select("*, customers(first_name, last_name), review_replies(id, comment, created_at, likes, dislikes, customer_id, seller_id, customers(first_name, last_name), sellers(shop_name, seller_image_url, shop_logo_url))")
        .eq("product_id", product.id)
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (revs) setReviews(revs);

      // Fetch actual orders count
      const { data: ords } = await supabase.from("orders").select("items");
      let count = 0;
      if (ords) {
        ords.forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            if (
              order.items.some(
                (item: any) =>
                  item.id === product.id || item.product?.id === product.id,
              )
            ) {
              count++;
            }
          }
        });
      }
      setOrdersCount(count);

      // Fetch wishlist count globally
      const { count: wlCount } = await supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("product_id", product.id);
      if (wlCount !== null) setWishlistCount(wlCount);
    };

    fetchStats();

    // 1. Update document title (ensure 60-65 length fallback if needed, but we rely on backend's meta_title)
    const pageTitle = product.meta_title || `${product.title} | HolidayMart`;
    document.title = pageTitle;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setLinkTag = (rel: string, href: string) => {
      let tag = document.querySelector(`link[rel="${rel}"]`);
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute('href', href);
    };

    // 2. Description
    const desc = product.meta_description || `Buy the best quality ${product.title} from HolidayMart at the most reasonable price in Bangladesh. We offer fast and reliable delivery. Order now!`;
    setMetaTag('description', desc);

    // 3. Keywords
    const keywords = product.meta_keyword || `${product.title}, HolidayMart, buy online, bangladesh`;
    setMetaTag('keywords', keywords);

    // 4. Canonical URL
    setLinkTag('canonical', window.location.href.split('?')[0]);

    // 5. Robots
    setMetaTag('robots', 'index, follow');

    // 6. Author
    setMetaTag('author', 'HolidayMart');

    // 7. Publisher
    setMetaTag('publisher', 'HolidayMart');

    // 8. Open Graph / Social (bonus)
    setMetaTag('og:title', pageTitle, true);
    setMetaTag('og:description', desc, true);
    setMetaTag('og:url', window.location.href.split('?')[0], true);
    setMetaTag('og:type', 'product', true);
    if (product.thumbnail) {
      setMetaTag('og:image', product.thumbnail, true);
    }

    return () => {
      document.title = "HolidayMart";
      // We don't remove other meta tags on unmount because SPA will navigate, and next product will overwrite.
      // But for default pages without SEO tags, it might persist.
    };
  }, [product.id, product.title, product.meta_title, product.meta_description, product.meta_keyword, product.thumbnail]);

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  const [zoomProps, setZoomProps] = useState({
    isHovered: false,
    x: 50,
    y: 50,
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      addToast("Please login to submit a review", "error");
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== "customer") {
      addToast("Only customers can submit reviews", "error");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validSellerId = uuidRegex.test(product.storeId)
        ? product.storeId
        : null;

      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: product.id,
            customer_id: user.id,
            seller_id: validSellerId,
            rating: newReviewRating,
            comment: newReviewText,
            status: "Published",
          },
        ])
        .select("*, customers(first_name, last_name), review_replies(id, comment, created_at, likes, dislikes, customer_id, seller_id, customers(first_name, last_name), sellers(shop_name, seller_image_url, shop_logo_url))")
        .single();

      if (error) throw error;

      setReviews([data, ...reviews]);
      setNewReviewText("");
      setNewReviewRating(5);
      addToast("Review submitted successfully!", "success");
    } catch (err) {
      console.error("Error submitting review:", err);
      addToast("Failed to submit review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      addToast("Please login to reply", "error");
      return;
    }
    const user = JSON.parse(storedUser);

    try {
      const { data, error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          customer_id: user.role === 'customer' ? user.id : null,
          seller_id: user.role === 'seller' ? user.id : null,
          comment: replyText.trim()
        })
        .select("id, comment, created_at, likes, dislikes, customer_id, seller_id, customers(first_name, last_name), sellers(shop_name, seller_image_url, shop_logo_url)")
        .single();
        
      if (error) throw error;
      
      setReviews(reviews.map(r => r.id === reviewId ? { 
        ...r, 
        review_replies: [...(r.review_replies || []), data] 
      } : r));
      
      setReplyText('');
      setActiveReplyId(null);
      addToast('Reply added successfully', 'success');
    } catch (err) {
      console.error('Error adding reply:', err);
      addToast('Failed to add reply', 'error');
    }
  };

  const handleLikeDislike = async (reviewId: string, replyId: string, type: 'likes' | 'dislikes') => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      addToast("Please login to interact", "error");
      return;
    }
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;
      const reply = review.review_replies?.find((rep: any) => rep.id === replyId);
      if (!reply) return;
      const newCount = (reply[type] || 0) + 1;
      
      const { error } = await supabase.from('review_replies').update({ [type]: newCount }).eq('id', replyId);
      if (error) throw error;
      
      setReviews(reviews.map(r => r.id === reviewId ? {
        ...r,
        review_replies: r.review_replies?.map((rep: any) => rep.id === replyId ? { ...rep, [type]: newCount } : rep)
      } : r));
    } catch(err) {
      console.error(err);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomProps({ isHovered: true, x, y });
  };

  const handleMouseLeave = () => {
    setZoomProps({ isHovered: false, x: 50, y: 50 });
  };

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product, quantity, selectedVariation);
    navigate("/checkout");
  };

  const images = product.galleryImages || [product.thumbnail];

  // Social sharing custom SVGs
  const ShareButtons = () => (
    <div className="flex items-center gap-2 mt-4 select-none">
      <span className="text-xs text-slate-450 font-bold mr-1">Share:</span>
      <button
        onClick={() => addToast("Shared on Facebook!", "success")}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#1877F2] hover:opacity-90 transition shadow-xs cursor-pointer"
        title="Share on Facebook"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H7v3h2v9h3v-9h3.6L16 8h-3V6.5c0-.8.6-1 1-1h2V2.6L13.8 2.5C11 2.5 9 4.2 9 6.5V8z" />
        </svg>
      </button>
      <button
        onClick={() => alert("Shared on Twitter!")}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#1DA1F2] hover:opacity-90 transition shadow-xs cursor-pointer"
        title="Share on Twitter"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      </button>
      <button
        onClick={() => alert("Shared on Pinterest!")}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#E60023] hover:opacity-90 transition shadow-xs cursor-pointer"
        title="Share on Pinterest"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.27 2.68 7.91 6.46 9.35-.09-.8-.17-2.02.03-2.89l1.69-7.15s-.43-.87-.43-2.15c0-2.01 1.17-3.52 2.62-3.52 1.24 0 1.84.93 1.84 2.04 0 1.24-.79 3.1-.19 4.83.36 1.03 1.12 1.85 2.17 1.85 2.05 0 3.63-2.16 3.63-5.28 0-2.76-1.98-4.69-4.81-4.69-3.28 0-5.2 2.46-5.2 5.00 0 .99.38 2.05.86 2.63.1.11.11.21.08.33l-.33 1.35c-.05.21-.17.26-.39.16C7.58 14.1 6.5 11.53 6.5 9.4c0-3.8 2.76-7.29 7.96-7.29 4.18 0 7.43 2.98 7.43 6.96 0 4.15-2.62 7.5-6.26 7.5-1.22 0-2.37-.63-2.76-1.37l-.75 2.85c-.27 1.04-1.01 2.35-1.51 3.17 1.13.35 2.33.54 3.57.54 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
      </button>
      <button
        onClick={() => alert("Shared on Messenger!")}
        className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-[#0084FF] hover:opacity-90 transition shadow-xs cursor-pointer"
        title="Share on Messenger"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.16 5.5 3.08 7.4.3.3.47.7.45 1.1l-.15 2.2c-.03.5.47.9.93.7l2.48-1.23c.33-.16.7-.17 1.04-.07 1.06.3 2.18.5 3.32.5 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm1.78 12.3l-2.45-2.6-4.78 2.6 5.25-5.57 2.48 2.6 4.75-2.6-5.25 5.57z" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Breadcrumb section */}
      <div className="w-full bg-white py-3 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-1.5 text-[11px] text-slate-450 font-bold select-none">
          <button
            onClick={onBackToHome}
            className="hover:text-[#007bff] transition cursor-pointer text-[#007bff]"
          >
            Home
          </button>

          {product.category && product.category !== "Category" && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-350" />
              <Link
                to={`/${product.categorySlug || generateSlug(product.category)}`}
                className="hover:text-[#007bff] transition cursor-pointer text-[#007bff]"
              >
                {product.category}
              </Link>
            </>
          )}

          {product.subCategory && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-350" />
              <Link
                to={`/${product.categorySlug || generateSlug(product.category)}/${product.subCategorySlug || generateSlug(product.subCategory)}`}
                className="hover:text-[#007bff] transition cursor-pointer text-[#007bff]"
              >
                {product.subCategory}
              </Link>
            </>
          )}

          {product.subSubCategory && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-350" />
              <Link
                to={`/${product.categorySlug || generateSlug(product.category)}/${product.subCategorySlug || generateSlug(product.subCategory)}/${product.subSubCategorySlug || generateSlug(product.subSubCategory)}`}
                className="hover:text-[#007bff] transition cursor-pointer text-[#007bff]"
              >
                {product.subSubCategory}
              </Link>
            </>
          )}

          <ChevronRight className="w-3 h-3 text-slate-350" />
          <span className="text-slate-700 truncate">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Main top columns grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Layout Container: gallery + details + tabs */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Column 1: Image Gallery */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-full aspect-square bg-white border border-slate-200 p-4 flex items-center justify-center overflow-hidden cursor-zoom-in relative"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <img
                    src={activeImage}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
                    style={
                      (zoomProps.isHovered && window.matchMedia('(hover: hover)').matches)
                        ? {
                            transform: "scale(2.5)",
                            transformOrigin: `${zoomProps.x}% ${zoomProps.y}%`,
                          }
                        : {
                            transform: "scale(1)",
                            transformOrigin: "center center",
                          }
                    }
                  />
                </div>

                {/* Gallery Thumbnails List */}
                <div className="flex gap-2 w-full justify-start">
                  {images.map((imgUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-14 h-14 bg-white border flex items-center justify-center p-1 transition-all cursor-pointer ${
                        activeImage === imgUrl
                          ? "border-brand-500"
                          : "border-slate-200"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        className="max-h-full max-w-full object-contain"
                        alt=""
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: Product Description & Detail Info */}
              <div className="flex flex-col gap-4 pt-1">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug">
              {product.title}
            </h1>

            {/* Rating & Product meta bar */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-500 font-medium mb-5">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-4 h-4 ${idx < Math.floor(parseFloat(avgRating as string)) ? "text-[#ffc107] fill-[#ffc107]" : "text-slate-200 fill-slate-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-slate-500 font-medium">({reviews.length})</span>
                  </div>
                )}
                
                {reviews.length > 0 && <span className="text-slate-300 hidden sm:inline">|</span>}
                <span className="whitespace-nowrap">{ordersCount} Orders</span>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <span className="whitespace-nowrap">{wishlistCount} Wishlisted</span>
              </div>
            </div>

            <div className="text-[12px] text-slate-700 font-bold">
              Product Code:{" "}
              <span className="font-normal">
                {selectedVariation ? selectedVariation.sku : (product.productCode || "103606")}
              </span>
            </div>

            {/* Variations */}
            {hasVariations && spec.selected_attributes && spec.attribute_values && (
              <div className="mt-4 space-y-4">
                {spec.selected_attributes.map((attr: string) => {
                  const values = spec.attribute_values[attr] || [];
                  if (values.length === 0) return null;
                  const isColor = attr.toLowerCase() === 'color';
                  
                  return (
                    <div key={attr} className="flex flex-col gap-2">
                      <span className="text-sm font-bold text-slate-700">{attr}</span>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val: string) => {
                          const isSelected = selectedVariantOptions[attr] === val;
                          let displayVal = val;
                          let colors: string[] = [];
                          if (isColor && val.includes(' - ')) {
                             const parts = val.split(' - ');
                             displayVal = parts[0];
                             if (parts[1] && parts[1].includes('#')) {
                               colors = parts[1].split(',');
                             }
                          }
                          let imgUrl = "";
                          const lowerVal = displayVal.toLowerCase();
                          if (lowerVal === 'thumbnail') {
                            imgUrl = product.thumbnail;
                          } else if (lowerVal.startsWith('additional image ')) {
                            const idx = parseInt(lowerVal.replace('additional image ', '')) - 1;
                            if (!isNaN(idx) && product.galleryImages && product.galleryImages[idx]) {
                              imgUrl = product.galleryImages[idx];
                            }
                          }

                          return (
                            <button
                              key={val}
                              onClick={() => setSelectedVariantOptions(prev => ({ ...prev, [attr]: val }))}
                              className={`border text-xs font-medium rounded transition flex items-center justify-center cursor-pointer overflow-hidden ${isSelected ? 'border-brand-500 text-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'} ${imgUrl ? 'p-0.5' : 'px-3 py-1.5 gap-2'}`}
                              title={displayVal}
                            >
                              {imgUrl ? (
                                <img src={imgUrl} alt={displayVal} className="w-12 h-12 object-cover rounded-sm" />
                              ) : (
                                <>
                                  {isColor && colors.length > 0 && (
                                    <span 
                                      className="w-3.5 h-3.5 rounded-full inline-block border border-slate-200 shrink-0" 
                                      style={{ background: colors.length > 1 ? `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` : colors[0] }}
                                    />
                                  )}
                                  {displayVal}
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Short Description */}
            {product.shortDescription && (
              <div className="mt-4 mb-2">
                <h3 className="text-[15px] font-bold text-slate-800 mb-2">
                  Key Features
                </h3>
                <div
                  className="text-[13px] text-slate-600 prose prose-sm max-w-none prose-p:my-1 prose-ul:list-none prose-ul:pl-0 prose-li:my-0.5"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              </div>
            )}

            {/* Price Container */}
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl font-bold text-secondary-500">
                ৳{(selectedVariation ? selectedVariation.price : product.price).toLocaleString()}.00
              </span>
              {product.oldPrice && !selectedVariation && (
                <span className="text-sm text-slate-400 line-through font-medium">
                  ৳{product.oldPrice.toLocaleString()}.00
                </span>
              )}
            </div>

            {/* Quantity Selector & Social Share */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-slate-700">
                  Quantity :
                </span>
                <div className="flex items-center border border-brand-500/30 rounded h-7 bg-white">
                  <button
                    onClick={handleDecrement}
                    className="px-2 h-full text-orange-500 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-2 text-[12px] font-bold text-slate-700 text-center border-l border-r border-brand-500/30 h-full flex items-center">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="px-2 h-full text-orange-500 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Share block inline */}
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white bg-[#3b5998] hover:opacity-90 shadow-sm cursor-pointer"
                  title="Share on Facebook"
                  onClick={() => addToast("Shared on Facebook!", "success")}
                >
                  <span className="text-xs font-bold font-serif">f</span>
                </button>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white bg-[#00acee] hover:opacity-90 shadow-sm cursor-pointer"
                  title="Share on Twitter"
                  onClick={() => addToast("Shared on Twitter!", "success")}
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white bg-[#25D366] hover:opacity-90 shadow-sm cursor-pointer"
                  title="Share on WhatsApp"
                  onClick={() => addToast("Shared on WhatsApp!", "success")}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 0C5.385 0 .003 5.383.003 12.031c0 2.124.551 4.195 1.6 6.02L.003 24l6.096-1.597c1.761 1.01 3.766 1.542 5.932 1.542 6.643 0 12.025-5.382 12.025-12.031S18.674 0 12.031 0zM12.031 22.027c-1.848 0-3.659-.497-5.244-1.436l-.376-.222-3.896 1.021 1.036-3.798-.244-.388C2.33 15.65 1.766 13.882 1.766 12.031c0-5.666 4.606-10.272 10.265-10.272 5.66 0 10.263 4.606 10.263 10.272 0 5.667-4.603 10.272-10.263 10.272zm5.643-7.72c-.31-.155-1.828-.902-2.112-1.004-.284-.103-.49-.155-.698.155-.206.31-.8 1.004-.98 1.21-.181.206-.363.232-.673.078-1.543-.768-2.584-1.442-3.606-2.716-.263-.326.126-.307.726-1.503.078-.155.039-.29-.039-.445-.078-.155-.698-1.684-.956-2.304-.251-.6-.505-.519-.698-.528-.18-.009-.387-.009-.594-.009-.206 0-.543.078-.827.387-.284.31-1.085 1.059-1.085 2.583 0 1.524 1.111 2.996 1.266 3.203.155.206 2.183 3.332 5.289 4.67.742.32 1.32.511 1.77.653.743.237 1.42.203 1.954.123.601-.09 1.828-.748 2.086-1.472.258-.724.258-1.343.181-1.472-.078-.129-.285-.206-.594-.361z" />
                  </svg>
                </button>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white bg-[#ea4335] hover:opacity-90 shadow-sm cursor-pointer"
                  title="Share via Email"
                  onClick={() => addToast("Shared via Email!", "success")}
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-[12px] font-bold text-slate-700 mt-2">
              Total Price :{" "}
              <span className="text-orange-500">
                ৳{(product.price * quantity).toLocaleString()}.00
              </span>{" "}
              <span className="text-[10px] text-slate-400 font-normal">
                (Tax: ৳0.00)
              </span>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={handleBuyNow}
                className="bg-brand-500 text-white border border-transparent hover:bg-white hover:text-brand-500 hover:border-brand-500 font-bold h-10 px-6 rounded shadow-sm cursor-pointer min-w-[120px] transition flex items-center justify-center text-[13px]"
              >
                Buy now
              </button>
              <button
                onClick={() => {
                  onAddToCart(product, quantity, selectedVariation);
                  addToast(
                    `Added ${quantity} units of "${product.title}" to your shopping cart.`,
                    "success",
                  );
                }}
                className="bg-brand-500 text-white border border-transparent hover:bg-white hover:text-brand-500 hover:border-brand-500 font-bold h-10 px-6 rounded shadow-sm cursor-pointer min-w-[120px] transition flex items-center justify-center text-[13px]"
              >
                Add to cart
              </button>
              <button
                onClick={handleWishlistClick}
                className={`h-10 px-4 border rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                  isWishlisted 
                    ? "bg-brand-50 border-brand-500 text-brand-500" 
                    : "bg-white border-slate-200 hover:border-brand-500 text-slate-700"
                }`}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart 
                  className={`w-4 h-4 transition ${isWishlisted ? "text-brand-500 fill-brand-500" : "text-secondary-500 group-hover:text-brand-500"}`} 
                  strokeWidth={2.5} 
                />{" "}
                <span className="text-[13px] font-bold">{wishlistCount}</span>
              </button>
          </div>
        </div>
      </div>

      {/* Tabbed Overview & Reviews Section */}
      <div className="flex flex-col gap-6">
          {/* Tab buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-2 text-[12px] font-bold rounded-full transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-brand-500 hover:text-brand-500"
              }`}
            >
              Overview
            </button>
            {product.video_link && (
              <button
                onClick={() => setActiveTab("video")}
                className={`px-6 py-2 text-[12px] font-bold rounded-full transition cursor-pointer ${
                  activeTab === "video"
                    ? "bg-brand-500 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-brand-500 hover:text-brand-500"
                }`}
              >
                Product Video
              </button>
            )}
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-6 py-2 text-[12px] font-bold rounded-full transition cursor-pointer ${
                activeTab === "reviews"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-brand-500 hover:text-brand-500"
              }`}
            >
              Reviews
            </button>
          </div>

          {/* Overview content */}
          {activeTab === "overview" && (
            <div className="bg-white flex flex-col gap-6 text-[12px]">

              {/* Description */}
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-3">
                  Description
                </h3>
                <h4 className="font-bold text-slate-800 text-[15px] mb-2">
                  {product.title}
                </h4>
                <div className="text-slate-600 leading-relaxed space-y-3 text-[13px] prose prose-sm max-w-none overflow-x-auto w-full">
                  {product.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p>No detailed description available.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Video content */}
          {activeTab === "video" && product.video_link && (
            <div className="bg-white flex flex-col gap-6 text-[12px]">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-3">
                  Product Video
                </h3>
                <div className="aspect-video w-full max-w-3xl rounded-lg overflow-hidden border border-slate-200 bg-slate-50 relative flex items-center justify-center">
                   {product.video_link.includes('youtube.com') || product.video_link.includes('youtu.be') || product.video_link.includes('vimeo.com') ? (
                    <iframe
                      src={product.video_link.includes('watch?v=') ? product.video_link.replace('watch?v=', 'embed/') : product.video_link}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : product.video_link.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video controls className="w-full h-full">
                      <source src={product.video_link} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-center p-6">
                      <p className="text-slate-600 mb-4 text-base">Click the button below to view the product video.</p>
                      <a 
                        href={product.video_link.startsWith('http') ? product.video_link : `https://${product.video_link}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-secondary-500 hover:bg-brand-500 text-white font-bold py-3 px-8 rounded shadow-sm transition-colors text-sm"
                      >
                        Watch Video
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {activeTab === "reviews" && (
            <div className="bg-white rounded border border-slate-200/60 p-6">
              {/* Write a review form */}
              <div className="mb-8 pb-8 border-b border-slate-100">
                <h3 className="text-[15px] font-bold text-slate-800 mb-4">
                  Write a Review
                </h3>
                <form
                  onSubmit={handleSubmitReview}
                  className="space-y-4 max-w-2xl"
                >
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-2">
                      Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          onClick={() => setNewReviewRating(star)}
                          className={`w-6 h-6 cursor-pointer transition ${star <= newReviewRating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-slate-700 mb-2">
                      Your Review
                    </label>
                    <textarea
                      required
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="w-full p-3 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-orange-500 min-h-[100px]"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-brand-500 text-white border border-transparent hover:bg-white hover:text-brand-500 hover:border-brand-500 px-6 py-2.5 rounded-lg text-[13px] font-bold transition disabled:opacity-50"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>

              {/* List of reviews */}
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-6">
                  Customer Reviews ({reviews.length})
                </h3>
                {reviews.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-[12px] font-medium">
                    No reviews available yet. Be the first to review!
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex gap-4">
                        <img
                          src={
                            review.customers?.image_url ||
                            `https://ui-avatars.com/api/?name=${review.customers?.first_name}+${review.customers?.last_name}&background=f1f5f9&color=64748b`
                          }
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[13px] text-slate-800">
                              {review.customers?.first_name}{" "}
                              {review.customers?.last_name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mb-2">
                            {[...Array(5)].map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${idx < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                              />
                            ))}
                          </div>
                          <p className="text-[13px] text-slate-600 leading-relaxed">
                            {review.comment}
                          </p>
                          {review.reply && (
                            <div className="mt-3 bg-slate-50 p-3 rounded border border-slate-100 text-slate-600 text-xs">
                              <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
                                <Store className="w-3.5 h-3.5 text-orange-500" /> Seller Reply:
                              </span>
                              {review.reply}
                            </div>
                          )}

                          {/* Threaded Replies */}
                          {review.review_replies && review.review_replies.length > 0 && (
                            <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-100">
                              {review.review_replies.map((rep: any) => (
                                <div key={rep.id} className={`text-xs p-3 rounded ${rep.seller_id ? 'bg-brand-50/50' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <img
                                      src={
                                        rep.sellers?.shop_logo_url ||
                                        rep.sellers?.seller_image_url ||
                                        rep.customers?.image_url ||
                                        `https://ui-avatars.com/api/?name=${rep.sellers ? rep.sellers.shop_name : rep.customers?.first_name}&background=f1f5f9&color=64748b`
                                      }
                                      alt="avatar"
                                      className="w-5 h-5 rounded-full object-cover shrink-0"
                                    />
                                    <span className="font-bold text-slate-700">
                                      {rep.sellers ? (
                                        <span className="flex items-center gap-1 text-orange-600">
                                          <Store className="w-3 h-3" /> {rep.sellers.shop_name} (Seller)
                                        </span>
                                      ) : rep.customers ? (
                                        `${rep.customers.first_name} ${rep.customers.last_name}`
                                      ) : (
                                        'Unknown'
                                      )}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-auto">
                                      {new Date(rep.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 leading-relaxed ml-7 mb-2">{rep.comment}</p>
                                  
                                  {/* Like / Dislike / Reply actions */}
                                  <div className="flex items-center gap-4 ml-7 text-[11px] font-medium text-slate-500">
                                    <button onClick={() => handleLikeDislike(review.id, rep.id, 'likes')} className="hover:text-blue-600 flex items-center gap-1 transition">
                                      👍 {rep.likes || 0}
                                    </button>
                                    <button onClick={() => handleLikeDislike(review.id, rep.id, 'dislikes')} className="hover:text-red-600 flex items-center gap-1 transition">
                                      👎 {rep.dislikes || 0}
                                    </button>
                                    <button onClick={() => setActiveReplyId(activeReplyId === rep.id ? null : rep.id)} className="hover:text-orange-500 transition">
                                      Reply
                                    </button>
                                  </div>

                                  {activeReplyId === rep.id && (
                                    <div className="mt-3 ml-7 animate-fadeIn">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="w-full p-2 text-[12px] border border-slate-200 rounded outline-none focus:border-orange-500 mb-2 min-h-[60px]"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                                          className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleReplySubmit(review.id)}
                                          className="px-3 py-1.5 text-[11px] font-bold bg-slate-900 text-white rounded hover:bg-slate-800 transition"
                                        >
                                          Submit Reply
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {(!review.review_replies || review.review_replies.length === 0) && (
                            <div className="mt-3">
                              <button onClick={() => setActiveReplyId(activeReplyId === review.id ? null : review.id)} className="text-[11px] font-medium text-slate-500 hover:text-orange-500 transition">
                                Reply to review
                              </button>
                              {activeReplyId === review.id && (
                                <div className="mt-2 animate-fadeIn">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full p-2 text-[12px] border border-slate-200 rounded outline-none focus:border-orange-500 mb-2 min-h-[60px]"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                                      className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleReplySubmit(review.id)}
                                      className="px-3 py-1.5 text-[11px] font-bold bg-slate-900 text-white rounded hover:bg-slate-800 transition"
                                    >
                                      Submit Reply
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Guarantees, Store Profile & More from Store (Spanning 1 column on the right next to left area) */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        {/* Guarantees Box */}
        <div className="bg-white rounded border border-slate-200/80 shadow-xs p-4 flex flex-col gap-4 text-[12px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-brand-500 shrink-0" />
            <span>Fast Delivery all across the country</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Safe Payment</span>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-rose-500 shrink-0" />
            <span>7 Days Return Policy</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
            <span>100% Authentic Products</span>
          </div>
        </div>

        {/* Vendor Profile Card */}
        {product.storeId !== "admin" && (
          <div className="bg-white rounded border border-slate-200/80 shadow-xs p-4 flex flex-col items-center">
            <div className="flex items-center gap-2 w-full mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                <Store className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-xs font-black text-slate-800 line-clamp-1">
                {product.storeName}
              </h4>
            </div>

            <div className="grid grid-cols-2 w-full text-center divide-x divide-slate-100 mb-4">
              <div className="flex flex-col items-center gap-1">
                <div className="bg-brand-500/10 p-1.5 rounded-full">
                  <MessageSquare className="w-4 h-4 text-brand-500" />
                </div>
                <p className="text-[10px] font-bold text-orange-500">
                  {reviews.length} Reviews
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-brand-500/10 p-1.5 rounded-full">
                  <Store className="w-4 h-4 text-brand-500" />
                </div>
                <p className="text-[10px] font-bold text-orange-500">
                  {
                    allProducts.filter((p) => p.storeId === product.storeId)
                      .length
                  }{" "}
                  Products
                </p>
              </div>
            </div>

            <Link
              to={`/store/${product.storeName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "")}`}
              className="w-full bg-secondary-500 hover:bg-brand-500 text-white py-2 rounded text-[12px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Store className="w-3.5 h-3.5" /> Visit Store
            </Link>
          </div>
        )}

        {/* More From The Store */}
        <div>
          <h3 className="text-[13px] font-bold text-slate-800 mb-3">
            More From The Store
          </h3>
          <div className="flex flex-col gap-3">
            {allProducts
              .filter(
                (p) => p.storeId === product.storeId && p.id !== product.id,
              )
              .slice(0, 10) // Take up to 10
              .map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="bg-white rounded border border-slate-200 p-2 flex gap-3 cursor-pointer hover:shadow-sm transition"
                >
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded shrink-0 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={p.thumbnail}
                      className="max-w-full max-h-full object-contain"
                      alt=""
                    />
                    {p.discountBadge && (
                      <span className="absolute top-0 left-0 bg-brand-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-br">
                        {p.discountBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-800 truncate mb-0.5">
                      {p.title}
                    </h4>
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className="flex">
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-2.5 h-2.5 ${idx < Math.floor(p.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold">
                        (0)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        ৳{p.price.toLocaleString()}.00
                      </span>
                      {p.oldPrice && (
                        <span className="text-[9px] text-slate-400 line-through">
                          ৳{p.oldPrice.toLocaleString()}.00
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>

        {/* Similar Products Section */}
        {allProducts.filter(
          (p) => p.category_id === product.category_id && p.id !== product.id,
        ).length > 0 && (
          <div className="bg-white rounded-lg border border-slate-100 p-5 sm:p-7 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                Similar Products
              </h3>
              <Link
                to={`/${product.categorySlug || generateSlug(product.category || "Category")}`}
                className="text-[13px] font-bold text-brand-500 hover:text-orange-600 transition flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {allProducts
                .filter(
                  (p) =>
                    p.category_id === product.category_id &&
                    p.id !== product.id,
                )
                .slice(0, 12) // max 12
                .map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug}`}
                    onClick={() => onSelectProduct(p)}
                    className="bg-white border border-slate-100/80 rounded-lg p-3 flex flex-col hover:border-orange-500/30 transition duration-200"
                  >
                    <div className="w-full flex justify-start mb-1.5 min-h-[20px]">
                      {p.oldPrice > p.price && (
                        <span className="bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-wide">
                          +{(p.oldPrice - p.price).toLocaleString()}.00 Off
                        </span>
                      )}
                    </div>
                    <div className="w-full h-24 sm:h-28 mb-4 flex items-center justify-center">
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="flex flex-col items-center text-center mt-auto">
                      <h4 className="text-[11px] font-bold text-slate-800 leading-snug line-clamp-2 min-h-[32px] mb-2 px-1">
                        {p.title}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5 pb-1">
                        {p.oldPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ৳{p.oldPrice.toLocaleString()}.00
                          </span>
                        )}
                        <span className="text-[12px] font-bold text-slate-800">
                          ৳{p.price.toLocaleString()}.00
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
