import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product, CartItem } from '../types';
import { ChevronRight, ChevronLeft, Minus, Plus, Trash2, CheckCircle, ShieldCheck, Truck, ShieldAlert } from 'lucide-react';
import { useToast } from '../components/ToastContext';

interface CheckoutProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onAddToCart: (p: Product) => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
}

export default function Checkout({ cart, setCart, onAddToCart, onRemoveFromCart, onClearCart }: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(false);
  const [validLoyaltyPointsRows, setValidLoyaltyPointsRows] = useState<any[]>([]);
  const [userOrderCount, setUserOrderCount] = useState<number>(0);

  useEffect(() => {
    const fetchCoupons = async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('status', true);
      if (!error && data) {
        setCoupons(data);
      }
    };
    fetchCoupons();
  }, []);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (user?.id) {
      const fetchLoyaltyBalance = async () => {
        const { data, error } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('customer_id', user.id)
          .gt('remaining_points', 0)
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: true });
          
        if (!error && data) {
          const balance = data.reduce((acc, row) => acc + (row.remaining_points || 0), 0);
          setLoyaltyBalance(balance);
          setValidLoyaltyPointsRows(data);
        }
      };
      fetchLoyaltyBalance();
    }
  }, [user?.id]);

  const [shippingInfo, setShippingInfo] = useState({
    addressType: 'Home',
    name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || '' : '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'Bangladesh',
    latitude: 0,
    longitude: 0
  });

  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [showOfflinePopup, setShowOfflinePopup] = useState(false);
  const [offlineMethod, setOfflineMethod] = useState('Bkash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<any>(null);
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  useEffect(() => {
    const fetchShippingMethods = async () => {
      const { data, error } = await supabase.from('shipping_methods').select('*').eq('status', true);
      if (!error && data) {
        setShippingMethods(data);
        if (data.length > 0) {
          setSelectedShippingMethod(data[0]);
        }
      }
    };
    
    const fetchAddresses = async () => {
      if (user?.id) {
        const { data, error } = await supabase.from('customer_addresses').select('*').eq('customer_id', user.id).order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setSavedAddresses(data);
          // Auto-fill the first address
          const firstAddr = data[0];
          setShippingInfo(prev => ({
            ...prev,
            addressType: firstAddr.address_type,
            name: firstAddr.contact_person_name || prev.name,
            phone: firstAddr.phone || prev.phone,
            address: firstAddr.address,
            city: firstAddr.city,
            zipCode: firstAddr.zip_code,
            country: firstAddr.country,
            latitude: firstAddr.latitude || 0,
            longitude: firstAddr.longitude || 0
          }));
        }
      }
    };
    const fetchOrderCount = async () => {
      if (user?.id) {
        const { count, error } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', user.id);
        if (!error && count !== null) {
          setUserOrderCount(count);
        }
      }
    };
    
    fetchShippingMethods();
    fetchAddresses();
    fetchOrderCount();
  }, [user?.id]);

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = item.selectedVariation?.price || item.product.price;
    const itemOldPrice = item.selectedVariation ? itemPrice : (item.product.oldPrice || item.product.price);
    const originalPrice = itemOldPrice > itemPrice ? itemOldPrice : itemPrice;
    return acc + (originalPrice * item.quantity);
  }, 0);

  const discount = cart.reduce((acc, item) => {
    const itemPrice = item.selectedVariation?.price || item.product.price;
    const itemOldPrice = item.selectedVariation ? itemPrice : (item.product.oldPrice || item.product.price);
    if (itemOldPrice > itemPrice) {
      return acc + ((itemOldPrice - itemPrice) * item.quantity);
    }
    return acc;
  }, 0);

  useEffect(() => {
    const hasFlashDeal = cart.some(item => item.product.isFlashDeal);

    if (cart.length === 0 || coupons.length === 0 || hasFlashDeal) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    const now = new Date();
    let bestCoupon = null;
    let maxDiscount = 0;

    coupons.forEach(c => {
      const start = new Date(c.start_date);
      const expire = new Date(c.expire_date);
      expire.setHours(23, 59, 59, 999);
      if (now < start || now > expire) return;
      if (c.coupon_type === 'First Order' && userOrderCount > 0) return;

      let applicableSubtotal = 0;

      cart.forEach(item => {
        const itemPrice = item.product.price;
        const storeId = item.product.storeId || 'admin';
        
        let applies = false;
        if (c.target_type === 'In-house') {
          if (storeId === 'admin') applies = true;
        } else if (c.target_type === 'Seller') {
          if (storeId === c.shop_id && c.seller_approval === 'Approved') applies = true;
        } else if (c.target_type === 'All Shops') {
          if (storeId === 'admin') applies = true;
          else if (c.coupon_type === 'First Order') applies = true;
          else if (c.approved_sellers?.includes(storeId)) applies = true;
        }

        if (applies) {
          applicableSubtotal += itemPrice * item.quantity;
        }
      });

      if (applicableSubtotal >= c.min_purchase) {
        let currentDiscount = 0;
        if (c.coupon_type === 'Free Delivery') {
          currentDiscount = shippingMethods.length > 0 ? Math.max(...shippingMethods.map(s => parseFloat(s.cost))) : 60;
        } else if (c.discount_type === 'Amount') {
          currentDiscount = Math.min(c.discount_amount, applicableSubtotal);
        } else if (c.discount_type === 'Percentage') {
          currentDiscount = Math.round(applicableSubtotal * (c.discount_amount / 100));
          if (c.max_discount_amount && currentDiscount > c.max_discount_amount) {
            currentDiscount = c.max_discount_amount;
          }
        }

        if (currentDiscount > maxDiscount) {
          maxDiscount = currentDiscount;
          bestCoupon = c;
        }
      }
    });

    setAppliedCoupon(bestCoupon);
    // If best coupon is Free Delivery, the actual coupon discount on product is 0
    setCouponDiscount(bestCoupon?.coupon_type === 'Free Delivery' ? 0 : maxDiscount);
  }, [cart, coupons, shippingMethods, userOrderCount]);

  const baseTotal = subtotal - discount - couponDiscount;
  
  let maxLoyaltyDiscount = 0;
  let loyaltyDiscountAmount = 0;
  
  if (loyaltyBalance >= 100) {
    maxLoyaltyDiscount = Math.min(loyaltyBalance, Math.floor(baseTotal * 0.50));
  }
  
  if (useLoyaltyPoints) {
    loyaltyDiscountAmount = maxLoyaltyDiscount;
  }
  
  const isFreeDelivery = appliedCoupon?.coupon_type === 'Free Delivery';
  const shippingCost = isFreeDelivery ? 0 : (selectedShippingMethod ? parseFloat(selectedShippingMethod.cost) : 0);
  const total = baseTotal - loyaltyDiscountAmount + shippingCost;

  const handleOfflinePaymentClick = (method: string) => {
    setOfflineMethod(method);
    setShowOfflinePopup(true);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      const items = cart.map(c => ({
        id: c.product.id,
        name: c.product.title,
        price: c.selectedVariation?.price || c.product.price,
        quantity: c.quantity,
        image: c.selectedVariation?.image || c.product.thumbnail,
        variation: c.selectedVariation || null
      }));
      
      const storeId = cart[0]?.product?.storeId || '';
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
      
      const generatedId = Math.random().toString(36).substring(2, 8).toLowerCase();

      let insertData = {
        id: generatedId,
        customer_id: user?.role === 'customer' ? user.id : null,
        seller_id: isUuid ? storeId : null,
        status: 'pending',
        payment_status: paymentMethod === 'cod' ? 'unpaid' : 'paid',
        payment_method: paymentMethod === 'cod' ? 'cash' : 'offline',
        total_amount: total,
        items: items,
        shipping_address: shippingInfo,
        applied_coupon: appliedCoupon ? appliedCoupon.code : null,
        coupon_discount: couponDiscount,
        loyalty_points_used: useLoyaltyPoints ? loyaltyDiscountAmount : 0,
        loyalty_discount: useLoyaltyPoints ? loyaltyDiscountAmount : 0,
        shipping_cost: shippingCost,
        shipping_method: isFreeDelivery ? 'Free Delivery' : (selectedShippingMethod ? selectedShippingMethod.title : null),
        offline_payment_info: paymentMethod === 'offline' ? {
          method: offlineMethod,
          transaction_id: transactionId,
          note: paymentNote
        } : null
      };

      const { data, error } = await supabase.from('orders').insert([insertData]).select().single();
      
      if (error) throw error;

      // Handle Loyalty Points FIFO deduction
      if (useLoyaltyPoints && loyaltyDiscountAmount > 0) {
        let pointsToDeduct = loyaltyDiscountAmount;
        for (const row of validLoyaltyPointsRows) {
          if (pointsToDeduct <= 0) break;
          const deduction = Math.min(row.remaining_points, pointsToDeduct);
          await supabase.from('loyalty_points')
            .update({ remaining_points: row.remaining_points - deduction })
            .eq('id', row.id);
          pointsToDeduct -= deduction;
        }
      }

      // Create notification for admin/seller
      await supabase.from('notifications').insert([{
        title: 'New Order Received',
        message: `Order #${data.id.toUpperCase()} has been placed for ৳${data.total_amount}.`,
        target_role: data.seller_id ? 'seller' : 'admin',
        target_user_id: data.seller_id || null,
        is_read: false
      }]);
      
      onClearCart();
      navigate(`/order-success/${data.id}`);
    } catch (err: any) {
      console.error('Order placement error:', err);
      showToast('Failed to place order: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">

      <div className="w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {currentStep === 1 ? 'Shopping cart' : currentStep === 2 ? 'Checkout' : 'PAYMENT METHOD'}
        </h1>

        {/* Stepper */}
        {currentStep > 1 && (
          <div className="flex items-center gap-4 mb-8 max-w-md">
            <div className={`flex flex-col items-center flex-1`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentStep >= 1 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                1
              </div>
              <span className="text-xs font-semibold mt-1 text-slate-700">Cart</span>
            </div>
            <div className="h-[2px] bg-brand-500 flex-1 -mt-4"></div>
            <div className={`flex flex-col items-center flex-1`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentStep >= 2 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                2
              </div>
              <span className="text-xs font-semibold mt-1 text-slate-700">Shipping</span>
            </div>
            <div className={`h-[2px] flex-1 -mt-4 ${currentStep >= 3 ? 'bg-brand-500' : 'bg-slate-200'}`}></div>
            <div className={`flex flex-col items-center flex-1`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentStep >= 3 ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                3
              </div>
              <span className="text-xs font-semibold mt-1 text-slate-700">Payment</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            
            {/* STAGE 1: CART */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-600">
                      <div className="col-span-6">Product</div>
                      <div className="col-span-2 text-center">Unit Price</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>

                    {cart.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">Your cart is empty.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {cart.map((item) => (
                          <div key={item.cartItemId} className="grid grid-cols-12 gap-4 p-4 items-center">
                            <div className="col-span-6 flex gap-3 items-center">
                              <img src={item.selectedVariation?.image || item.product.thumbnail} alt={item.product.title} className="w-16 h-16 object-cover rounded border border-slate-200" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800 line-clamp-2" title={item.product.title}>{item.product.title}</p>
                                {item.selectedVariation?.attributes && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.entries(item.selectedVariation.attributes).map(([k, v]) => {
                                      let displayVal = String(v);
                                      if (k.toLowerCase() === 'color' && displayVal.includes(' - ')) {
                                        displayVal = displayVal.split(' - ')[0];
                                      }
                                      return (
                                        <span key={k} className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                          {displayVal}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                <p className="text-xs text-slate-500 mt-1">Shipping cost: ৳0.00</p>
                              </div>
                            </div>
                            <div className="col-span-2 text-center text-sm font-medium text-slate-700">
                              ৳{(item.selectedVariation?.price || item.product.price).toFixed(2)}
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded">
                                <button onClick={() => {
                                  if (item.quantity > 1) {
                                    setCart(prev => prev.map(p => p.cartItemId === item.cartItemId ? { ...p, quantity: p.quantity - 1 } : p));
                                  }
                                }} className="text-slate-500 hover:text-brand-500">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                <button onClick={() => {
                                  setCart(prev => prev.map(p => p.cartItemId === item.cartItemId ? { ...p, quantity: p.quantity + 1 } : p));
                                }} className="text-slate-500 hover:text-brand-500">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="col-span-2 flex items-center justify-between">
                              <span className="text-sm font-bold text-brand-500">৳{((item.selectedVariation?.price || item.product.price) * item.quantity).toFixed(2)}</span>
                              <button onClick={() => onRemoveFromCart(item.cartItemId)} className="text-red-500 hover:text-red-600 transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 border-t border-slate-200">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Order Note (Optional)</label>
                  <textarea className="w-full border border-slate-300 rounded p-3 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none" rows={3}></textarea>
                </div>
              </div>
            )}

            {/* STAGE 2: SHIPPING */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Shipping Address</h3>
                
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">Select Saved Address</label>
                    <div className="flex flex-wrap gap-3">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            setShippingInfo({
                              ...shippingInfo,
                              addressType: addr.address_type,
                              name: addr.contact_person_name,
                              phone: addr.phone,
                              address: addr.address,
                              city: addr.city,
                              zipCode: addr.zip_code,
                              country: addr.country,
                              latitude: addr.latitude || 0,
                              longitude: addr.longitude || 0
                            });
                          }}
                          className="px-4 py-2 border border-slate-200 rounded-md text-sm font-medium hover:border-brand-500 hover:bg-brand-50 transition flex items-center gap-2"
                        >
                          <span className="font-bold text-brand-600">{addr.address_type}</span> - {addr.city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Address type</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShippingInfo({...shippingInfo, addressType: "Home"})}
                        className={`flex-1 py-2.5 rounded-md border text-sm font-medium transition duration-200 ${
                          shippingInfo.addressType === "Home" 
                            ? "bg-brand-500 border-brand-500 text-white shadow-sm" 
                            : "bg-white border-slate-300 text-slate-600 hover:border-brand-500 hover:text-brand-500"
                        }`}
                      >
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingInfo({...shippingInfo, addressType: "Office"})}
                        className={`flex-1 py-2.5 rounded-md border text-sm font-medium transition duration-200 ${
                          shippingInfo.addressType === "Office" 
                            ? "bg-brand-500 border-brand-500 text-white shadow-sm" 
                            : "bg-white border-slate-300 text-slate-600 hover:border-brand-500 hover:text-brand-500"
                        }`}
                      >
                        Office
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Name *</label>
                    <input type="text" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                      value={shippingInfo.name} onChange={(e) => setShippingInfo({...shippingInfo, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone number *</label>
                    <input type="tel" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                      value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                    <input type="email" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                      value={shippingInfo.email} onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Address *</label>
                    <textarea className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-500 outline-none" rows={3}
                      value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">City *</label>
                    <input type="text" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                      value={shippingInfo.city} onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Zip code *</label>
                    <input type="text" className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                      value={shippingInfo.zipCode} onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Country *</label>
                    <select className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                      value={shippingInfo.country} onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                    >
                      <option value="Bangladesh">Bangladesh</option>
                    </select>
                  </div>
                </div>

                {/* Shipping Method Section */}
                {shippingMethods.length > 0 && !isFreeDelivery && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-4">Choose Shipping Method</h4>
                    <div className="space-y-3">
                      {shippingMethods.map(method => (
                        <label key={method.id} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${selectedShippingMethod?.id === method.id ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'}`}>
                          <input 
                            type="radio" 
                            name="shipping_method" 
                            className="w-4 h-4 text-brand-500 focus:ring-brand-500 border-slate-300" 
                            checked={selectedShippingMethod?.id === method.id}
                            onChange={() => setSelectedShippingMethod(method)}
                          />
                          <div className="flex-1 text-sm text-slate-700">
                            Shipping method : {method.title} <span className="text-slate-500">{method.duration}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-800">
                            ৳{parseFloat(method.cost).toFixed(2)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {isFreeDelivery && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 font-bold flex items-center justify-between mb-4">
                    <span>Free Delivery Applied!</span>
                    <span>৳0.00</span>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 3: PAYMENT */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Payment method</h3>
                    <p className="text-xs text-slate-500 mt-1">Select A Payment Method To Proceed</p>
                  </div>
                  <button onClick={() => setCurrentStep(2)} className="text-brand-500 text-sm font-semibold hover:underline flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Go back
                  </button>
                </div>

                <div className="space-y-6">
                  <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-brand-500 transition">
                    <input type="radio" name="payment" className="w-4 h-4 text-brand-500 focus:ring-brand-500" 
                      checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')}
                    />
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      💵 Cash on Delivery
                    </span>
                  </label>

                  <div className={`border rounded-lg p-4 transition ${paymentMethod === 'offline' ? 'border-brand-500' : 'border-slate-200 hover:border-brand-500'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="payment" className="w-4 h-4 text-brand-500 focus:ring-brand-500" 
                        checked={paymentMethod === 'offline'} onChange={() => setPaymentMethod('offline')}
                      />
                      <span className="text-sm font-bold text-slate-700 flex-1">Pay Offline</span>
                      <ShieldAlert className="w-4 h-4 text-brand-500" />
                    </label>
                    
                    {paymentMethod === 'offline' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pl-6">
                        <button onClick={() => handleOfflinePaymentClick('Bkash')} className="px-4 py-3 border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:border-pink-500 hover:text-pink-600 transition flex justify-center items-center">
                          Bkash
                        </button>
                        <button onClick={() => handleOfflinePaymentClick('Nagad')} className="px-4 py-3 border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:border-brand-500 hover:text-brand-600 transition flex justify-center items-center">
                          Nagad
                        </button>
                        <button onClick={() => handleOfflinePaymentClick('Upay')} className="px-4 py-3 border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition flex justify-center items-center">
                          Upay
                        </button>
                        <button onClick={() => handleOfflinePaymentClick('Rocket')} className="px-4 py-3 border border-slate-200 rounded-md text-sm font-bold text-slate-700 hover:border-purple-500 hover:text-purple-600 transition flex justify-center items-center">
                          Rocket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-24">
              {discount > 0 && (
                <div className="flex items-center justify-center gap-2 text-brand-500 font-bold text-sm mb-6 pb-4 border-b border-slate-100">
                  🎉 You have Saved ৳{discount.toFixed(2)}!
                </div>
              )}

              <div className={`space-y-3 text-sm text-slate-600 mb-6 pb-6 border-b border-slate-100 ${discount === 0 ? 'mt-2' : ''}`}>
                <div className="flex justify-between">
                  <span>Sub total</span>
                  <span className="font-semibold text-slate-800">৳{subtotal.toFixed(2)}</span>
                </div>
                {!isFreeDelivery && selectedShippingMethod && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold text-slate-800">৳{parseFloat(selectedShippingMethod.cost).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-800">৳0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-800">
                    {isFreeDelivery ? <span className="text-green-600">৳0.00</span> : `৳${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount on product</span>
                  <span className="font-semibold text-slate-800">- ৳{discount.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded -mx-2 mt-2">
                    <span className="flex items-center gap-1 font-semibold text-xs">
                      Coupon: {appliedCoupon.code} <span className="font-normal text-[10px] bg-green-200 px-1.5 py-0.5 rounded text-green-700 ml-1">{appliedCoupon.title}</span>
                    </span>
                    <span className="font-bold">
                      {isFreeDelivery ? 'Free Delivery' : `- ৳${couponDiscount.toFixed(2)}`}
                    </span>
                  </div>
                )}
                {useLoyaltyPoints && loyaltyDiscountAmount > 0 && (
                  <div className="flex justify-between items-center text-brand-600 bg-brand-50 p-2 rounded -mx-2 mt-2">
                    <span className="font-semibold text-xs">Loyalty Points Used ({loyaltyDiscountAmount})</span>
                    <span className="font-bold">- ৳{loyaltyDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {loyaltyBalance >= 100 && (
                <div className="mb-6 bg-slate-50 border border-slate-200 rounded p-4 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800">Use Loyalty Points</span>
                    <span className="text-brand-500 font-bold">{loyaltyBalance} Points</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">You can use up to {maxLoyaltyDiscount} points on this order.</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useLoyaltyPoints}
                      onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                    <span className="font-semibold text-slate-700">Apply {maxLoyaltyDiscount} Points (৳{maxLoyaltyDiscount.toFixed(2)} off)</span>
                  </label>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-brand-500 mb-8">
                <span>Total</span>
                <span>৳{total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck className="w-6 h-6 text-yellow-500" />
                  <span className="text-[9px] font-semibold text-slate-500 leading-tight">Fast Delivery all<br/>across the<br/>country</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="w-6 h-6 text-blue-500" />
                  <span className="text-[9px] font-semibold text-slate-500 leading-tight"><br/>Safe Payment<br/></span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <CheckCircle className="w-6 h-6 text-pink-500" />
                  <span className="text-[9px] font-semibold text-slate-500 leading-tight">7 Days Return<br/>Policy</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="w-6 h-6 text-blue-500" />
                  <span className="text-[9px] font-semibold text-slate-500 leading-tight">100% Authentic<br/>Products</span>
                </div>
              </div>

              {currentStep < 3 ? (
                <button 
                  onClick={() => setCurrentStep(prev => (prev + 1) as 2 | 3)}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-md transition shadow-md"
                >
                  Proceed to Next
                </button>
              ) : (
                <button 
                  onClick={handlePlaceOrder}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-md transition shadow-md"
                >
                  Complete Order
                </button>
              )}

              <button 
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(prev => (prev - 1) as 1 | 2);
                  else navigate('/');
                }}
                className="w-full mt-3 text-brand-500 font-bold text-sm py-2 hover:bg-brand-50 rounded transition flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> {currentStep === 1 ? 'Continue Shopping' : 'Continue Shopping'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* OFFLINE PAYMENT POPUP */}
      {showOfflinePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div></div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
                <button onClick={() => setShowOfflinePopup(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>
              
              <p className="text-sm text-slate-600 text-center mb-6 font-medium">
                Pay your bill using any of the payment method below and input the required information in the form
              </p>

              <select 
                className="w-full border border-slate-300 rounded-md p-3 text-sm font-medium focus:ring-1 focus:ring-brand-500 outline-none mb-6 text-slate-700 bg-white"
                value={offlineMethod}
                onChange={(e) => setOfflineMethod(e.target.value)}
              >
                <option value="Bkash">Payment Method : Bkash</option>
                <option value="Nagad">Payment Method : Nagad</option>
                <option value="Upay">Payment Method : Upay</option>
                <option value="Rocket">Payment Method : Rocket</option>
              </select>

              <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-100">
                <h4 className="text-base font-bold text-slate-800 mb-2">{offlineMethod} Info</h4>
                <p className="text-sm font-medium text-slate-600">
                  {offlineMethod} : <span className="font-bold text-slate-800 tracking-wider">0123456789</span>
                </p>
              </div>

              <div className="text-center mb-8">
                <span className="text-2xl font-black text-slate-800">Amount : ৳{total.toFixed(2)}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    {offlineMethod} transaction id <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="TRX3434"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Payment note</label>
                  <textarea 
                    className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-brand-500 outline-none" 
                    rows={3}
                    placeholder="Insert note"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowOfflinePopup(false)}
                className="px-6 py-2 bg-brand-500 text-white font-bold rounded hover:bg-brand-600 transition"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  if(!transactionId) {
                    showToast("Transaction ID is required!", "error");
                    return;
                  }
                  setShowOfflinePopup(false);
                  handlePlaceOrder();
                }}
                className="px-6 py-2 bg-brand-500 text-white font-bold rounded hover:bg-brand-600 transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
