import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import { generateSlug } from "./utils/slugs";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import SupplierList from "./components/admin/SupplierList";
import SupplierForm from "./components/admin/SupplierForm";
import POS from "./components/admin/POS";
import PurchaseList from "./components/admin/PurchaseList";
import PurchaseForm from "./components/admin/PurchaseForm";
import PurchaseChallan from "./components/admin/PurchaseChallan";
import OrderList from "./components/admin/OrderList";
import OrderDetails from "./components/admin/OrderDetails";
import RefundRequests from "./components/admin/RefundRequests";
import CategorySetup from "./components/admin/CategorySetup";
import SubCategorySetup from "./components/admin/SubCategorySetup";
import SubSubCategorySetup from "./components/admin/SubSubCategorySetup";
import BrandSetup from "./components/admin/BrandSetup";
import BannerSetup from "./components/admin/BannerSetup";
import CouponSetup from "./components/admin/CouponSetup";
import ShippingMethodList from "./components/admin/ShippingMethodList";
import FlashDealSetup from "./components/admin/FlashDealSetup";
import AdminFlashDealDetails from "./components/admin/AdminFlashDealDetails";
import FlashDealsJoin from "./components/admin/FlashDealsJoin";
import FlashDeals from "./components/admin/FlashDeals";
import SellerCouponSetup from "./components/seller/SellerCouponSetup";
import SellerTransaction from "./components/seller/SellerTransaction";
import BrandList from "./components/admin/BrandList";
import ProductAttributes from "./components/admin/ProductAttributes";
import UpdateAttribute from "./components/admin/UpdateAttribute";
import InHouseProductList from "./components/admin/InHouseProductList";
import AddInHouseProduct from "./components/admin/AddInHouseProduct";
import GenerateBarcode from "./components/admin/GenerateBarcode";
import SellerProducts from "./components/admin/SellerProducts";
import SellerList from "./components/admin/SellerList";
import SellerDetails from "./components/admin/SellerDetails";
import EarningReports from './components/admin/EarningReports';
import TransactionReport from "./components/admin/TransactionReport";
import GrossProfitReport from "./components/admin/GrossProfitReport";
import CustomerList from './components/admin/CustomerList';
import CustomerReviews from "./components/admin/CustomerReviews";
import Settings from "./components/admin/Settings";
import HomeLayoutSetup from "./components/admin/HomeLayoutSetup";
import Messages from "./components/admin/Messages";
import SupportTickets from "./components/admin/SupportTickets";
import Login from "./pages/Login";
import MyAccount from "./pages/MyAccount";
import SellerSignUp from "./pages/SellerSignUp";
import CustomerSignUp from "./pages/CustomerSignUp";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import TrackOrder from "./pages/TrackOrder";
import { supabase } from "./supabaseClient";
import ProductLanding from "./components/ProductLanding";
import ProductPageWrapper from "./components/ProductPageWrapper";
import { ToastProvider } from "./components/ToastContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import FeaturedDeals from "./components/FeaturedDeals";
import CategorySlider from "./components/CategorySlider";
import ReviewSystem from "./components/ReviewSystem";
import DeveloperDocs from "./components/DeveloperDocs";
import ProductPage from "./components/ProductPage";
import CategoryPage from "./components/CategoryPage";
import BrandPage from "./components/BrandPage";
import StorePage from "./components/StorePage";
import SearchPage from "./components/SearchPage";
import FlashDealsPage from "./components/FlashDealsPage";
import { VIDEO_GAMES_AND_REELS, BLOG_POSTS } from "./data";
import RefundPolicy from "./pages/RefundPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import { Product, CartItem } from "./types";
import {
  Star,
  ShoppingCart,
  Eye,
  Heart,
  Send,
  CheckCircle,
  ChevronDown,
  Trash2,
  Mail,
  Users,
  HardHat,
  ShieldAlert,
  BadgeInfo,
  Play,
  Sparkles,
  Search,
  X,
  Apple,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Phone,
  Ticket,
  MapPin,
  Store,
} from "lucide-react";

