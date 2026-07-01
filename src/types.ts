export interface Product {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  subSubCategory?: string;
  thumbnail: string;
  price: number;
  oldPrice?: number;
  discountBadge?: string;
  rating: number;
  reviewCount: number;
  storeName: string;
  storeId: string;
  stock: number;
  isNew?: boolean;
  is_featured?: boolean;
  keyFeatures?: string[];
  shortDescription?: string;
  specifications?: Record<string, Record<string, string>>;
  description?: string;
  galleryImages?: string[];
  video_link?: string;
  brand?: string;
  productCode?: string;
  slug?: string;
  category_id?: string;
  sub_category_id?: string;
  sub_sub_category_id?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  subSubCategorySlug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  isFlashDeal?: boolean;
  attributes?: Record<string, string[]>;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  banner: string;
  rating: number;
  verified: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: string[];
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedVariation?: any;
}

