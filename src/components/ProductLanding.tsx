import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Star, ShieldCheck, RefreshCw, Lock } from 'lucide-react';

export default function ProductLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Form states
  const [shippingMethod, setShippingMethod] = useState('Inside Dhaka - ৳ 60.00');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState('0.0');
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('in_house_products')
        .select('*')
        .eq('slug', slug)
        .single();
        
      if (error) throw error;
      setProduct(data);
      
      // Fetch reviews
      if (data) {
        const { data: revs } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', data.id)
          .eq('status', 'Published');
          
        if (revs) {
          setReviews(revs);
          if (revs.length > 0) {
            setAvgRating((revs.reduce((acc, r) => acc + r.rating, 0) / revs.length).toFixed(1));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-red-500">Product not found</div>;

  const isOutOfStock = product.current_stock_qty === 0;
  const shippingCost = shippingMethod.includes('60.00') ? 60 : 120; // Simplified calculation
  const subtotal = product.unit_price * quantity;
  const total = subtotal + shippingCost;

  const formatCurrency = (num: number) => {
    return '৳' + Number(num).toLocaleString('en-IN');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE (Product Details + Overview) */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Product Images */}
                <div className="space-y-4">
                  <div className="aspect-square bg-blue-50/50 rounded-xl overflow-hidden flex items-center justify-center p-4">
                    {product.thumbnail_url ? (
                      <img src={product.thumbnail_url} alt={product.name_en} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 animate-pulse rounded-xl"></div>
                    )}
                  </div>
                  {/* Thumbnails */}
                  <div className="flex gap-2">
                     <div className="w-16 h-16 border-2 border-orange-500 rounded-lg p-1 cursor-pointer">
                        {product.thumbnail_url ? (
                          <img src={product.thumbnail_url} alt="thumb" className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                          <div className="w-full h-full bg-slate-200"></div>
                        )}
                     </div>
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">{product.name_en}</h1>
                  
                  <div className="flex items-center gap-3 mb-4">
                    {isOutOfStock ? (
                       <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Out of stock</span>
                    ) : (
                       <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">In stock</span>
                    )}
                    <div className="flex text-slate-300">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= Math.floor(parseFloat(avgRating)) ? 'text-amber-400 fill-amber-400' : 'fill-current'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">({avgRating}) {reviews.length} Reviews</span>
                  </div>

                  <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: product.short_desc_en || 'No description available.' }}></p>
                  
                  <div className="text-2xl font-bold text-slate-800 mb-6">
                    {formatCurrency(product.unit_price)}
                  </div>

                  {/* Quantity */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Quantity</p>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-orange-500 font-bold hover:bg-slate-50"
                      >-</button>
                      <input 
                        type="text" 
                        value={quantity} 
                        readOnly
                        className="w-12 h-8 border border-slate-200 rounded text-center text-sm font-semibold text-slate-700 outline-none"
                      />
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-orange-500 font-bold hover:bg-slate-50"
                      >+</button>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-700 mb-6">
                    Total Price : <span className="text-orange-500">{formatCurrency(subtotal)}</span> <span className="text-xs text-slate-500 font-normal">(Tax: ৳0)</span>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-full transition shadow-sm">
                      Buy Now
                    </button>
                    <button className="flex-1 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold py-3 rounded-full transition shadow-sm">
                      Add to Cart
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Overview / Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-center gap-2 mb-6">
                <button className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-medium shadow-sm">Overview</button>
                <button className="text-slate-600 hover:text-slate-900 px-6 py-2 rounded-full text-sm font-medium transition">Reviews</button>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed max-w-3xl mx-auto text-justify" dangerouslySetInnerHTML={{ __html: product.desc_en || 'No detailed overview available.' }}>
              </div>
            </div>

          </div>


          {/* RIGHT SIDE (Checkout Form) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24 border border-slate-150">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Checkout</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipping Address</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Full name" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    <input type="text" placeholder="Phone" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    <input type="text" placeholder="Address line" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    <input type="text" placeholder="City" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    <input type="text" placeholder="Postal code" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer pt-1">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      Billing address same as shipping
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Choose Shipping Method</h3>
                  <select 
                    value={shippingMethod}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option>Inside Dhaka - ৳60.00</option>
                    <option>Outside Dhaka - ৳120.00</option>
                  </select>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Payment Method</h3>
                  <div className="space-y-2">
                    <label className={`flex justify-between items-center px-4 py-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => setPaymentMethod('COD')}>
                      <span className="text-sm font-medium text-slate-700">Cash on Delivery</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">COD</span>
                    </label>
                    <label className={`flex justify-between items-center px-4 py-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'Bkash' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => setPaymentMethod('Bkash')}>
                      <span className="text-sm font-medium text-slate-700">Bkash</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">bkash</span>
                    </label>
                    <label className={`flex justify-between items-center px-4 py-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'SSL' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => setPaymentMethod('SSL')}>
                      <span className="text-sm font-medium text-slate-700">Ssl Commerz</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">ssl commerz</span>
                    </label>
                    <label className={`flex justify-between items-center px-4 py-3 border rounded-lg cursor-pointer transition ${paymentMethod === 'Paystation' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`} onClick={() => setPaymentMethod('Paystation')}>
                      <span className="text-sm font-medium text-slate-700">Paystation</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">paystation</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Order Note (Optional)</h3>
                  <textarea placeholder="Delivery instructions, etc." className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"></textarea>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery</span>
                      <span className="font-medium text-slate-800">{formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-800">Total</span>
                      <span className="font-bold text-slate-900 text-lg">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-[#f85c70] hover:bg-red-500 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg">
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features / Guarantees Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center flex flex-col items-center border border-slate-150">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Authentic Guarantee</h3>
            <p className="text-sm text-slate-500">Verified quality & craftsmanship from trusted sources</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center flex flex-col items-center border border-slate-150">
            <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-white mb-4 shadow-sm">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Free Exchange</h3>
            <p className="text-sm text-slate-500">7 days easy swap - no questions asked</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center flex flex-col items-center border border-slate-150">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white mb-4 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Secure Checkout</h3>
            <p className="text-sm text-slate-500">PCI compliant payments with encrypted transactions</p>
          </div>
        </div>

      </div>
    </div>
  );
}