function StoreFront() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>(
    [],
  );
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeProductList, setActiveProductList] = useState<Product[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Quick view item details modal state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [activeProductDetail, setActiveProductDetail] =
    useState<Product | null>(null);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbSubCategories, setDbSubCategories] = useState<any[]>([]);
  const [dbSubSubCategories, setDbSubSubCategories] = useState<any[]>([]);
  const [dbBanners, setDbBanners] = useState<any[]>([]);
  const [dbSellers, setDbSellers] = useState<any[]>([]);
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [dbHomeLayouts, setDbHomeLayouts] = useState<any[]>([]);
  const [showPopupBanner, setShowPopupBanner] = useState(false);

  useEffect(() => {
    const fetchProductsAndSellers = async () => {
      try {
        const [prodRes, sellerRes, catRes, subCatRes, subSubCatRes, bannersRes, reviewsRes, flashDealsRes, flashDealProductsRes, brandsRes, layoutsRes] =
          await Promise.all([
            supabase
              .from("in_house_products")
              .select("*")
              .eq("is_active", true)
              .order("created_at", { ascending: false }),
            supabase.from("sellers").select("id, shop_name, shop_logo_url, status"),
            supabase.from("categories").select("*"),
            supabase.from("sub_categories").select("*"),
            supabase.from("sub_sub_categories").select("*"),
            supabase.from("banners").select("*").eq("published", true),
            supabase.from("reviews").select("product_id, rating"),
            supabase.from("flash_deals").select("*").eq("status", "active"),
            supabase.from("flash_deal_products").select("*").eq("status", "submitted"),
            supabase.from("brands").select("id, name, logo_url"),
            supabase.from("home_layouts").select("*").eq("is_active", true).order("priority", { ascending: true })
          ]);

        const productsData = prodRes.data || [];
        const sellersData = sellerRes.data || [];
        const catsData = catRes.data || [];
        const subCatsData = subCatRes.data || [];
        const subSubCatsData = subSubCatRes.data || [];
        const bannersData = bannersRes.data || [];
        const reviewsData = reviewsRes?.data || [];
        const flashDealsData = flashDealsRes.data || [];
        const flashDealProductsData = flashDealProductsRes.data || [];
        const brandsData = brandsRes.data || [];
        const layoutsData = layoutsRes.data || [];

        setDbCategories(catsData);
        setDbSubCategories(subCatsData);
        setDbSubSubCategories(subSubCatsData);
        setDbBanners(bannersData);
        setDbSellers(sellersData.filter((s: any) => s.status === "Active"));
        setDbBrands(brandsData);
        setDbHomeLayouts(layoutsData);

        // Show popup banner after 2-3 seconds if available
        const popupBanner = bannersData.find((b: any) => b.banner_type === "Popup Banner");
        if (popupBanner) {
          setTimeout(() => setShowPopupBanner(true), 2500);
        }

        const sellerMap = new Map();
        sellersData.forEach((s) => sellerMap.set(s.id, s.shop_name));

        const catMap = new Map();
        const catSlugMap = new Map();
        catsData.forEach((c) => { catMap.set(c.id, c.name); catSlugMap.set(c.id, c.slug); });

        const subCatMap = new Map();
        const subCatSlugMap = new Map();
        subCatsData.forEach((c) => { subCatMap.set(c.id, c.name); subCatSlugMap.set(c.id, c.slug); });

        const subSubCatMap = new Map();
        const subSubCatSlugMap = new Map();
        subSubCatsData.forEach((c) => { subSubCatMap.set(c.id, c.name); subSubCatSlugMap.set(c.id, c.slug); });

        const brandMap = new Map();
        brandsData.forEach((b) => brandMap.set(b.id, b.name));

        const mappedProducts: Product[] = productsData.map((p: any) => {
          const unitPrice = parseFloat(p.unit_price) || 0;
          const discountAmt = parseFloat(p.discount_amount) || 0;
          const discountType = p.discount_type || "Flat";

          let actualPrice = unitPrice;
          let discountBadgeValue = undefined;

          if (discountAmt > 0) {
            if (discountType === "Percent") {
              actualPrice = Math.round(unitPrice - unitPrice * (discountAmt / 100));
              discountBadgeValue = `-${discountAmt}%`;
            } else {
              actualPrice = Math.round(unitPrice - discountAmt);
              discountBadgeValue = `-${discountAmt}`;
            }
          }

          // Apply Flash Deal Discount if applicable
          let isFlashDeal = false;
          const fdProduct = flashDealProductsData.find((fdp: any) => fdp.product_id === p.id);
          if (fdProduct) {
            const activeDeal = flashDealsData.find((fd: any) => fd.id === fdProduct.flash_deal_id);
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

          const productReviews = reviewsData.filter((r: any) => r.product_id === p.id);
          const rCount = productReviews.length;
          const avgRating = rCount > 0 ? (productReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / rCount) : 0;

          return {
            id: p.id,
            title: p.name_en,
            category: catMap.get(p.category_id) || "Uncategorized",
            categorySlug: catSlugMap.get(p.category_id) || (catMap.get(p.category_id) ? generateSlug(catMap.get(p.category_id)) : ""),
            subCategory: subCatMap.get(p.sub_category_id),
            subCategorySlug: subCatSlugMap.get(p.sub_category_id) || (subCatMap.get(p.sub_category_id) ? generateSlug(subCatMap.get(p.sub_category_id)) : ""),
            subSubCategory: String(p.sub_sub_category_id || '').split(',').map(id => subSubCatMap.get(id)).filter(Boolean).join(', '),
            subSubCategorySlug: String(p.sub_sub_category_id || '').split(',').map(id => subSubCatSlugMap.get(id) || (subSubCatMap.get(id) ? generateSlug(subSubCatMap.get(id)!) : "")).filter(Boolean).join(', '),
            thumbnail:
              p.thumbnail_url ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
            price: actualPrice,
            oldPrice: actualPrice < unitPrice ? unitPrice : undefined,
            discountBadge: discountBadgeValue,
            rating: avgRating,
            reviewCount: rCount,
            storeName:
              p.attributes?.shop_name ||
              (p.attributes?.seller_id
                ? sellerMap.get(p.attributes.seller_id)
                : "In-House"),
            storeId: p.attributes?.seller_id || "admin",
            stock: p.current_stock_qty || 10,
            is_featured: p.is_featured,
            productCode: p.sku,
            description: p.desc_en,
            shortDescription: p.short_desc_en,
            slug: p.slug,
            brand: brandMap.get(p.brand_id),
            galleryImages: p.additional_images || [],
            category_id: p.category_id,
            sub_category_id: p.sub_category_id,
            sub_sub_category_id: p.sub_sub_category_id,
            meta_title: p.meta_title,
            meta_description: p.meta_description,
            meta_keyword: p.meta_keyword,
            isFlashDeal,
            attributes: p.attributes?.attribute_values || {}
          };
        });

        setActiveProductList(mappedProducts);
      } catch (err) {
        console.error("Error fetching live products:", err);
      }
    };

    fetchProductsAndSellers();
  }, []);

  const location = useLocation();

  // Scroll to top on navigation/view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, activeProductDetail, activeCategory]);

  // Filter products by category
  const filteredProducts = activeProductList.filter((product) => {
    const matchesCategory =
      activeCategory === "" ||
      product.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesCategory;
  });

  const handleSearch = (term: string) => {
    setActiveProductDetail(null);
  };

  const handleSelectCategory = (categoryName: string, preventNav = false) => {
    setActiveCategory(categoryName);
    setActiveProductDetail(null);
    if (!preventNav) {
      if (!categoryName) {
        navigate("/");
      } else {
        const cat = dbCategories.find(c => c.name === categoryName);
        const encoded = cat?.slug || generateSlug(categoryName);
        navigate(`/${encoded}`);
      }
    }
  };

  const handleAddToCart = (product: Product, quantity = 1, selectedVariation: any = null) => {
    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.product.id === product.id && JSON.stringify(item.selectedVariation) === JSON.stringify(selectedVariation)
      );
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id && JSON.stringify(item.selectedVariation) === JSON.stringify(selectedVariation)
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      const cartItemId = `${product.id}-${Date.now()}`;
      return [...prevCart, { cartItemId, product, quantity, selectedVariation }];
    });
  };

  const handleAddWishlist = async (product: Product) => {
    const isAlready = wishlist.some((item) => item.id === product.id);
    
    if (isAlready) {
      setWishlist((prevWishlist) => {
        const newList = prevWishlist.filter((item) => item.id !== product.id);
        localStorage.setItem('wishlist', JSON.stringify(newList));
        return newList;
      });
      
      const session = localStorage.getItem('user');
      if (session) {
        const user = JSON.parse(session);
        try {
          await supabase.from('wishlists').delete().match({
            user_id: user.id,
            product_id: product.id
          });
        } catch (err) {}
      }
    } else {
      setWishlist((prevWishlist) => {
        const newList = [...prevWishlist, product];
        localStorage.setItem('wishlist', JSON.stringify(newList));
        return newList;
      });

      const session = localStorage.getItem('user');
      if (session) {
        const user = JSON.parse(session);
        try {
          await supabase.from('wishlists').insert({
            user_id: user.id,
            product_id: product.id
          });
        } catch (err) {}
      }
    }
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSubscribeNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSubscribed(false), 3500);
    }
  };

  // Simulated seller upload state / triggers
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [uploadedTitle, setUploadedTitle] = useState("");
  const [uploadedPrice, setUploadedPrice] = useState("");
  const [uploadedCat, setUploadedCat] = useState("T-Shirt");
  const [uploadedThumb, setUploadedThumb] = useState("");

  const handleUploadProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedTitle.trim() && uploadedPrice.trim()) {
      const genericThumb =
        uploadedThumb.trim() ||
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=80";
      const newProd: Product = {
        id: "uploaded-" + Date.now(),
        title: uploadedTitle,
        category: uploadedCat,
        thumbnail: genericThumb,
        price: parseInt(uploadedPrice) || 1200,
        oldPrice: (parseInt(uploadedPrice) || 1200) + 400,
        discountBadge: "New Seller Promo",
        rating: 4.5,
        reviewCount: 1,
        storeName: "Self Uploaded Store",
        storeId: "store-4",
        stock: 5,
        isNew: true,
      };

      setActiveProductList([newProd, ...activeProductList]);
      setUploadedTitle("");
      setUploadedPrice("");
      setSellerModalOpen(false);
      alert(
        `Success! "${newProd.title}" is now added live onto the multi-vendor listing grid.`,
      );
    }
  };

  // Categorize products dictionary for structured grids
  const tshirts = filteredProducts.filter((p) => p.category === "T-Shirt");
  const laptops = filteredProducts.filter(
    (p) => p.category === "Laptop & Notebooks" || p.category === "Laptop",
  );
  const appliances = filteredProducts.filter(
    (p) => p.category === "Home Appliance",
  );
  const desktops = filteredProducts.filter((p) => p.category === "Desktop PC" || p.category === "Desktop");
  const security = filteredProducts.filter(
    (p) => p.category === "Security Surveillance",
  );

  const restProducts = filteredProducts.filter(
    (p) =>
      p.category !== "T-Shirt" &&
      p.category !== "Laptop & Notebooks" &&
      p.category !== "Home Appliance" &&
      p.category !== "Desktop PC" &&
      p.category !== "Security Surveillance",
  );

  const RenderSectionBanners = ({ categoryName }: { categoryName: string }) => {
    const banners = dbBanners.filter(b => 
      b.placement_category_id && 
      (categoryName.includes(b.placement_category_id) || b.placement_category_id.includes(categoryName)) && 
      (b.banner_type === "Section Banner (Full Width)" || b.banner_type === "Section Banner (Half Width)")
    );
    if (banners.length === 0) return null;

    const isSingle = banners.length === 1;

    return (
      <div className={`grid ${isSingle ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 gap-4 mt-6 mb-2 px-4 sm:px-6 lg:px-8`}>
        {banners.map(b => (
          <div 
            key={b.id} 
            onClick={() => b.target_url && window.open(b.target_url, "_blank")}
            className={`group rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition ${b.banner_type === 'Section Banner (Full Width)' ? 'md:col-span-2' : 'col-span-1'}`}
          >
            <img src={b.image_url} alt="Section Banner" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ))}
      </div>
    );
  };

  const popupBanner = dbBanners.find((b: any) => b.banner_type === "Popup Banner");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* 1. HEADER SECTION (Upper bar + Search block + Horizontal nav list + Seller Hub modal launcher) */}
      <Header
        cart={cart}
        wishlist={wishlist}
        onSearch={handleSearch}
        onSelectCategory={handleSelectCategory}
        activeCategory={activeCategory}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onAddProductClick={() => setSellerModalOpen(true)}
        allProducts={activeProductList}
      />

      <Routes>
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />
        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cart}
              setCart={setCart}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onClearCart={handleClearCart}
            />
          }
        />
        <Route
          path="/product/:slug"
          element={
            <ProductPageWrapper
              allProducts={activeProductList}
              onAddToCart={handleAddToCart}
              onAddWishlist={handleAddWishlist}
              onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
              wishlist={wishlist}
            />
          }
        />
        <Route
          path="/store/:id"
          element={
            <StorePage
              allProducts={activeProductList}
              onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
              onQuickView={setQuickViewProduct}
            />
          }
        />

        <Route
          path="/flash-deals"
          element={
            <FlashDealsPage
              allProducts={activeProductList}
              onAddToCart={handleAddToCart}
              onAddWishlist={handleAddWishlist}
              onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
              onQuickView={setQuickViewProduct}
              wishlist={wishlist}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchPage
              allProducts={activeProductList}
              onAddToCart={handleAddToCart}
              onAddWishlist={handleAddWishlist}
              onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
              onQuickView={setQuickViewProduct}
              wishlist={wishlist}
            />
          }
        />
        <Route
          path="/brand/:brandName"
          element={
            <BrandPage
              allProducts={activeProductList}
              onAddToCart={handleAddToCart}
              onAddWishlist={handleAddWishlist}
              onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
              onQuickView={setQuickViewProduct}
              wishlist={wishlist}
            />
          }
        />
        <Route
          path="/"
          element={
            <React.Fragment>


              {/* 2. HERO SECTION & BADGES (Sidebar navigation, slide carousel, promo banners and trust symbols) */}
              <Hero
                onSelectCategory={handleSelectCategory}
                activeCategory={activeCategory}
                products={activeProductList}
              />

              {/* MAIN SCREEN MULTI-GRID WRAPPER */}
              <main className="w-full mx-auto px-0 py-8 flex-1 space-y-12">
                {/* Dynamic Category Filter Alert Bar */}
                {activeCategory && (
                  <div className="px-4 sm:px-6 lg:px-8 w-full mx-auto">
                    <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                      <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">
                        Filtering active products
                      </p>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">
                        {`Category: "${activeCategory}"`}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        handleSelectCategory("");
                      }}
                      className="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition"
                    >
                      Reset Filters
                    </button>
                    </div>
                  </div>
                )}

                {/* DYNAMIC HOMEPAGE BLOCKS FROM ADMIN PANEL */}
                {dbHomeLayouts && dbHomeLayouts.length > 0 ? (
                  dbHomeLayouts.map((layout) => {
                    if (layout.section_type === 'flash_deals') {
                      return (
                        <FeaturedDeals
                          key={layout.id}
                          products={activeProductList}
                          onAddToCart={handleAddToCart}
                          onAddWishlist={handleAddWishlist}
                          onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
                          onQuickView={setQuickViewProduct}
                          wishlist={wishlist}
                          layoutConfig={layout.settings}
                        />
                      );
                    }
                    if (layout.section_type === 'category_slider') {
                      const targetCatId = layout.settings?.target_category || '';
                      
                      const catProducts = targetCatId
                        ? activeProductList.filter((p) => {
                            if (targetCatId.startsWith('subsub_')) {
                              return String(p.sub_sub_category_id || '').split(',').includes(targetCatId.replace('subsub_', ''));
                            } else if (targetCatId.startsWith('sub_')) {
                              return String(p.sub_category_id) === targetCatId.replace('sub_', '');
                            } else if (targetCatId.startsWith('cat_')) {
                              return String(p.category_id) === targetCatId.replace('cat_', '');
                            } else {
                              // Fallback for older data
                              return String(p.category_id) === String(targetCatId);
                            }
                          })
                        : activeProductList;
                        
                      let targetCategoryName = layout.settings?.title || "";
                      let targetCategorySlug = "";
                      
                      if (targetCatId.startsWith('subsub_')) {
                        const id = targetCatId.replace('subsub_', '');
                        const match = dbSubSubCategories.find(c => String(c.id) === id);
                        if (match) {
                          targetCategoryName = match.name || targetCategoryName;
                          const subSubSlug = match.slug || generateSlug(match.name);
                          
                          const subMatch = dbSubCategories.find(c => String(c.id) === String(match.sub_category_id));
                          let subSlug = '';
                          let catSlug = '';
                          
                          if (subMatch) {
                            subSlug = subMatch.slug || generateSlug(subMatch.name);
                            const catMatch = dbCategories.find(c => String(c.id) === String(subMatch.category_id));
                            if (catMatch) {
                              catSlug = catMatch.slug || generateSlug(catMatch.name);
                            }
                          }
                          
                          targetCategorySlug = [catSlug, subSlug, subSubSlug].filter(Boolean).join('/');
                        }
                      } else if (targetCatId.startsWith('sub_')) {
                        const id = targetCatId.replace('sub_', '');
                        const match = dbSubCategories.find(c => String(c.id) === id);
                        if (match) {
                          targetCategoryName = match.name || targetCategoryName;
                          const subSlug = match.slug || generateSlug(match.name);
                          
                          let catSlug = '';
                          const catMatch = dbCategories.find(c => String(c.id) === String(match.category_id));
                          if (catMatch) {
                            catSlug = catMatch.slug || generateSlug(catMatch.name);
                          }
                          
                          targetCategorySlug = [catSlug, subSlug].filter(Boolean).join('/');
                        }
                      } else if (targetCatId.startsWith('cat_')) {
                        const id = targetCatId.replace('cat_', '');
                        const match = dbCategories.find(c => String(c.id) === id);
                        if (match) {
                          targetCategoryName = match.name || targetCategoryName;
                          targetCategorySlug = match.slug || generateSlug(match.name);
                        }
                      } else if (targetCatId) {
                        const match = dbCategories.find(c => String(c.id) === String(targetCatId));
                        if (match) {
                          targetCategoryName = match.name || targetCategoryName;
                          targetCategorySlug = match.slug || generateSlug(match.name);
                        }
                      }

                      return (
                        <React.Fragment key={layout.id}>
                          <CategorySlider
                            title={layout.settings?.title || "Category"}
                            categorySlug={targetCategorySlug}
                            indicatorColor="bg-blue-500"
                            products={catProducts}
                            onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
                              onAddToCart={handleAddToCart}
                              onAddWishlist={handleAddWishlist}
                              onQuickView={setQuickViewProduct}
                              wishlist={wishlist}
                            layoutConfig={layout.settings}
                          />
                          <RenderSectionBanners categoryName={targetCategoryName} />
                        </React.Fragment>
                      );
                    }
                    if (layout.section_type === 'vendors') {
                      return (
                        <React.Fragment key={layout.id}>
                          {/* TOP BRANDS */}
                          {dbBrands.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs text-center w-full mb-6">
                              <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200">
                                <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5 font-sans">
                                  <BadgeInfo className="w-3.5 h-3.5 text-brand-500" />
                                  Top Brands
                                </h3>
                                <span className="text-[9px] text-slate-400 font-mono font-sans">{dbBrands.length} Brands</span>
                              </div>
                              <div className="relative overflow-hidden w-full group/slider rounded">
                                <div className="flex gap-4 items-center justify-start py-1 px-1 w-max animate-marquee hover:[animation-play-state:paused]">
                                  {[...dbBrands, ...dbBrands].map((brand, idx) => (
                                    <div 
                                      key={`${brand.id || ''}_${idx}`}
                                      onClick={() => {
                                        navigate(`/brand/${encodeURIComponent(brand.name)}`);
                                      }}
                                      className="w-[120px] flex-shrink-0 p-3 bg-slate-50 hover:bg-white rounded border border-slate-200 hover:border-brand-500 transition text-center shadow-xs cursor-pointer group flex flex-col items-center justify-center min-h-[96px]"
                                    >
                                      {brand.logo_url ? (
                                        <img 
                                          src={brand.logo_url} 
                                          alt={brand.name} 
                                          className="h-10 w-10 rounded-full object-cover mb-2 border border-slate-100 group-hover:scale-105 transition-transform" 
                                        />
                                      ) : (
                                        <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs mb-2">
                                          {brand.name?.slice(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="text-[10px] font-black text-slate-700 tracking-tight line-clamp-1 group-hover:text-brand-500 transition-colors w-full font-sans">
                                        {brand.name}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {dbSellers.length > 0 && (
                            <div id="vendors-sec" className="bg-white border border-slate-200 rounded p-4 shadow-xs text-center w-full">
                              <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200">
                                <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5 font-sans">
                                  <Store className="w-3.5 h-3.5 text-brand-500" />
                                  Verified Shop Partners (Vendors)
                                </h3>
                                <span className="text-[9px] text-slate-400 font-mono font-sans">{dbSellers.length} Active Stores</span>
                              </div>

                              <div className="relative overflow-hidden w-full group/slider rounded">
                                <div className="flex gap-4 items-center justify-start overflow-x-auto scroll-smooth py-1 px-1 custom-scrollbar">
                                  {dbSellers.map((seller, idx) => (
                                    <div 
                                      key={seller.id || idx}
                                      onClick={() => {
                                        const slug = seller.shop_name
                                          ? seller.shop_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                                          : seller.id;
                                        navigate(`/store/${slug}`);
                                      }}
                                      className="w-[120px] flex-shrink-0 p-3 bg-slate-50 hover:bg-white rounded border border-slate-200 hover:border-brand-500 transition text-center shadow-xs cursor-pointer group flex flex-col items-center justify-center min-h-[96px]"
                                    >
                                      {seller.shop_logo_url ? (
                                        <img 
                                          src={seller.shop_logo_url} 
                                          alt={seller.shop_name} 
                                          className="h-10 w-10 rounded-full object-cover mb-2 border border-slate-100 group-hover:scale-105 transition-transform" 
                                        />
                                      ) : (
                                        <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs mb-2">
                                          {seller.shop_name?.slice(0, 2).toUpperCase() || "SH"}
                                        </div>
                                      )}
                                      <div className="text-[10px] font-black text-slate-700 tracking-tight line-clamp-1 group-hover:text-brand-500 transition-colors w-full font-sans">
                                        {seller.shop_name}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    }
                    return null;
                  })
                ) : (
                  <React.Fragment>
                    {/* Fallback Static Sections if Table Missing or Empty */}

                    <CategorySlider
                      title="Desktop"
                      categorySlug="desktop"
                      indicatorColor="bg-emerald-500"
                      products={activeProductList.filter((p) => p.category?.toLowerCase() === "desktop")}
                      onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
                              onAddToCart={handleAddToCart}
                              onAddWishlist={handleAddWishlist}
                              onQuickView={setQuickViewProduct}
                              wishlist={wishlist}
                    />
                    <RenderSectionBanners categoryName="Desktop" />

                    <CategorySlider
                      title="Laptop"
                      categorySlug="laptop"
                      indicatorColor="bg-indigo-600"
                      products={activeProductList.filter((p) => p.category?.toLowerCase() === "laptop")}
                      onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
                              onAddToCart={handleAddToCart}
                              onAddWishlist={handleAddWishlist}
                              onQuickView={setQuickViewProduct}
                              wishlist={wishlist}
                    />
                    <RenderSectionBanners categoryName="Laptop" />

                    <CategorySlider
                      title="Component"
                      categorySlug="component"
                      indicatorColor="bg-rose-500"
                      products={activeProductList.filter((p) => p.category?.toLowerCase() === "component")}
                      onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
                              onAddToCart={handleAddToCart}
                              onAddWishlist={handleAddWishlist}
                              onQuickView={setQuickViewProduct}
                              wishlist={wishlist}
                    />
                    <RenderSectionBanners categoryName="Component" />

                    {/* TOP BRANDS */}
                    {dbBrands.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs text-center w-full mb-6">
                        <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200">
                          <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5 font-sans">
                            <BadgeInfo className="w-3.5 h-3.5 text-brand-500" />
                            Top Brands
                          </h3>
                          <span className="text-[9px] text-slate-400 font-mono font-sans">{dbBrands.length} Brands</span>
                        </div>
                        <div className="relative overflow-hidden w-full group/slider rounded">
                          <div className="flex gap-4 items-center justify-start py-1 px-1 w-max animate-marquee hover:[animation-play-state:paused]">
                            {[...dbBrands, ...dbBrands].map((brand, idx) => (
                              <div 
                                key={`${brand.id || ''}_${idx}`}
                                onClick={() => {
                                  navigate(`/brand/${encodeURIComponent(brand.name)}`);
                                }}
                                className="w-[120px] flex-shrink-0 p-3 bg-slate-50 hover:bg-white rounded border border-slate-200 hover:border-brand-500 transition text-center shadow-xs cursor-pointer group flex flex-col items-center justify-center min-h-[96px]"
                              >
                                {brand.logo_url ? (
                                  <img 
                                    src={brand.logo_url} 
                                    alt={brand.name} 
                                    className="h-10 w-10 rounded-full object-cover mb-2 border border-slate-100 group-hover:scale-105 transition-transform" 
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs mb-2">
                                    {brand.name?.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="text-[10px] font-black text-slate-700 tracking-tight line-clamp-1 group-hover:text-brand-500 transition-colors w-full font-sans">
                                  {brand.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {dbSellers.length > 0 && (
                      <div id="vendors-sec" className="bg-white border border-slate-200 rounded p-4 shadow-xs text-center">
                        <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200">
                          <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5 font-sans">
                            <Store className="w-3.5 h-3.5 text-brand-500" />
                            Verified Shop Partners (Vendors)
                          </h3>
                          <span className="text-[9px] text-slate-400 font-mono font-sans">{dbSellers.length} Active Stores</span>
                        </div>

                        <div className="relative overflow-hidden w-full group/slider rounded">
                          <div className="flex gap-4 items-center justify-start overflow-x-auto scroll-smooth py-1 px-1 custom-scrollbar">
                            {dbSellers.map((seller, idx) => (
                              <div 
                                key={seller.id || idx}
                                onClick={() => {
                                  const slug = seller.shop_name
                                    ? seller.shop_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                                    : seller.id;
                                  navigate(`/store/${slug}`);
                                }}
                                className="w-[120px] flex-shrink-0 p-3 bg-slate-50 hover:bg-white rounded border border-slate-200 hover:border-brand-500 transition text-center shadow-xs cursor-pointer group flex flex-col items-center justify-center min-h-[96px]"
                              >
                                {seller.shop_logo_url ? (
                                  <img 
                                    src={seller.shop_logo_url} 
                                    alt={seller.shop_name} 
                                    className="h-10 w-10 rounded-full object-cover mb-2 border border-slate-100 group-hover:scale-105 transition-transform" 
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs mb-2">
                                    {seller.shop_name?.slice(0, 2).toUpperCase() || "SH"}
                                  </div>
                                )}
                                <div className="text-[10px] font-black text-slate-700 tracking-tight line-clamp-1 group-hover:text-brand-500 transition-colors w-full font-sans">
                                  {seller.shop_name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                )}


              </main>

              {/* Popup Banner Modal */}
              {showPopupBanner && popupBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                  <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
                    <button 
                      onClick={() => setShowPopupBanner(false)}
                      className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full transition z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <img 
                      src={popupBanner.image_url} 
                      alt="Special Offer" 
                      className="w-full h-auto cursor-pointer object-cover"
                      onClick={() => {
                        if (popupBanner.target_url) {
                          window.open(popupBanner.target_url, "_blank");
                        }
                        setShowPopupBanner(false);
                      }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/customer-signup" element={<CustomerSignUp />} />
        <Route path="/seller-signup" element={<SellerSignUp />} />
        <Route path="/my-account" element={<MyAccount wishlist={wishlist} setWishlist={setWishlist} />} />
        <Route
          path="/:catSlug/:subCatSlug?/:subSubCatSlug?"
          element={
            <CategoryPage
              allProducts={activeProductList}
              onAddToCart={handleAddToCart}
              onAddWishlist={handleAddWishlist}
              onSelectProduct={(p: Product) => navigate(`/product/${p.slug}`)}
              onQuickView={setQuickViewProduct}
              wishlist={wishlist}
              categories={dbCategories}
              subCategories={dbSubCategories}
              subSubCategories={dbSubSubCategories}
            />
          }
        />
      </Routes>

      {/* FOOTER STRUCTURE */}
      <footer className="w-full bg-[#737373] text-white py-12 px-0 shadow-sm font-sans">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-8 pb-8">
            {/* Column 1: Logo and Contact/Address Info */}
            <div className="space-y-6">
              <div className="inline-block py-2">
                 <img src="https://ik.imagekit.io/eg7u6xcn0u/HolidayMart-logo-wide.png" alt="HolidayMart" className="h-[34px] w-auto object-contain" />
              </div>
              
              <div className="space-y-4 text-xs text-white">
                <div>
                  <h4 className="text-brand-500 font-bold text-[11px] uppercase tracking-wider mb-2">Start a conversation</h4>
                  <div className="space-y-2 font-medium text-white/90">
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-brand-500 shrink-0" /> +8801700000000</div>
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-brand-500 shrink-0" /> holidaymartbd@gmail.com</div>
                    <div className="flex items-center gap-2"><Ticket className="w-3.5 h-3.5 text-brand-500 shrink-0" /> Support Ticket</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-brand-500 font-bold text-[11px] uppercase tracking-wider mb-2">Address</h4>
                  <div className="flex items-center gap-2 font-medium text-white/90"><MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" /> House 11 Rd 3A, Dhaka 1230</div>
                </div>
              </div>
            </div>

            {/* Column 2: SPECIAL */}
            <div>
              <h4 className="text-brand-500 font-bold text-xs uppercase tracking-wider mb-4">SPECIAL</h4>
              <ul className="space-y-2.5 text-[12px] text-white">
                <li><a href="#" className="hover:text-brand-400 transition">Flash Deal</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Featured Products</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Latest Products</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Best Selling Products</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Top Rated Products</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-brand-400 transition">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Column 3: ACCOUNT & SHIPPING INFO */}
            <div>
              <h4 className="text-brand-500 font-bold text-xs uppercase tracking-wider mb-4">ACCOUNT & SHIPPING INFO</h4>
              <ul className="space-y-2.5 text-[12px] text-white">
                <li><Link to="/my-account" className="hover:text-brand-400 transition">Profile Info</Link></li>
                <li><Link to="/my-account?tab=wishlist" className="hover:text-brand-400 transition">Wish List</Link></li>
                <li><Link to="/track-order" className="hover:text-brand-400 transition">Track Order</Link></li>
                <li><Link to="/refund-policy" className="hover:text-brand-400 transition">Refund Policy</Link></li>
                <li><Link to="/return-policy" className="hover:text-brand-400 transition">Return Policy</Link></li>
                <li><Link to="/cancellation-policy" className="hover:text-brand-400 transition">Cancellation Policy</Link></li>
                <li className="md:hidden"><a href="#" className="hover:text-brand-400 transition">Terms & Conditions</a></li>
                <li className="md:hidden"><a href="#" className="hover:text-brand-400 transition">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Column 4: NEWSLETTER & FOLLOW US */}
            <div>
              <h4 className="text-brand-500 font-bold text-xs uppercase tracking-wider mb-4">NEWSLETTER</h4>
              <p className="text-[11px] text-white mb-3">Subscribe to our new channel to get latest updates</p>
              <form className="relative mb-6" onSubmit={handleSubscribeNewsletter}>
                 <input type="email" placeholder="Your Email Address" className="w-full bg-white rounded-full py-2.5 px-4 text-xs text-slate-800 outline-none pr-24" />
                 <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-500 text-xs font-bold hover:text-brand-600">Subscribe</button>
              </form>

              <h4 className="text-brand-500 font-bold text-xs uppercase tracking-wider mb-4">FOLLOW US</h4>
              <div className="flex gap-2">
                 <a href="#" className="w-8 h-8 rounded-full bg-[#8c8c8c] flex items-center justify-center hover:bg-brand-500 transition">
                   <Twitter className="w-4 h-4 text-white" />
                 </a>
                 <a href="#" className="w-8 h-8 rounded-full bg-[#8c8c8c] flex items-center justify-center hover:bg-brand-500 transition">
                   <Linkedin className="w-4 h-4 text-white" />
                 </a>
                 <a href="#" className="w-8 h-8 rounded-full bg-[#8c8c8c] flex items-center justify-center hover:bg-brand-500 transition">
                   <Instagram className="w-4 h-4 text-white" />
                 </a>
                 <a href="#" className="w-8 h-8 rounded-full bg-[#8c8c8c] flex items-center justify-center hover:bg-brand-500 transition">
                   <Facebook className="w-4 h-4 text-white" />
                 </a>
              </div>
            </div>
          </div>

          {/* Bottom separator */}
          <div className="border-t border-white/20 mt-4"></div>

          {/* Very Bottom */}
          <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-[11px] text-white/70 gap-2">
            <p>
              © Holiday Mart - All rights reserved. Developed by:{" "}
              <a 
                href="https://shakilmahmud.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-brand-500 text-white font-semibold transition duration-200"
              >
                Shakil Mahmud
              </a>
            </p>
            <div className="hidden md:flex gap-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-white transition">Terms & Conditions</a>
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* QUICK VIEW DYNAMIC MODAL BOX */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          onAddWishlist={handleAddWishlist}
          wishlist={wishlist}
        />
      )}

      {/* MODAL FOR SIMULATED SELLER PRODUCT UPLOAD (CRITICAL DEMONSTRATION OF MULTI-VENDOR ARCHITECTURE) */}
      {sellerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setSellerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2 text-brand-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-950">
                Simulate Multi-Vendor Upload
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                Insert a mock product payload into the database pipeline so it
                immediately populates the live UI listing grids below.
              </p>
            </div>

            <form
              onSubmit={handleUploadProduct}
              className="space-y-4 text-xs font-semibold text-slate-700"
            >
              <div>
                <label className="block mb-1">Proposed Product name</label>
                <input
                  type="text"
                  required
                  value={uploadedTitle}
                  onChange={(e) => setUploadedTitle(e.target.value)}
                  placeholder="e.g. Intel Core i9 Extreme LGA1851 Alder Lake"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={uploadedPrice}
                    onChange={(e) => setUploadedPrice(e.target.value)}
                    placeholder="e.g. 52000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block mb-1">Target Category</label>
                  <select
                    value={uploadedCat}
                    onChange={(e) => setUploadedCat(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Laptop & Notebooks">Laptop</option>
                    <option value="Home Appliance">Home Appliance</option>
                    <option value="Desktop PC">Desktop PC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">
                  Thumbnail image URL (Optional)
                </label>
                <input
                  type="text"
                  value={uploadedThumb}
                  onChange={(e) => setUploadedThumb(e.target.value)}
                  placeholder="Paste direct HTTPS link, or leave empty default"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 font-black py-2.5 rounded-xl transition mt-2"
              >
                Upload & Pipeline Into Grid
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// SUBLAYOUT: REUSABLE PRODUCT CARD
interface ProductCardProps {
  key?: any;
  product: Product;
  onAddToCart: (p: Product) => void;
  onAddWishlist: (p: Product) => void;
  onQuickView: (p: Product) => void;
  onSelectProduct?: (p: Product) => void;
  wishlist?: Product[];
}

export function ProductCard({
  product,
  onAddToCart,
  onAddWishlist,
  onQuickView,
  onSelectProduct,
  wishlist,
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [product.thumbnail, ...(product.galleryImages || [])].filter(Boolean);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock === 0 || isAdding) return;
    
    setIsAdding(true);
    onAddToCart(product);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  // Check if out of stock
  const isOutOfStock = product.stock === 0;

  const isWishlisted = wishlist 
    ? wishlist.some((item) => String(item.id) === String(product.id))
    : (() => {
        const saved = localStorage.getItem("wishlist");
        if (!saved) return false;
        try {
          const list = JSON.parse(saved);
          return Array.isArray(list) && list.some((item: any) => String(item.id) === String(product.id));
        } catch (e) {
          return false;
        }
      })();

  return (
    <div 
      className="group bg-white flex flex-col justify-between h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top action details / discount ribbon */}
      {product.discountBadge && (
        <span className="absolute top-2 left-2 bg-brand-600 text-white font-mono font-black text-[9px] px-2.5 py-0.5 rounded shadow-sm z-10 animate-pulse">
          {product.discountBadge}
        </span>
      )}

      {/* Dynamic image panel */}
      <div
        className="relative aspect-square rounded overflow-hidden mb-3 bg-white flex items-center justify-center border border-slate-100 select-none cursor-pointer"
        onClick={() => onSelectProduct?.(product)}
      >
        {images.map((imgUrl, index) => (
          <img
            key={index}
            src={imgUrl}
            alt={product.title}
            className={`absolute inset-0 p-2 w-full h-full object-contain group-hover:scale-105 transition-opacity duration-500 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Gray overlay on Out of Stock items */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 z-10">
            <span className="bg-red-650 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover activation utilities */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddWishlist(product);
            }}
            className={`p-1.5 rounded-full transition shadow cursor-pointer ${
              isWishlisted
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "bg-white/90 text-slate-800 hover:bg-brand-500 hover:text-white"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-1.5 bg-white/90 rounded-full text-slate-800 hover:bg-brand-500 hover:text-white transition shadow cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Details container */}
      <div className="px-2.5 pb-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor identification brand tag */}
          <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide inline-block mb-1">
            Store: {product.storeName}
          </span>
          <h4
            className="text-[13px] font-black text-slate-850 line-clamp-2 hover:text-brand-600 transition min-h-[30px] leading-tight cursor-pointer"
            onClick={() => onSelectProduct?.(product)}
          >
            {product.title}
          </h4>

          {/* stars ranking */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[...Array(5)].map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-3 h-3 ${idx < Math.floor(product.rating) ? "text-[#ffc107] fill-[#ffc107]" : "text-slate-200 fill-slate-200"}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500">
                ({product.reviewCount})
              </span>
            </div>
          )}
        </div>

        {/* Price & Cart CTA action row */}
        <div className="mt-3.5 pt-2 border-t border-slate-50 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[15px] font-black text-slate-900 leading-none">
              ৳{product.price.toLocaleString()}
            </p>
            {product.oldPrice && (
              <p className="text-xs text-slate-400 line-through mt-0.5">
                ৳{product.oldPrice.toLocaleString()}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddClick}
            className={`p-1.5 mr-1 rounded-lg transition-all duration-300 transform active:scale-90 ${
              isOutOfStock
                ? "bg-slate-100 text-slate-350 cursor-not-allowed"
                : isAdding
                  ? "bg-green-500 text-white scale-110 shadow-lg"
                  : "bg-brand-50 hover:bg-brand-500 text-brand-500 hover:text-white hover:shadow-md cursor-pointer"
            }`}
          >
            {isAdding ? (
              <CheckCircle className="w-3.5 h-3.5 animate-bounce" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const stripHtml = (html: string) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, q: number) => void;
  onAddWishlist: (p: Product) => void;
  wishlist: Product[];
}

export function QuickViewModal({ product, onClose, onAddToCart, onAddWishlist, wishlist }: QuickViewModalProps) {
  const navigate = useNavigate();
  const isOutOfStock = product.stock === 0;
  const [qty, setQty] = useState(1);
  const isWishlisted = wishlist.some((item) => String(item.id) === String(product.id));

  const rawDescription = product.shortDescription || product.description || "";
  const cleanDescription = stripHtml(rawDescription);
  const displayDescription = cleanDescription
    ? (cleanDescription.length > 180 
        ? cleanDescription.substring(0, 180).trim() + "..." 
        : cleanDescription)
    : `Premium quality ${product.title} supplied directly by registered ${product.storeName || "HolidayMart"} vendor. Quality audited, 100% genuine guaranteed with official manufacturer warranty support.`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn animate-duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-slate-800 flex flex-col md:flex-row animate-scaleUp max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-500 transition-colors w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer"
        >
          ✕
        </button>

        {/* Left Column - Image Section */}
        <div className="w-full md:w-1/2 bg-slate-50 flex items-center justify-center p-6 relative border-r border-slate-100 min-h-[250px] md:min-h-[400px]">
          {/* Discount Badge */}
          {product.discountBadge && (
            <span className="absolute top-4 left-4 bg-brand-600 text-white font-mono font-black text-[10px] px-2.5 py-1 rounded shadow-sm z-10 animate-pulse">
              {product.discountBadge}
            </span>
          )}
          <img
            src={product.thumbnail}
            alt={product.title}
            className="max-w-full max-h-[300px] object-contain mix-blend-multiply hover:scale-102 transition duration-300 select-none"
          />
        </div>

        {/* Right Column - Product Info */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            {/* Category & Store tags */}
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <span className="text-[9px] font-black tracking-widest text-brand-500 uppercase bg-brand-50 px-2.5 py-1 rounded-sm">
                {product.category}
              </span>
              <span className="text-[9px] font-extrabold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                Store: {product.storeName || "In-House"}
              </span>
            </div>

            {/* Product Title */}
            <h3 
              onClick={() => {
                navigate(`/product/${product.slug}`);
                onClose();
              }}
              className="text-base sm:text-lg font-black text-slate-900 leading-snug hover:text-brand-500 transition cursor-pointer"
            >
              {product.title}
            </h3>

            {/* Rating Section */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mt-2 mb-3">
                <div className="flex">
                  {[...Array(5)].map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-3.5 h-3.5 ${idx < Math.floor(product.rating) ? "text-[#ffc107] fill-[#ffc107]" : "text-slate-200 fill-slate-200"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {/* Stock Status Badge */}
            <div className="mt-3">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                  Out of Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  In Stock
                </span>
              )}
            </div>

            {/* Short description or generic specs */}
            <p className="text-xs text-slate-500 mt-4 leading-relaxed line-clamp-4">
              {displayDescription}
            </p>

            {/* Key Features if present */}
            {product.keyFeatures && product.keyFeatures.length > 0 && (
              <ul className="mt-3 space-y-1">
                {product.keyFeatures.slice(0, 3).map((feat, i) => (
                  <li key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-brand-500 rounded-full"></span>
                    {feat}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Price and Action row */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
            {/* Pricing info */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-500">
                ৳{product.price.toLocaleString()}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ৳{product.oldPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Select Qty & Add to Cart */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50/50 p-1">
                  <button
                    type="button"
                    onClick={() => setQty(prev => Math.max(1, prev - 1))}
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-800 select-none">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(prev => Math.min(product.stock || 99, prev + 1))}
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer font-bold"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Add to Cart CTA */}
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(product, qty);
                  onClose();
                }}
                className={`flex-1 min-w-[140px] font-black px-6 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition ${
                  isOutOfStock
                    ? "bg-slate-100 text-slate-350 cursor-not-allowed border border-slate-200"
                    : "bg-brand-500 hover:bg-brand-600 text-white transition shadow-sm hover:shadow cursor-pointer"
                }`}
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => onAddWishlist(product)}
                className={`p-2.5 rounded-lg border transition shadow-xs cursor-pointer ${
                  isWishlisted
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:text-brand-500 hover:border-brand-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
              </button>
            </div>

            {/* View Details Link */}
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  navigate(`/product/${product.slug}`);
                  onClose();
                }}
                className="text-xs text-brand-550 hover:text-brand-500 font-bold hover:underline transition cursor-pointer"
              >
                View Full Product Details →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/landing/:slug" element={<ProductLanding />} />
          <Route path="/*" element={<StoreFront />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="suppliers" element={<SupplierList />} />
            <Route path="suppliers/create" element={<SupplierForm />} />
            <Route path="suppliers/edit/:id" element={<SupplierForm />} />
            <Route path="purchases" element={<PurchaseList />} />
            <Route path="purchases/create" element={<PurchaseForm />} />
            <Route path="purchases/edit/:id" element={<PurchaseForm />} />
            <Route path="purchases/challan/:id" element={<PurchaseChallan />} />
            <Route path="orders/details/:id" element={<OrderDetails />} />
            <Route path="orders/:status" element={<OrderList />} />
            <Route path="refunds" element={<RefundRequests />} />
            <Route path="pos" element={<POS />} />
            <Route path="categories" element={<CategorySetup />} />
            <Route path="categories/edit/:id" element={<CategorySetup />} />
            <Route path="sub-categories" element={<SubCategorySetup />} />
            <Route
              path="sub-categories/edit/:id"
              element={<SubCategorySetup />}
            />
            <Route
              path="sub-sub-categories"
              element={<SubSubCategorySetup />}
            />
            <Route
              path="sub-sub-categories/edit/:id"
              element={<SubSubCategorySetup />}
            />
            <Route path="brands/add" element={<BrandSetup />} />
            <Route path="brands/edit/:id" element={<BrandSetup />} />
            <Route path="brands/list" element={<BrandList />} />
            <Route path="product-attributes" element={<ProductAttributes />} />
            <Route
              path="product-attributes/edit/:id"
              element={<UpdateAttribute />}
            />
            <Route
              path="in-house-products/list"
              element={<InHouseProductList />}
            />
            <Route
              path="in-house-products/add"
              element={<AddInHouseProduct />}
            />
            <Route
              path="in-house-products/edit/:id"
              element={<AddInHouseProduct />}
            />
            <Route
              path="in-house-products/barcode/:id"
              element={<GenerateBarcode />}
            />
            <Route
              path="seller-products/:status"
              element={<SellerProducts />}
            />
            <Route path="sellers" element={<SellerList />} />
            <Route path="sellers/:id" element={<SellerDetails />} />
            <Route path="customers/list" element={<CustomerList />} />
            <Route path="customers/reviews" element={<CustomerReviews />} />
            <Route path="earning-reports" element={<EarningReports />} />
            <Route path="transaction-report" element={<TransactionReport />} />
            <Route path="gross-profit" element={<GrossProfitReport />} />
            <Route path="settings" element={<Settings />} />
            <Route path="messages" element={<Messages />} />
            <Route path="support-tickets" element={<SupportTickets />} />
            <Route path="banner-setup" element={<BannerSetup />} />
            <Route path="coupons" element={<CouponSetup />} />
            <Route path="flash-deals" element={<FlashDealSetup />} />
            <Route path="flash-deals/details/:id" element={<AdminFlashDealDetails />} />
            <Route path="shipping-methods" element={<ShippingMethodList />} />
            <Route path="home-layout" element={<HomeLayoutSetup />} />
          </Route>

          {/* Seller routes */}
          <Route path="/seller" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders/:status" element={<OrderList />} />
            <Route path="orders/details/:id" element={<OrderDetails />} />
            <Route path="products/list" element={<InHouseProductList />} />
            <Route path="products/add" element={<AddInHouseProduct />} />
            <Route path="products/edit/:id" element={<AddInHouseProduct />} />
            <Route path="customers/list" element={<CustomerList />} />
            <Route path="customers/reviews" element={<CustomerReviews />} />
            <Route path="refunds" element={<RefundRequests />} />
            <Route path="coupons" element={<SellerCouponSetup />} />
            <Route path="flash-deals/join" element={<FlashDealsJoin />} />
            <Route path="flash-deals" element={<FlashDeals />} />
            <Route path="settings" element={<Settings />} />
            <Route path="messages" element={<Messages />} />
            <Route path="support-tickets" element={<SupportTickets />} />
            <Route path="transaction-report" element={<SellerTransaction />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
// Force Vercel Deploy

