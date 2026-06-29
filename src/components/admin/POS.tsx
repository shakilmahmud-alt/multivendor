import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Minus, Trash2, Edit2, CheckCircle2, 
  X, Printer, RefreshCw, Sparkles, UserPlus, CreditCard, DollarSign
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Interface definitions
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  sku: string;
  seller_id?: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
}

interface HoldOrder {
  id: string;
  customerName: string;
  items: CartItem[];
  subTotal: number;
  total: number;
  timestamp: string;
}

export default function POS() {
  // State variables
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Cart & Customer States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'walking', name: 'Walking Customer', phone: '', email: '', address: '' }
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('walking');
  const [cartSessionId, setCartSessionId] = useState<string>('walking-customer-271');
  
  // Hold Orders
  const [holdOrders, setHoldOrders] = useState<HoldOrder[]>([]);
  const [showHoldModal, setShowHoldModal] = useState<boolean>(false);
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newCustomerEmail, setNewCustomerEmail] = useState<string>('');
  const [newCustomerAddress, setNewCustomerAddress] = useState<string>('');

  // Discount & Tax Modal/Input States
  const [productDiscount, setProductDiscount] = useState<number>(0);
  const [extraDiscount, setExtraDiscount] = useState<number>(0);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(5); // default 5%
  
  // Discount editing overlays
  const [editingExtraDiscount, setEditingExtraDiscount] = useState<boolean>(false);
  const [editingCouponDiscount, setEditingCouponDiscount] = useState<boolean>(false);
  const [discountVal, setDiscountVal] = useState<string>('0');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  
  // Order Confirmation Invoice Overlay
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [recentOrderDetails, setRecentOrderDetails] = useState<any>(null);

  // Offline Payment states
  const [showOfflinePopup, setShowOfflinePopup] = useState(false);
  const [offlineMethod, setOfflineMethod] = useState('Bkash');
  const [transactionId, setTransactionId] = useState('');
  const [offlineNote, setOfflineNote] = useState('');

  // Products per page
  const itemsPerPage = 12;

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch products and category mappings
      const [
        { data: pData },
        { data: catsData },
        { data: subCatsData },
        { data: subSubCatsData }
      ] = await Promise.all([
        supabase.from('in_house_products').select('*'),
        supabase.from('categories').select('id, name'),
        supabase.from('sub_categories').select('id, name'),
        supabase.from('sub_sub_categories').select('id, name')
      ]);

      if (pData) {
        const catMap = new Map(catsData?.map(c => [c.id, c.name]) || []);
        const subCatMap = new Map(subCatsData?.map(c => [c.id, c.name]) || []);
        const subSubCatMap = new Map(subSubCatsData?.map(c => [c.id, c.name]) || []);

        const mappedProducts: Product[] = pData.map((p: any) => {
          let catName = catMap.get(p.category_id) || 'Others';
          if (p.sub_category_id && subCatMap.has(p.sub_category_id)) {
            catName += ` / ${subCatMap.get(p.sub_category_id)}`;
          }
          if (p.sub_sub_category_id && subSubCatMap.has(p.sub_sub_category_id)) {
            catName += ` / ${subSubCatMap.get(p.sub_sub_category_id)}`;
          }

          return {
            id: p.id,
            name: p.name_en || p.name_bn || 'Unknown',
            price: parseFloat(p.unit_price || p.attributes?.price || '0'),
            category: catName,
            image: p.thumbnail_url || 'https://via.placeholder.com/150',
            sku: p.attributes?.sku || p.id.substring(0, 6),
            seller_id: p.attributes?.seller_id || null
          };
        });
        setProducts(mappedProducts);

        const cats = Array.from(new Set(mappedProducts.map(p => p.category)));
        setCategories(['All categories', ...cats]);
      }

      // 2. Fetch customers
      const { data: cData } = await supabase.from('customers').select('*');
      if (cData) {
        const mappedCustomers: Customer[] = cData.map((c: any) => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
          phone: c.phone || '',
          email: c.email || '',
          address: ''
        }));
        setCustomers([
          { id: 'walking', name: 'Walking Customer', phone: '', email: '', address: '' },
          ...mappedCustomers
        ]);
      }
    };
    
    fetchData();
  }, []);

  // Filtered Products List
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All categories' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const taxAmount = Math.round((subTotal * taxPercent) / 100);
  const discountTotal = productDiscount + extraDiscount + couponDiscount;
  const grandTotal = Math.max(0, subTotal + taxAmount - discountTotal);

  // Add new customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomerName.trim()) {
      const names = newCustomerName.trim().split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');

      try {
        const { data, error } = await supabase.from('customers').insert([{
          first_name: firstName,
          last_name: lastName,
          phone: newCustomerPhone,
          email: newCustomerEmail,
          password: 'pos_customer' // default plain text password for now
        }]).select();

        if (error) throw error;

        const newCustId = data?.[0]?.id || ('cust-' + Date.now());
        const newCust: Customer = {
          id: newCustId,
          name: newCustomerName,
          phone: newCustomerPhone,
          email: newCustomerEmail,
          address: newCustomerAddress
        };
        
        setCustomers(prev => [...prev, newCust]);
        setSelectedCustomer(newCust.id);
        
        // Update session cart id
        const formattedName = newCust.name.toLowerCase().replace(/\s+/g, '-');
        setCartSessionId(`${formattedName}-${Math.floor(100 + Math.random() * 900)}`);
        
        // Reset fields & close modal
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
        setNewCustomerAddress('');
        setShowCustomerModal(false);
      } catch (err) {
        console.error("Error creating customer", err);
        alert("Failed to create customer.");
      }
    }
  };

  // Hold current order
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      alert("Cart is empty! Cannot hold an empty order.");
      return;
    }
    const currentCustName = customers.find(c => c.id === selectedCustomer)?.name || 'Walking Customer';
    const newHold: HoldOrder = {
      id: 'hold-' + Date.now(),
      customerName: currentCustName,
      items: [...cart],
      subTotal: subTotal,
      total: grandTotal,
      timestamp: new Date().toLocaleTimeString()
    };
    setHoldOrders(prev => [...prev, newHold]);
    clearCart();
    alert("Order successfully placed on HOLD.");
  };

  const resumeHoldOrder = (hold: HoldOrder) => {
    setCart(hold.items);
    setHoldOrders(prev => prev.filter(o => o.id !== hold.id));
    setShowHoldModal(false);
  };

  // Checkout submission
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Please add items to cart before placing an order.");
      return;
    }

    if (paymentMethod === 'card') {
      setShowOfflinePopup(true);
      return;
    }
    
    await executePlaceOrder('cash');
  };

  const handleOfflinePaymentSubmit = async () => {
    if (!transactionId) {
      alert("Please enter transaction ID");
      return;
    }
    setShowOfflinePopup(false);
    await executePlaceOrder('offline', {
      method: offlineMethod,
      transactionId,
      note: offlineNote
    });
  };

  const executePlaceOrder = async (payMethod: 'cash' | 'offline', offlineDetails?: any) => {
    const customerObj = customers.find(c => c.id === selectedCustomer) || { name: 'Walking Customer', phone: 'N/A', address: 'N/A' };
    const transactionId = 'TXN-' + Math.floor(100000000 + Math.random() * 900000000);
    
    const rawSellerId = cart[0]?.product?.seller_id || null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSellerId || '');
    const sellerId = isUuid ? rawSellerId : null;
    
    const isOffline = payMethod === 'offline';
    
    const orderData = {
      id: transactionId,
      customerName: customerObj.name,
      customerPhone: customerObj.phone || 'N/A',
      customerAddress: customerObj.address || 'N/A',
      items: [...cart],
      subTotal: subTotal,
      tax: taxAmount,
      discount: discountTotal,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod,
      date: new Date().toLocaleString()
    };

    const transactionIdForDB = Math.random().toString(36).substring(2, 8).toLowerCase();
    const formattedItems = cart.map(c => ({
      id: c.product.id,
      name: c.product.name,
      price: c.product.price,
      quantity: c.quantity,
      image: c.product.image
    }));

    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          id: transactionIdForDB,
          customer_id: selectedCustomer !== 'walking' ? selectedCustomer : null,
          seller_id: sellerId,
          total_amount: grandTotal,
          status: isOffline ? 'pending' : 'confirmed',
          payment_status: isOffline ? 'unpaid' : 'paid',
          payment_method: isOffline ? 'offline' : 'cash',
          items: formattedItems,
          shipping_address: { type: 'POS', name: 'POS Order', offline_payment: offlineDetails }
        }]);
      
      if (error) throw error;
      
      // Update transaction ID visually to match the one we inserted
      orderData.id = transactionIdForDB;
      
    } catch (err: any) {
      console.error("Insert Error", err);
      alert("Database error: " + (err.message || JSON.stringify(err)));
      return; // Stop execution on fail
    }

    setRecentOrderDetails(orderData);
    setShowInvoiceModal(true);
  };

  const closeInvoice = () => {
    clearCart();
    setProductDiscount(0);
    setExtraDiscount(0);
    setCouponDiscount(0);
    setSelectedCustomer('walking');
    setCartSessionId('walking-customer-271');
    setShowInvoiceModal(false);
  };

  // Open Edit discount prompts
  const openExtraDiscountEdit = () => {
    setDiscountVal(extraDiscount.toString());
    setEditingExtraDiscount(true);
  };

  const openCouponDiscountEdit = () => {
    setDiscountVal(couponDiscount.toString());
    setEditingCouponDiscount(true);
  };

  const saveExtraDiscount = () => {
    setExtraDiscount(parseFloat(discountVal) || 0);
    setEditingExtraDiscount(false);
  };

  const saveCouponDiscount = () => {
    setCouponDiscount(parseFloat(discountVal) || 0);
    setEditingCouponDiscount(false);
  };

  const activeCustomerObj = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full text-slate-800 -m-6 p-6 min-h-[calc(100vh-64px)] overflow-y-auto bg-slate-50">
      
      {/* LEFT: Product Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Controls */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <h2 className="text-sm font-bold text-slate-800 shrink-0">Product Section</h2>
            
            <div className="flex flex-1 flex-col sm:flex-row gap-3 max-w-2xl justify-end">
              {/* Category selector */}
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-600 outline-none bg-slate-50 focus:border-cyan-400 focus:bg-white transition sm:w-48 shrink-0"
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search by name or sku"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:border-cyan-400 focus:bg-white transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 min-h-[500px] items-start">
          {paginatedProducts.map(product => (
            <div 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-cyan-300 transition cursor-pointer select-none group flex flex-col justify-between h-full"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center p-2 shrink-0">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between text-center">
                <h4 className="text-[11px] font-semibold text-slate-700 line-clamp-2 leading-tight mb-2 min-h-[26px]">
                  {product.name}
                </h4>
                <p className="text-xs font-black text-cyan-600">
                  ৳{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
          
          {paginatedProducts.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              No products found matching filters.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              &lt;
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  currentPage === page 
                    ? 'bg-cyan-500 text-white' 
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Billing Section */}
      <div className="w-full xl:w-96 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
        
        <div>
          {/* Billing Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Billing Section</h3>
            <button 
              onClick={() => setShowHoldModal(true)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-pink-200 text-pink-500 hover:bg-pink-50 transition flex items-center gap-1 shrink-0"
            >
              View All Hold Orders 
              <span className="bg-pink-500 text-white font-extrabold text-[9px] rounded-full px-1.5 py-0.5 leading-none">
                {holdOrders.length}
              </span>
            </button>
          </div>

          {/* Customer Selection Row */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-2 items-center">
              <select 
                value={selectedCustomer}
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  const cust = customers.find(c => c.id === e.target.value);
                  if (cust) {
                    const formatted = cust.name.toLowerCase().replace(/\s+/g, '-');
                    setCartSessionId(`${formatted}-${Math.floor(100 + Math.random() * 900)}`);
                  }
                }}
                className="flex-1 text-xs border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-600 outline-none focus:border-cyan-400 focus:bg-white transition"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              
              <button 
                onClick={() => setShowCustomerModal(true)}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-2.5 rounded-lg transition shrink-0 flex items-center gap-1.5"
                title="Add New Customer"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Customer</span>
              </button>
            </div>

            {/* Current Customer Label */}
            <div className="text-[11px] font-semibold text-slate-500">
              Current Customer : <span className="text-slate-800 font-bold">{activeCustomerObj?.name}</span>
            </div>

            {/* Session Cart Selection */}
            <div className="flex gap-2 items-center">
              <select 
                value={cartSessionId}
                onChange={(e) => setCartSessionId(e.target.value)}
                className="flex-1 text-xs border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-600 outline-none"
              >
                <option value={cartSessionId}>{cartSessionId}</option>
              </select>
              
              <button 
                onClick={clearCart}
                className="text-[10px] font-bold px-2 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition shrink-0"
              >
                Clear Cart
              </button>
              <button 
                onClick={handleHoldOrder}
                className="text-[10px] font-bold px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition shrink-0"
              >
                New Order
              </button>
            </div>
          </div>

          {/* Cart Table list */}
          <div className="border border-slate-100 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[9px]">
                <tr>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cart.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800 truncate max-w-[120px]">{item.product.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.product.sku}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition font-bold"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-800 text-xs">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition font-bold"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-700">
                      ৳{(item.product.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}

                {cart.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Cart is empty. Select items on the left to add.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations Section */}
        <div className="mt-auto space-y-2 border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Sub Total :</span>
            <span className="font-bold text-slate-700">৳{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Product Discount :</span>
            <span className="font-bold text-slate-700">৳{productDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              Extra Discount : 
              <button onClick={openExtraDiscountEdit} className="text-slate-400 hover:text-slate-600">
                <Edit2 className="w-3 h-3" />
              </button>
            </span>
            <span className="font-bold text-slate-700">৳{extraDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              Coupon Discount : 
              <button onClick={openCouponDiscountEdit} className="text-slate-400 hover:text-slate-600">
                <Edit2 className="w-3 h-3" />
              </button>
            </span>
            <span className="font-bold text-slate-700">৳{couponDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Tax ({taxPercent}%) :</span>
            <span className="font-bold text-slate-700">৳{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-black border-t border-dashed border-slate-200 pt-2 mb-4">
            <span className="text-slate-800">Total :</span>
            <span className="text-cyan-600 text-base">৳{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Paid By</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  paymentMethod === 'cash' 
                    ? 'bg-[#1e293b] text-white border-[#1e293b]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-sm">৳</span> Cash
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition ${
                  paymentMethod === 'card' 
                    ? 'bg-[#1e293b] text-white border-[#1e293b]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Pay Offline
              </button>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={clearCart}
              className="py-2.5 px-4 bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 font-bold text-xs rounded-lg transition"
            >
              Cancel Order
            </button>
            <button 
              onClick={handlePlaceOrder}
              className="py-2.5 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-lg shadow-sm transition"
            >
              Place Order
            </button>
          </div>

        </div>

      </div>

      {/* --- ADD NEW CUSTOMER MODAL --- */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Add New Customer</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1">Customer Name:</label>
                <input 
                  type="text" 
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Shakil Mahmud"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-cyan-400 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Phone Number:</label>
                <input 
                  type="text" 
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. +8801784905075"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-cyan-400 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Email Address (Optional):</label>
                <input 
                  type="email" 
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-cyan-400 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Address (Optional):</label>
                <textarea 
                  rows={2}
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-cyan-400 bg-slate-50 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HOLD ORDERS VIEW MODAL --- */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Hold Orders List 
                <span className="bg-pink-500 text-white text-[10px] font-black rounded-full px-2 py-0.5 leading-none">
                  {holdOrders.length}
                </span>
              </h3>
              <button onClick={() => setShowHoldModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[400px] overflow-y-auto">
              {holdOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  No orders currently on hold.
                </div>
              ) : (
                <div className="space-y-3">
                  {holdOrders.map(hold => (
                    <div 
                      key={hold.id}
                      className="border border-slate-100 rounded-lg p-3 hover:border-cyan-300 transition flex items-center justify-between gap-4"
                    >
                      <div className="text-xs">
                        <p className="font-bold text-slate-850">Customer: {hold.customerName}</p>
                        <p className="text-slate-500 font-medium mt-0.5">{hold.items.length} items • Sub Total: ৳{hold.subTotal.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Held at {hold.timestamp}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setHoldOrders(prev => prev.filter(o => o.id !== hold.id))}
                          className="px-3 py-1.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg font-bold text-[11px] transition"
                        >
                          Discard
                        </button>
                        <button 
                          onClick={() => resumeHoldOrder(hold)}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-[11px] shadow-sm transition"
                        >
                          Resume Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT EXTRA DISCOUNT POPUP --- */}
      {editingExtraDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xs w-full p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Edit Extra Discount (৳)</h4>
            <input 
              type="number"
              value={discountVal}
              onChange={(e) => setDiscountVal(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-cyan-400 bg-slate-50 focus:bg-white mb-4"
            />
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button onClick={() => setEditingExtraDiscount(false)} className="px-3 py-1.5 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={saveExtraDiscount} className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT COUPON DISCOUNT POPUP --- */}
      {editingCouponDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xs w-full p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Edit Coupon Discount (৳)</h4>
            <input 
              type="number"
              value={discountVal}
              onChange={(e) => setDiscountVal(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-cyan-400 bg-slate-50 focus:bg-white mb-4"
            />
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button onClick={() => setEditingCouponDiscount(false)} className="px-3 py-1.5 hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={saveCouponDiscount} className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* --- INVOICE CHECKOUT MODAL RECEIPT --- */}
      {showInvoiceModal && recentOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Order Placed Successfully
              </h3>
              <button onClick={closeInvoice} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content for printing */}
            <div className="flex-1 overflow-y-auto p-6 text-slate-700 bg-white" id="printable-receipt">
              <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
                <div className="flex justify-center mb-1">
                  <img src="https://ik.imagekit.io/eg7u6xcn0u/HolidayMart-logo-wide.png" alt="HolidayMart" className="h-8 grayscale" />
                </div>
                <p className="text-[10px] text-slate-450 mt-1 font-semibold">Marketplace Point of Sale Receipt</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Dhaka, Bangladesh • Support: +8801784905075</p>
              </div>

              {/* Order Metadata */}
              <div className="text-[10px] space-y-1 mb-4 font-mono font-semibold text-slate-600">
                <p>Transaction ID: <span className="text-slate-800 font-bold">{recentOrderDetails.id}</span></p>
                <p>Date: <span className="text-slate-850">{recentOrderDetails.date}</span></p>
                <p>Customer: <span className="text-slate-800 font-bold">{recentOrderDetails.customerName}</span></p>
                <p>Phone: <span className="text-slate-850">{recentOrderDetails.customerPhone}</span></p>
                {recentOrderDetails.customerAddress && recentOrderDetails.customerAddress !== 'N/A' && (
                  <p>Address: <span className="text-slate-850">{recentOrderDetails.customerAddress}</span></p>
                )}
                <p>Payment: <span className="text-slate-850 font-bold uppercase">{recentOrderDetails.paymentMethod}</span></p>
              </div>

              {/* Items Breakdown */}
              <div className="border-t border-b border-dashed border-slate-200 py-3 mb-4">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Price</span>
                </div>
                
                <div className="space-y-2">
                  {recentOrderDetails.items.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 text-[11px] font-semibold text-slate-700">
                      <div className="col-span-6">
                        <p className="truncate font-bold text-slate-800">{item.product.name}</p>
                        <p className="text-[8px] text-slate-400 font-mono">{item.product.sku}</p>
                      </div>
                      <span className="col-span-2 text-center">{item.quantity}</span>
                      <span className="col-span-4 text-right font-black">৳{(item.product.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total calculations */}
              <div className="space-y-1.5 text-xs text-slate-600 font-semibold border-b border-dashed border-slate-200 pb-3 mb-4">
                <div className="flex justify-between">
                  <span>Sub Total:</span>
                  <span>৳{recentOrderDetails.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {recentOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount:</span>
                    <span>-৳{recentOrderDetails.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT/Tax:</span>
                  <span>৳{recentOrderDetails.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-100">
                  <span>Total Amount Paid:</span>
                  <span className="text-cyan-600">৳{recentOrderDetails.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Simulated Barcode / Footer Message */}
              <div className="text-center pt-2">
                <div className="bg-slate-100 h-10 w-48 mx-auto flex items-center justify-center border-l-2 border-r-2 border-slate-300 relative overflow-hidden select-none mb-3">
                  <div className="w-full flex justify-between px-1.5 opacity-60">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div 
                        key={i} 
                        style={{ width: `${(i % 3 === 0 ? 3 : (i % 2 === 0 ? 1 : 2))}px` }} 
                        className="bg-black h-8 shrink-0" 
                      />
                    ))}
                  </div>
                  <span className="absolute bottom-0 text-[8px] font-mono tracking-widest text-slate-500">{recentOrderDetails.id}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold">Thank you for shopping at HolidayMart!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button 
                onClick={closeInvoice} 
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Close Receipt
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- OFFLINE PAYMENT MODAL --- */}
      {showOfflinePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                Receive offline payment via any method below and record the transaction info.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <button onClick={() => setOfflineMethod('Bkash')} className={`px-4 py-3 border rounded-md text-sm font-bold transition flex justify-center items-center ${offlineMethod === 'Bkash' ? 'border-pink-500 text-pink-600 bg-pink-50' : 'border-slate-200 text-slate-700 hover:border-pink-500 hover:text-pink-600'}`}>
                  Bkash
                </button>
                <button onClick={() => setOfflineMethod('Nagad')} className={`px-4 py-3 border rounded-md text-sm font-bold transition flex justify-center items-center ${offlineMethod === 'Nagad' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600'}`}>
                  Nagad
                </button>
                <button onClick={() => setOfflineMethod('Upay')} className={`px-4 py-3 border rounded-md text-sm font-bold transition flex justify-center items-center ${offlineMethod === 'Upay' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'}`}>
                  Upay
                </button>
                <button onClick={() => setOfflineMethod('Rocket')} className={`px-4 py-3 border rounded-md text-sm font-bold transition flex justify-center items-center ${offlineMethod === 'Rocket' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-slate-200 text-slate-700 hover:border-purple-500 hover:text-purple-600'}`}>
                  Rocket
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-100">
                <h4 className="text-base font-bold text-slate-800 mb-2">{offlineMethod} Info</h4>
                <p className="text-sm font-medium text-slate-600">
                  {offlineMethod} : <span className="font-bold text-slate-800 tracking-wider">0123456789</span>
                </p>
              </div>

              <div className="text-center mb-8">
                <span className="text-2xl font-black text-slate-800">Amount : ৳{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    {offlineMethod} transaction id <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                    placeholder="TRX3434"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Payment note
                  </label>
                  <textarea 
                    rows={3} 
                    className="w-full border border-slate-300 rounded-md p-3 text-sm focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
                    placeholder="Enter notes..."
                    value={offlineNote}
                    onChange={(e) => setOfflineNote(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowOfflinePopup(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-md transition">
                Close
              </button>
              <button onClick={handleOfflinePaymentSubmit} className="px-6 py-2.5 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 rounded-md shadow-md transition">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
