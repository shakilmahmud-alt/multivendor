import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Printer, Calendar, User, ShoppingBag, MapPin, Truck, Store, Edit, FileText } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);

  const currentUserStr = localStorage.getItem('user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isSeller = currentUser?.role === 'seller';

  // Form State
  const [initialStatus, setInitialStatus] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [deliveryType, setDeliveryType] = useState('Choose Delivery Type');
  const [refundAmount, setRefundAmount] = useState('');
  
  // Third Party
  const [thirdPartyCourier, setThirdPartyCourier] = useState('Steadfast_courier');
  const [trackingId, setTrackingId] = useState('');
  
  // Cancellation
  const [cancelReason, setCancelReason] = useState('');

  // Self Delivery
  const [deliveryMen, setDeliveryMen] = useState<any[]>([]);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState('');
  const [deliverymanFee, setDeliverymanFee] = useState('0');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  useEffect(() => {
    fetchOrder();
    fetchDeliveryMen();
  }, [id]);

  useEffect(() => {
    if (!loading && order) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('print') === 'true') {
        setTimeout(() => window.print(), 500);
      }
    }
  }, [loading, order]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(first_name, last_name, email, phone), delivery_men(id, name, phone, avatar_url)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Fetch order error:", error);
        throw error;
      }

      if (data.seller_id) {
        const { data: seller } = await supabase.from('sellers').select('*').eq('id', data.seller_id).single();
        data.sellers = seller;
        
        const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', data.seller_id);
        if (count !== null) setTotalOrders(count);
      }
      
      setOrder(data);
      
      // Initialize state from DB (Map DB status to UI Status)
      const mappedStatus = data.status === 'pending' ? 'Pending' :
                           data.status === 'confirmed' ? 'Confirmed' :
                           data.status === 'packaging' ? 'Packaging' :
                           data.status === 'out_for_delivery' ? 'Out For Delivery' :
                           data.status === 'delivered' ? 'Delivered' :
                           data.status === 'returned' ? 'Returned' :
                           data.status === 'failed_to_deliver' ? 'Failed to Deliver' :
                           data.status === 'canceled' ? 'Canceled' : 'Pending';

      setInitialStatus(mappedStatus);
      setOrderStatus(mappedStatus);
      setPaymentStatus(data.payment_status || 'unpaid');
      setDeliveryType(data.delivery_type || 'Choose Delivery Type');
      if (data.third_party_courier) setThirdPartyCourier(data.third_party_courier);
      if (data.tracking_id) setTrackingId(data.tracking_id);
      if (data.delivery_man_id) setSelectedDeliveryMan(data.delivery_man_id);
      if (data.deliveryman_fee) setDeliverymanFee(data.deliveryman_fee.toString());
      if (data.expected_delivery_date) setExpectedDeliveryDate(data.expected_delivery_date);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryMen = async () => {
    try {
      const { data, error } = await supabase.from('delivery_men').select('*');
      if (!error && data) {
        setDeliveryMen(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveUpdates = async () => {
    setSaving(true);
    try {
      const dbStatus = orderStatus === 'Pending' ? 'pending' :
                       orderStatus === 'Confirmed' ? 'confirmed' :
                       orderStatus === 'Packaging' ? 'packaging' :
                       orderStatus === 'Out For Delivery' ? 'out_for_delivery' :
                       orderStatus === 'Delivered' ? 'delivered' :
                       orderStatus === 'Returned' ? 'returned' :
                       orderStatus === 'Failed to Deliver' ? 'failed_to_deliver' :
                       orderStatus === 'Canceled' ? 'canceled' : 'pending';

      const updates: any = {
        status: dbStatus,
        payment_status: paymentStatus,
        delivery_type: deliveryType !== 'Choose Delivery Type' ? deliveryType : null,
      };

      if (dbStatus === 'canceled') {
        if (isSeller && !cancelReason.trim() && orderStatus !== initialStatus) {
          showToast('Please provide a reason for cancellation', 'error');
          setSaving(false);
          return;
        }
        if (orderStatus !== initialStatus) {
          updates.cancel_reason = cancelReason;
          updates.canceled_by = isSeller ? 'seller' : 'admin';
        }
      }

      // Handle refund deduction
      let parsedRefund = 0;
      if (['Returned', 'Failed to Deliver', 'Canceled'].includes(orderStatus) && paymentStatus === 'paid' && refundAmount) {
        parsedRefund = parseFloat(refundAmount);
        const deliveryFee = parseFloat(order.deliveryman_fee || order.shipping_cost || 0);
        const currentTotal = parseFloat(order.total_amount || 0);
        const maxRefundAllowed = Math.max(0, currentTotal - deliveryFee);

        if (parsedRefund > maxRefundAllowed) {
          showToast(`Refund amount cannot exceed ৳${maxRefundAllowed.toFixed(2)} (excluding delivery charge)`, 'error');
          setSaving(false);
          return;
        }

        if (parsedRefund > 0) {
          const newTotal = currentTotal - parsedRefund;
          updates.total_amount = newTotal >= 0 ? newTotal : 0;
        }
      }

      if (deliveryType === 'By Third Party Delivery Service') {
        updates.third_party_courier = thirdPartyCourier;
        updates.tracking_id = trackingId;
        updates.delivery_man_id = null;
        updates.deliveryman_fee = 0;
        updates.expected_delivery_date = null;
      } else if (deliveryType === 'By Self Delivery Man') {
        updates.delivery_man_id = selectedDeliveryMan || null;
        updates.deliveryman_fee = parseFloat(deliverymanFee) || 0;
        updates.expected_delivery_date = expectedDeliveryDate || null;
        updates.third_party_courier = null;
        updates.tracking_id = null;
      }

      // Handle loyalty points awarding
      if (dbStatus === 'delivered' && !order.loyalty_points_awarded && order.customer_id && paymentStatus === 'paid') {
        const pointsToAward = Math.floor(parseFloat(order.total_amount || 0) / 100);
        if (pointsToAward > 0) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 180);
          
          const { error: loyaltyError } = await supabase.from('loyalty_points').insert([{
            customer_id: order.customer_id,
            order_id: id,
            points_earned: pointsToAward,
            remaining_points: pointsToAward,
            expires_at: expiresAt.toISOString()
          }]);
          
          if (!loyaltyError) {
            updates.loyalty_points_awarded = true;
          } else {
            console.error("Failed to award loyalty points", loyaltyError);
          }
        }
      }

      const { error } = await supabase.from('orders').update(updates).eq('id', id);
      if (error) throw error;
      
      // Auto-remove "New Order Received" notification for this order
      await supabase
        .from('notifications')
        .delete()
        .like('message', `%Order #${id.toUpperCase()}%`);
      
      // Handle refund creation
      if (parsedRefund > 0) {
        const { error: refundError } = await supabase.from('refund_requests').insert([{
          order_id: id,
          amount: parsedRefund,
          status: 'pending'
        }]);
        if (refundError) throw refundError;
        setRefundAmount('');
      }
      
      showToast('Order updated successfully!', 'success');
      fetchOrder(); // refresh
    } catch (err: any) {
      showToast(err.message || 'Error updating order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Order Details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found.</div>;

  const orderIdShort = order.id.toUpperCase();
  const dateStr = new Date(order.created_at).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const items = Array.isArray(order.items) ? order.items : [];
  
  const subTotal = items.reduce((acc: number, item: any) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
  const itemDiscount = 0; 
  const couponDiscount = order.coupon_discount || 0; 
  const tax = 0; 
  const deliveryFee = order.shipping_cost || 0;
  const finalTotal = order.total_amount || 0;

  const selectedRiderInfo = deliveryMen.find(d => d.id === selectedDeliveryMan);
  
  const shipping = order.shipping_address || {};
  const billing = order.billing_address || {};

  const customerName = order.customers ? `${order.customers.first_name} ${order.customers.last_name}`.trim() : shipping.name || billing.name || 'Guest customer';
  const customerPhone = order.customers?.phone || shipping.phone || billing.phone || 'N/A';
  const customerEmail = order.customers?.email || shipping.email || 'N/A';

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 font-sans text-sm pb-10">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 0;}
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Map Modal */}
      {showMapModal && order?.shipping_address && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg">Shipping Location</h3>
              <button onClick={() => setShowMapModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-4 h-[400px]">
              {(order.shipping_address.latitude && order.shipping_address.longitude) ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={`https://maps.google.com/maps?q=${order.shipping_address.latitude},${order.shipping_address.longitude}&hl=en&z=15&output=embed`}
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded">
                  <MapPin className="w-12 h-12 mb-2 opacity-50" />
                  <p>No exact map coordinates available for this order.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div className="flex items-center gap-2 mb-4 text-slate-700">
        <FileText className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-bold">Order Details</h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* Main Left Section */}
        <div className="flex-1 w-full space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Order ID #{orderIdShort}</h2>
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span>{dateStr}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end no-print">
              <button 
                onClick={() => setShowMapModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070c0] hover:bg-[#005a9c] text-white rounded font-medium text-[13px] transition shadow-sm"
              >
                <MapPin className="w-4 h-4" /> Show locations on map
              </button>
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070c0] hover:bg-[#005a9c] text-white rounded font-medium text-[13px] transition shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Status:</span>
              <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-sm">{orderStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Payment Method:</span>
              <span className="text-slate-800 font-bold">{order.payment_method || 'Cash On Delivery'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Payment Status:</span>
              <span className={`font-bold ${paymentStatus === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                {paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>

          {order.status === 'canceled' && order.cancel_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                Cancellation Details
              </h3>
              <p className="text-sm text-red-700">
                <span className="font-semibold">Canceled By:</span> <span className="capitalize">{order.canceled_by || 'Unknown'}</span>
              </p>
              <p className="text-sm text-red-700 mt-1">
                <span className="font-semibold">Reason:</span> {order.cancel_reason}
              </p>
            </div>
          )}

          {order.payment_method === 'offline' && order.offline_payment_info && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                Offline Payment Details
                <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {order.offline_payment_info.method}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Transaction ID</span>
                  <span className="text-sm font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded inline-block">
                    {order.offline_payment_info.transaction_id}
                  </span>
                </div>
                {order.offline_payment_info.note && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Payment Note</span>
                    <p className="text-sm text-slate-700 italic bg-white border border-slate-200 px-3 py-1.5 rounded">
                      "{order.offline_payment_info.note}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div id="printable-invoice" className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-4 text-center w-12">SL</th>
                    <th className="py-4 px-4">Item Details</th>
                    <th className="py-4 px-4 text-center">Item Price</th>
                    <th className="py-4 px-4 text-center">Tax</th>
                    <th className="py-4 px-4 text-center">Item Discount</th>
                    <th className="py-4 px-4 text-center">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item: any, idx: number) => {
                    const price = item.price || 0;
                    const qty = item.quantity || 1;
                    return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <img src={item.image || 'https://via.placeholder.com/40'} alt={item.name} className="w-12 h-12 object-contain rounded border border-slate-200 bg-white" />
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 whitespace-normal line-clamp-2 max-w-[250px]">{item.name || 'Product Item'}</div>
                            <div className="text-xs text-slate-500">Qty : {qty}</div>
                            <div className="text-xs text-slate-500">Unit price : ৳{Number(price).toFixed(2)} (Tax:0%)</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600">৳{Number(price).toFixed(2)}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600">৳{tax.toFixed(2)}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-600">৳{itemDiscount.toFixed(2)}</td>
                      <td className="py-4 px-4 text-center font-medium text-slate-800">৳{(Number(price) * qty).toFixed(2)}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end p-6 bg-white border-t border-slate-100">
              <div className="w-72 space-y-3 text-[13px]">
                <div className="flex justify-between items-center text-slate-700 font-bold"><span>Item price</span><span>৳{subTotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>Item Discount</span><span>- ৳{itemDiscount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center font-bold text-slate-800 pt-3 border-t border-slate-200"><span>Sub Total</span><span>৳{subTotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>Coupon discount</span><span>- ৳{couponDiscount.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>VAT/TAX</span><span>৳{tax.toFixed(2)}</span></div>
                <div className="flex justify-between items-start text-slate-600 font-medium">
                  <div className="flex flex-col">
                    <span>Delivery Fee</span>
                    {order.shipping_method && <span className="text-[10px] text-slate-400">({order.shipping_method})</span>}
                  </div>
                  <span>৳{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-800 text-base pt-3 border-t border-slate-200"><span>Total</span><span>৳{Number(finalTotal).toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebars (No Print) */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6 no-print">
          
          {/* Order & Shipping Info Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 text-center font-bold text-slate-800">
              Order & Shipping Info
            </div>
            
            <div className="p-5 space-y-5 text-[13px]">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Change Order Status</label>
                <select 
                  className="w-full border border-slate-300 rounded p-2.5 text-slate-700 outline-none focus:border-[#0070c0]"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                >
                  {(() => {
                    const statusRanks: Record<string, number> = {
                      'Pending': 1,
                      'Confirmed': 2,
                      'Packaging': 3,
                      'Out For Delivery': 4,
                      'Delivered': 5,
                      'Returned': 6,
                      'Failed to Deliver': 6,
                      'Canceled': 6,
                    };
                    const currentRank = statusRanks[initialStatus] || 0;
                    const options = [
                      'Pending', 'Confirmed', 'Packaging', 'Out For Delivery', 'Delivered', 'Returned', 'Failed to Deliver', 'Canceled'
                    ];

                    return options.map(opt => (
                      <option 
                        key={opt} 
                        value={opt} 
                        disabled={isSeller && statusRanks[opt] < currentRank}
                      >
                        {opt}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {orderStatus === 'Canceled' && isSeller && (
                <div className="mb-4">
                  <label className="block font-bold text-slate-700 mb-2">Reason for Cancellation <span className="text-red-500">*</span></label>
                  <textarea 
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter reason..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  ></textarea>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold">Payment Status</span>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${paymentStatus === 'paid' ? 'text-[#0070c0]' : 'text-slate-500'}`}>
                    {paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                  <button 
                    onClick={() => setPaymentStatus(prev => prev === 'paid' ? 'unpaid' : 'paid')}
                    className={`relative w-11 h-6 rounded-full transition-colors ${paymentStatus === 'paid' ? 'bg-[#0070c0]' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${paymentStatus === 'paid' ? 'translate-x-5' : ''}`}></div>
                  </button>
                </div>
              </div>

              {['Returned', 'Failed to Deliver', 'Canceled'].includes(orderStatus) && paymentStatus === 'paid' && (
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <label className="block font-bold text-red-600 mb-2 text-xs uppercase tracking-wide">Refund Amount (৳)</label>
                  <input 
                    type="number"
                    className="w-full border border-red-300 rounded p-2 text-slate-700 outline-none focus:border-red-500 text-sm"
                    placeholder="Enter amount to refund..."
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                  <p className="text-[11px] text-red-500 mt-1.5 font-medium">This amount will be deducted from the total order amount.</p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-2">Shipping Method (Inside Dhaka )</label>
                <select 
                  className="w-full border border-slate-300 rounded p-2.5 text-slate-700 outline-none focus:border-[#0070c0]"
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                >
                  <option value="Choose Delivery Type">Choose Delivery Type</option>
                  <option value="By Self Delivery Man">By Self Delivery Man</option>
                  <option value="By Third Party Delivery Service">By Third Party Delivery Service</option>
                </select>
              </div>

              {/* Dynamic Delivery Sections */}
              {deliveryType === 'By Third Party Delivery Service' && (
                <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3">
                  <div className="flex gap-3 items-center">
                    <Truck className="w-5 h-5 text-[#0070c0]" />
                    <div>
                      <div className="font-bold text-slate-800 text-[13px]">{thirdPartyCourier}</div>
                      <div className="text-xs text-slate-500">Track ID : {trackingId || 'Not set'}</div>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Update Track ID..." 
                    className="w-full border border-slate-300 rounded p-1.5 text-xs outline-none focus:border-[#0070c0]"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                  />
                </div>
              )}

              {deliveryType === 'By Self Delivery Man' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Delivery Man</label>
                    <select 
                      className="w-full border border-slate-300 rounded p-2 text-[13px] text-slate-700 outline-none focus:border-blue-500"
                      value={selectedDeliveryMan}
                      onChange={(e) => setSelectedDeliveryMan(e.target.value)}
                    >
                      <option value="">Select a Delivery Man</option>
                      {deliveryMen.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                      ))}
                    </select>
                  </div>

                  {selectedRiderInfo && (
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 flex gap-3 items-center">
                      <img src={selectedRiderInfo.avatar_url || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="font-bold text-slate-800 text-[13px]">{selectedRiderInfo.name}</div>
                        <div className="text-xs text-slate-500">{selectedRiderInfo.phone}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={saveUpdates}
                disabled={saving}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded font-bold text-[13px] transition disabled:opacity-50 mt-4"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

            </div>
          </div>

          {/* Customer Information Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 relative">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
              <User className="w-4 h-4 text-slate-500" />
              <h3>Customer Information</h3>
            </div>
            <div className="flex items-center gap-4 text-[13px]">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <div className="font-bold text-slate-800">{customerName}</div>
                <div className="text-slate-500">
                  {order.customers ? 'Registered Customer' : 'Guest Customer'}
                </div>
                <div className="text-slate-800 font-medium">{customerPhone}</div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 relative">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
              <User className="w-4 h-4 text-slate-500" />
              <h3>Shipping address</h3>
            </div>
            <button className="absolute top-4 right-4 text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4"/></button>
            <div className="space-y-1.5 text-[13px] text-slate-600">
              <div>Name : <span className="font-medium text-slate-800">{shipping.name || customerName}</span></div>
              <div>Contact : <span className="font-medium text-slate-800">{shipping.phone || customerPhone}</span></div>
              <div>Country : <span className="font-medium text-slate-800">{shipping.country || 'N/A'}</span></div>
              <div>City : <span className="font-medium text-slate-800">{shipping.city || 'N/A'}</span></div>
              <div>State : <span className="font-medium text-slate-800">{shipping.state || 'N/A'}</span></div>
              <div>Zip code : <span className="font-medium text-slate-800">{shipping.zip || 'N/A'}</span></div>
              <div className="flex items-start gap-1"><MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" /> <span className="font-medium text-slate-800">{shipping.address || 'N/A'}</span></div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 relative">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
              <User className="w-4 h-4 text-slate-500" />
              <h3>Billing address</h3>
            </div>
            <button className="absolute top-4 right-4 text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4"/></button>
            <div className="space-y-1.5 text-[13px] text-slate-600">
              <div>Name : <span className="font-medium text-slate-800">{billing.name || shipping.name || customerName}</span></div>
              <div>Contact : <span className="font-medium text-slate-800">{billing.phone || shipping.phone || customerPhone}</span></div>
              <div>Country : <span className="font-medium text-slate-800">{billing.country || shipping.country || 'N/A'}</span></div>
              <div>City : <span className="font-medium text-slate-800">{billing.city || shipping.city || 'N/A'}</span></div>
              <div>State : <span className="font-medium text-slate-800">{billing.state || shipping.state || 'N/A'}</span></div>
              <div>Zip code : <span className="font-medium text-slate-800">{billing.zip || shipping.zip || 'N/A'}</span></div>
              <div className="flex items-start gap-1"><MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" /> <span className="font-medium text-slate-800">{billing.address || shipping.address || 'N/A'}</span></div>
            </div>
          </div>

          {/* Shop Information */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 relative">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
              <Store className="w-4 h-4 text-slate-500" />
              <h3>Shop Information</h3>
            </div>
            <div className="flex items-center gap-4 text-[13px]">
              <div className="w-12 h-12 bg-white border border-slate-100 rounded flex items-center justify-center shrink-0 p-1">
                {order.sellers?.shop_logo_url ? (
                  <img src={order.sellers.shop_logo_url} className="w-full h-full object-contain" alt="Shop" />
                ) : (
                  <span className="text-orange-500 font-bold text-[10px]">HolidayMart</span>
                )}
              </div>
              <div>
                <div className="font-bold text-slate-800">{order.sellers?.shop_name || 'In-House Store'}</div>
                <div className="text-slate-500">{totalOrders} Orders Served</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
