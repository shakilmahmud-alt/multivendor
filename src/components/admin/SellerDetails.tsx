import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, Star, Wallet, Package, CheckCircle, Clock, List, FileText, Settings, CreditCard, MessageSquare, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function SellerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Shop overview');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [walletStats, setWalletStats] = useState({
    withdrawableBalance: 0,
    alreadyWithdrawn: 0,
    totalCommissionGiven: 0,
    collectedCash: 0
  });

  useEffect(() => {
    fetchSellerDetails();
  }, [id]);

  const fetchSellerDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setSeller(data);

      // Fetch Products
      const { data: pData } = await supabase
        .from('in_house_products')
        .select('*')
        .contains('attributes', { seller_id: id });
      const fetchedProducts = pData || [];
      setProducts(fetchedProducts);

      // Fetch Reviews
      if (fetchedProducts.length > 0) {
        const productIds = fetchedProducts.map(p => p.id);
        const { data: rData } = await supabase
          .from('reviews')
          .select('*, customers(first_name, last_name)')
          .in('product_id', productIds);
        setReviews(rData || []);
      }

      // Fetch Orders
      const { data: oData } = await supabase
        .from('orders')
        .select('*, customers(first_name, last_name)')
        .eq('seller_id', id);
      setOrders(oData || []);

      // Calculate Wallet Stats
      let commissionGiven = 0;
      let totalPaidAmount = 0;
      let collectedCash = 0;

      if (oData) {
        oData.forEach(o => {
          const isValidStatus = ['delivered', 'returned', 'failed_to_deliver'].includes(o.status) || (o.status === 'canceled' && o.canceled_by === 'seller');
          if (o.payment_status === 'paid' && isValidStatus) {
            let currentTotalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
            const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
            const taxAmt = parseFloat(o.tax_amount || 0);
            const items = Array.isArray(o.items) ? o.items : [];
            const subTotal = items.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
            
            const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status);
            const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status);

            if (excludeDelivery) {
              currentTotalAmt = Math.max(0, currentTotalAmt - deliveryFee);
            }

            let orderCommission = 0;
            if (isSpecialStatus) {
              orderCommission = 200;
            } else if (currentTotalAmt <= 0 && subTotal > 0) {
              const originalTotal = subTotal + taxAmt + deliveryFee;
              orderCommission = originalTotal * 0.015;
            } else {
              orderCommission = currentTotalAmt * 0.20;
            }

            const vendorOrderAmt = currentTotalAmt - deliveryFee - orderCommission;

            commissionGiven += orderCommission;
            totalPaidAmount += (currentTotalAmt - deliveryFee);

            if (o.shipping_address?.disbursement_status === 'Disbursed') {
               collectedCash += vendorOrderAmt;
            }
          }
        });
      }

      setWalletStats({
        withdrawableBalance: totalPaidAmount - commissionGiven - collectedCash,
        alreadyWithdrawn: 0,
        totalCommissionGiven: commissionGiven,
        collectedCash: collectedCash
      });

    } catch (err) {
      console.error('Error fetching seller details:', err);
      // Fallback if not found
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!seller) return;
    
    // Optimistic UI update
    setSeller({ ...seller, status: newStatus });

    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status: newStatus })
        .eq('id', seller.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating status:', err);
      setSeller({ ...seller, status: seller.status }); // Revert
      alert('Failed to update status');
    }
  };

  const handleDisbursementUpdate = async (orderId: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const newAddress = { ...(order.shipping_address || {}), disbursement_status: newStatus };
      
      // Optimistic update
      const updatedOrders = orders.map(o => o.id === orderId ? { ...o, shipping_address: newAddress } : o);
      setOrders(updatedOrders);
      
      // Re-calculate wallet
      let commissionGiven = 0;
      let totalPaidAmount = 0;
      let collectedCash = 0;

      updatedOrders.forEach(o => {
        const isValidStatus = ['delivered', 'returned', 'failed_to_deliver'].includes(o.status) || (o.status === 'canceled' && o.canceled_by === 'seller');
        if (o.payment_status === 'paid' && isValidStatus) {
          let currentTotalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
          const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
          const taxAmt = parseFloat(o.tax_amount || 0);
          const items = Array.isArray(o.items) ? o.items : [];
          const subTotal = items.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
          
          const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status);
          const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status);

          if (excludeDelivery) {
            currentTotalAmt = Math.max(0, currentTotalAmt - deliveryFee);
          }

          let orderCommission = 0;
          if (isSpecialStatus) {
            orderCommission = 200;
          } else if (currentTotalAmt <= 0 && subTotal > 0) {
            orderCommission = (subTotal + taxAmt + deliveryFee) * 0.015;
          } else {
            orderCommission = currentTotalAmt * 0.20;
          }
          
          const vendorOrderAmt = currentTotalAmt - deliveryFee - orderCommission;
          
          commissionGiven += orderCommission;
          totalPaidAmount += (currentTotalAmt - deliveryFee);
          if (o.shipping_address?.disbursement_status === 'Disbursed') {
            collectedCash += vendorOrderAmt;
          }
        }
      });

      setWalletStats({
        withdrawableBalance: totalPaidAmount - commissionGiven - collectedCash,
        alreadyWithdrawn: 0,
        totalCommissionGiven: commissionGiven,
        collectedCash: collectedCash
      });

      const { error } = await supabase.from('orders').update({ shipping_address: newAddress }).eq('id', orderId);
      if (error) throw error;
    } catch (error) {
      console.error("Failed to update disbursement", error);
      fetchSellerDetails(); // Revert on failure
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading seller details...</div>;
  }

  if (!seller) {
    return <div className="p-8 text-center text-rose-500">Seller not found.</div>;
  }

  return (
    <div className="p-6 font-sans bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 text-[#2b3445]">
        <UserCheck className="w-5 h-5" />
        <h1 className="text-lg font-bold">Seller Details</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        {['Shop overview', 'Order', 'Product', 'Transaction', 'Review'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'text-sky-500 border-b-2 border-sky-500 bg-transparent' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Top Section */}
        <div className="p-6 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Shop Logo Box */}
            <div className="w-48 h-48 bg-slate-100 rounded-lg p-2 border border-slate-200 flex items-center justify-center relative overflow-hidden shadow-inner">
              {seller.shop_logo_url ? (
                <img src={seller.shop_logo_url} alt={seller.shop_name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-slate-400 text-4xl">{seller.shop_name?.charAt(0)}</span>
              )}
            </div>

            {/* Shop Info */}
            <div className="flex flex-col gap-2 pt-2">
              <h2 className="text-xl font-bold text-slate-800">{seller.shop_name}</h2>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">0</span>
                </div>
                <span className="text-slate-300">|</span>
                <span>0 Ratings</span>
                <span className="text-slate-300">|</span>
                <span>0 Reviews</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleStatusChange('Inactive')}
              className="px-6 py-2 bg-[#fb416b] hover:bg-[#e03a60] text-white text-sm font-medium rounded shadow-sm transition w-full md:w-auto"
            >
              Reject
            </button>
            <button 
              onClick={() => handleStatusChange('Active')}
              className="px-6 py-2 bg-[#00c9a7] hover:bg-[#00b596] text-white text-sm font-medium rounded shadow-sm transition w-full md:w-auto"
            >
              Approve
            </button>
          </div>
        </div>

        {activeTab === 'Shop overview' && (
          <div className="p-6 bg-slate-50/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Stats Box */}
              <div className="border border-slate-200 rounded p-4 flex flex-col gap-4 bg-white shadow-sm col-span-1 h-fit">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total products :</p>
                  <p className="text-lg font-bold text-blue-600">{products.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total orders :</p>
                  <p className="text-lg font-bold text-blue-600">{orders.length}</p>
                </div>
              </div>

              {/* Shop Information */}
              <div className="col-span-1">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Shop Information</h3>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Shop name</span>
                    <span className="text-slate-700">: {seller.shop_name}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Phone</span>
                    <span className="text-slate-700">: {seller.phone}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Address</span>
                    <span className="text-slate-700">: {seller.shop_address || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                    <span className="text-slate-500">Status</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700">:</span>
                      {seller.status === 'Active' ? (
                        <span className="bg-[#00c9a7] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">Active</span>
                      ) : seller.status === 'Pending' ? (
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">Pending</span>
                      ) : (
                        <span className="bg-[#fb416b] text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="col-span-1">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Seller Information</h3>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Name</span>
                    <span className="text-slate-700">: {seller.name}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Email</span>
                    <span className="text-slate-700">: {seller.email}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Phone</span>
                    <span className="text-slate-700">: {seller.phone}</span>
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="col-span-1">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Bank Information</h3>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Bank name</span>
                    <span className="text-slate-400 italic">: No data found</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Branch</span>
                    <span className="text-slate-400 italic">: No data found</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">Holder name</span>
                    <span className="text-slate-400 italic">: No data found</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-slate-500">A/C No</span>
                    <span className="text-slate-400 italic">: No data found</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Wallet Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-slate-800">Seller Wallet</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Withdrawable Balance (Left Box) */}
                <div className="col-span-1 md:col-span-1 bg-[#10C469] text-white rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-md">
                  <div className="absolute top-4 right-4 opacity-20">
                    <Wallet className="w-16 h-16" />
                  </div>
                  <Wallet className="w-8 h-8 mb-4 text-white" />
                  <h3 className="text-3xl font-bold mb-1">৳{walletStats.withdrawableBalance.toFixed(2)}</h3>
                  <p className="text-sm font-medium opacity-90">Withdrawable Balance</p>
                </div>

                {/* Other Stats (Right Boxes) */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">৳{walletStats.alreadyWithdrawn.toFixed(2)}</h4>
                      <p className="text-xs text-slate-500 mt-1">Already Withdrawn</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">৳{walletStats.totalCommissionGiven.toFixed(2)}</h4>
                      <p className="text-xs text-slate-500 mt-1">Total Commission Given</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">৳{walletStats.collectedCash.toFixed(2)}</h4>
                      <p className="text-xs text-slate-500 mt-1">Collected Cash</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'Order' && (
          <div className="p-6 bg-slate-50/30">
            {/* Order Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Pending</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{orders.filter(o => o.status === 'pending').length}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Delivered</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{orders.filter(o => o.status === 'delivered').length}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">All</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{orders.length}</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-800 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4 w-16">SL</th>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Payment Status</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Order Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length > 0 ? orders.map((o, i) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">{i + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{o.id.slice(0,8)}</td>
                        <td className="px-6 py-4 text-xs">{new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4">{o.customer_id ? 'Customer' : 'Guest customer'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize ${o.payment_status === 'paid' ? 'bg-cyan-50 text-cyan-500' : 'bg-rose-50 text-rose-500'}`}>
                            {o.payment_status || 'unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-4">৳{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold capitalize ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-500' : o.status === 'returned' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                            {o.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => navigate(`/admin/orders/details/${o.id}`)} className="p-1.5 text-sky-500 hover:bg-sky-50 rounded border border-sky-100 transition">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No orders found for this seller.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Product' && (
          <div className="p-6 bg-slate-50/30">
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">Products</h3>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{products.length}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-white border-b border-slate-200 text-xs text-slate-800 font-bold">
                    <tr>
                      <th className="px-6 py-4 w-16">SL</th>
                      <th className="px-6 py-4">Product Name</th>
                      <th className="px-6 py-4">Purchase Price</th>
                      <th className="px-6 py-4">Selling Price</th>
                      <th className="px-6 py-4 text-center">Featured</th>
                      <th className="px-6 py-4 text-center">Active Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.length > 0 ? products.map((p, i) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">{i + 1}</td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 overflow-hidden">
                            {p.thumbnail_url ? <img src={p.thumbnail_url} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-400 m-2.5" />}
                          </div>
                          <span className="font-medium text-slate-700 line-clamp-1">{p.name_en}</span>
                        </td>
                        <td className="px-6 py-4">৳0.00</td>
                        <td className="px-6 py-4">৳{parseFloat(p.attributes?.price || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className={`w-8 h-4 rounded-full mx-auto relative ${p.attributes?.is_featured ? 'bg-blue-500' : 'bg-slate-300'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${p.attributes?.is_featured ? 'right-0.5' : 'left-0.5'}`} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className={`w-8 h-4 rounded-full mx-auto relative ${p.attributes?.status === 'active' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${p.attributes?.status === 'active' ? 'right-0.5' : 'left-0.5'}`} />
                          </div>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-2">
                          <button className="p-1.5 text-sky-500 hover:bg-sky-50 rounded border border-sky-100 transition">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-rose-500 hover:bg-rose-50 rounded border border-rose-100 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No products found for this seller.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Transaction' && (
          <div className="p-6 bg-slate-50/30">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Disbursed Amount</span>
                <span className="text-2xl font-black text-emerald-600">৳{walletStats.collectedCash.toFixed(2)}</span>
              </div>
              <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Hold Amount</span>
                <span className="text-2xl font-black text-amber-500">৳{walletStats.withdrawableBalance.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">Transaction Table</h3>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{orders.filter(o => ['delivered', 'returned', 'failed_to_deliver'].includes(o.status) || (o.status === 'canceled' && o.canceled_by === 'seller')).length}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-200 text-xs text-slate-800 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-4">SL</th>
                      <th className="px-4 py-4">Vendor Name</th>
                      <th className="px-4 py-4">Customer Name</th>
                      <th className="px-4 py-4">Order Id</th>
                      <th className="px-4 py-4">Transaction Id</th>
                      <th className="px-4 py-4">Order Amount</th>
                      <th className="px-4 py-4">Vendor Amount</th>
                      <th className="px-4 py-4">Admin Commission</th>
                      <th className="px-4 py-4">Received By</th>
                      <th className="px-4 py-4">Delivered By</th>
                      <th className="px-4 py-4">Delivery Charge</th>
                      <th className="px-4 py-4">Payment Method</th>
                      <th className="px-4 py-4">Tax</th>
                      <th className="px-4 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const transactionOrders = orders.filter(o => ['delivered', 'returned', 'failed_to_deliver'].includes(o.status) || (o.status === 'canceled' && o.canceled_by === 'seller'));
                      return (
                        <>
                          {transactionOrders.length > 0 && transactionOrders.map((o, i) => {
                            let totalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
                            const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
                            const taxAmt = parseFloat(o.tax_amount || 0);
                            const items = Array.isArray(o.items) ? o.items : [];
                            const subTotal = items.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
                            
                            const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status);
                            const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status);

                            if (excludeDelivery) {
                              totalAmt = Math.max(0, totalAmt - deliveryFee);
                            }

                            let orderCommission = 0;
                            if (isSpecialStatus) {
                              orderCommission = 200;
                            } else if (totalAmt <= 0 && subTotal > 0) {
                              orderCommission = (subTotal + taxAmt + deliveryFee) * 0.015;
                            } else {
                              orderCommission = totalAmt * 0.20;
                            }
                            
                            const vendorAmt = totalAmt - deliveryFee - orderCommission;
                            const transactionId = `${o.id.slice(0,4)}-${o.id.slice(4,9)}-${new Date(o.created_at).getTime()}`;
                            const disbursementStatus = o.shipping_address?.disbursement_status || 'Hold';
                            const custName = o.customers ? `${o.customers.first_name || ''} ${o.customers.last_name || ''}`.trim() : (o.shipping_address?.name || 'Guest customer');

                            return (
                              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4">{i + 1}</td>
                                <td className="px-4 py-4 font-semibold text-slate-800">{seller.name}</td>
                                <td className="px-4 py-4">{custName}</td>
                                <td className="px-4 py-4 font-medium">{o.id.slice(0,8)}</td>
                                <td className="px-4 py-4 text-xs font-mono text-slate-500">{transactionId}</td>
                                <td className="px-4 py-4">৳{totalAmt.toFixed(2)}</td>
                                <td className="px-4 py-4">৳{vendorAmt.toFixed(2)}</td>
                                <td className="px-4 py-4">৳{orderCommission.toFixed(2)}</td>
                                <td className="px-4 py-4 text-xs">admin</td>
                                <td className="px-4 py-4 text-xs">admin</td>
                                <td className="px-4 py-4">৳{deliveryFee.toFixed(2)}</td>
                                <td className="px-4 py-4 capitalize text-xs">{o.payment_method || 'cash'}</td>
                                <td className="px-4 py-4">৳{taxAmt.toFixed(2)}</td>
                                <td className="px-4 py-4">
                                  <select 
                                    value={disbursementStatus}
                                    onChange={(e) => handleDisbursementUpdate(o.id, e.target.value)}
                                    className={`text-xs font-bold px-2 py-1 rounded outline-none border ${disbursementStatus === 'Disbursed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}
                                  >
                                    <option value="Hold">Hold</option>
                                    <option value="Disbursed">Disburse</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                          {transactionOrders.length > 0 && (
                            <tr className="bg-slate-100 font-bold text-slate-800">
                              <td colSpan={5} className="px-4 py-4 text-right uppercase">Total:</td>
                              <td className="px-4 py-4 text-blue-600">৳{transactionOrders.reduce((acc, o) => {
                                let t = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
                                if (['returned', 'failed_to_deliver'].includes(o.status)) t = Math.max(0, t - parseFloat(o.deliveryman_fee || o.shipping_cost || 0));
                                return acc + t;
                              }, 0).toFixed(2)}</td>
                              <td className="px-4 py-4 text-blue-600">৳{transactionOrders.reduce((acc, o) => {
                                let totalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
                                const subTotal = (Array.isArray(o.items) ? o.items : []).reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
                                const taxAmt = parseFloat(o.tax_amount || 0);
                                const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
                                if (['returned', 'failed_to_deliver'].includes(o.status)) totalAmt = Math.max(0, totalAmt - deliveryFee);
                                
                                let orderCommission = 0;
                                if (['returned', 'failed_to_deliver', 'canceled'].includes(o.status)) orderCommission = 200;
                                else if (totalAmt <= 0 && subTotal > 0) orderCommission = (subTotal + taxAmt + deliveryFee) * 0.015;
                                else orderCommission = totalAmt * 0.20;
                                return acc + (totalAmt - deliveryFee - orderCommission);
                              }, 0).toFixed(2)}</td>
                              <td className="px-4 py-4 text-blue-600">৳{transactionOrders.reduce((acc, o) => {
                                let totalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
                                const subTotal = (Array.isArray(o.items) ? o.items : []).reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
                                const taxAmt = parseFloat(o.tax_amount || 0);
                                const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
                                if (['returned', 'failed_to_deliver'].includes(o.status)) totalAmt = Math.max(0, totalAmt - deliveryFee);
                                
                                let orderCommission = 0;
                                if (['returned', 'failed_to_deliver', 'canceled'].includes(o.status)) orderCommission = 200;
                                else if (totalAmt <= 0 && subTotal > 0) orderCommission = (subTotal + taxAmt + deliveryFee) * 0.015;
                                else orderCommission = totalAmt * 0.20;
                                return acc + orderCommission;
                              }, 0).toFixed(2)}</td>
                              <td colSpan={4}></td>
                              <td className="px-4 py-4 text-blue-600">৳{transactionOrders.reduce((acc, o) => acc + parseFloat(o.tax_amount || 0), 0).toFixed(2)}</td>
                              <td></td>
                            </tr>
                          )}
                          {transactionOrders.length === 0 && (
                            <tr>
                              <td colSpan={14} className="px-4 py-8 text-center text-slate-500">No transactions found for this seller.</td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Review' && (
          <div className="p-6 bg-slate-50/30">
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">Product Reviews</h3>
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{reviews.length}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-white border-b border-slate-200 text-xs text-slate-800 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-16">SL</th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Rating</th>
                      <th className="px-6 py-4">Review</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviews.length > 0 ? reviews.map((r, i) => {
                      const product = products.find(p => p.id === r.product_id);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">{i + 1}</td>
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 overflow-hidden">
                              {product?.thumbnail_url ? <img src={product.thumbnail_url} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-400 m-2.5" />}
                            </div>
                            <span className="font-medium text-slate-700 line-clamp-1">{product?.name_en || 'Unknown Product'}</span>
                          </td>
                          <td className="px-6 py-4">{r.customers ? `${r.customers.first_name} ${r.customers.last_name}` : 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="font-bold text-slate-700">{r.rating}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate text-xs">{r.comment}</td>
                          <td className="px-6 py-4 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No reviews found for this seller's products.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
