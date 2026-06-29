import React, { useState } from 'react';
import { X, Search, FileText, CheckCircle, Package, Truck, PackageCheck, Clock, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../components/ToastContext';

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const { addToast } = useToast();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId && phone) {
      try {
        const { data, error } = await supabase.from('orders')
          .select('*')
          .ilike('id', orderId);
          
        if (error || !data || data.length === 0) {
          addToast('Order not found!', 'error');
          setIsTracking(false);
          return;
        }
        
        // Find the exact matching order
        let matchedOrder = null;
        for (const o of data) {
          const orderPhone = o.shipping_address?.phone || o.billing_address?.phone || o.customer_phone;
          if (orderPhone && orderPhone === phone) {
            matchedOrder = o;
            break;
          }
        }

        if (!matchedOrder) {
          addToast('Phone number does not match this order!', 'error');
          setIsTracking(false);
          return;
        }

        setOrder(matchedOrder);
        setIsTracking(true);
      } catch (err) {
        console.error(err);
        addToast('Failed to track order', 'error');
      }
    }
  };

  const getSteps = () => {
    const defaultSteps = [
      { label: 'Order Placed', date: '', icon: ClipboardList, completed: false },
      { label: 'Order Confirmed', date: '', icon: CheckCircle, completed: false },
      { label: 'Preparing Shipment', date: '', icon: Package, completed: false },
      { label: 'Order is on the way', date: '', icon: Truck, completed: false, extraInfo: 'Your Deliveryman Is Coming' },
      { label: 'Order Shipped', date: '', icon: CheckCircle, completed: false },
    ];
    
    if (!order) return defaultSteps;
    
    const dDate = new Date(order.created_at);
    const dateStr = `${dDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}, ${dDate.toLocaleDateString()}`;
    
    const statusMap: Record<string, number> = {
      'pending': 1,
      'confirmed': 2,
      'packaging': 3,
      'out_for_delivery': 4,
      'delivered': 5,
    };
    
    const currentIndex = statusMap[order.status] || 1;
    
    return defaultSteps.map((step, idx) => ({
      ...step,
      completed: idx < currentIndex,
      date: idx === 0 ? dateStr : ''
    }));
  };

  const steps = getSteps();

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-800 text-center mb-8">Track Order</h2>

        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto mb-16">
          <input 
            type="text" 
            placeholder="Order id"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full sm:w-1/3 border border-slate-200 rounded-md p-3 text-sm focus:ring-1 focus:ring-orange-500 outline-none text-slate-600"
            required
          />
          <input 
            type="tel" 
            placeholder="Your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full sm:w-1/3 border border-slate-200 rounded-md p-3 text-sm focus:ring-1 focus:ring-orange-500 outline-none text-slate-600"
            required
          />
          <button 
            type="submit" 
            className="w-full sm:w-1/3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-md transition text-sm shadow-sm"
          >
            Track Order
          </button>
        </form>

        {!isTracking ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-10">
            <Truck className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-sm font-medium text-center">Enter your order ID & phone number to get<br/>delivery updates</p>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <h3 className="text-center text-lg font-bold text-slate-800 mb-12">
              Your Order : <span className="text-orange-500">{orderId}</span>
            </h3>

            {/* Stepper Timeline */}
            <div className="relative flex items-start justify-between mb-16 mt-8">
              {/* Connecting dashed line */}
              <div className="absolute top-6 left-12 right-12 h-0.5 bg-slate-200 -z-10 border-t border-dashed border-slate-300"></div>
              
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className={`flex flex-col items-center gap-3 w-1/5 ${!step.completed ? 'opacity-40 grayscale' : ''}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.completed ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-blue-600 shadow-sm'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-slate-800">{step.label}</h4>
                      {step.date && (
                        <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {step.date}
                        </p>
                      )}
                      {step.extraInfo && (
                        <p className="text-[10px] text-slate-500 mt-1">{step.extraInfo}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded transition text-sm shadow-sm"
              >
                View Order Details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ORDER DETAILS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-bold text-slate-800">Order # {orderId}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Header Row */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-700 text-sm flex-1">Product Details</span>
                <span className="font-bold text-slate-700 text-sm w-24 text-center">QTY</span>
                <span className="font-bold text-slate-700 text-sm w-32 text-right">Sub Total</span>
              </div>

              {/* Product Items */}
              {order?.items && order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center py-6 border-b border-slate-100">
                  <div className="flex-1 flex gap-4 items-center">
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded p-1 flex items-center justify-center shadow-sm shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="max-h-full object-contain" />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-slate-800 mb-2">{item.name || 'Product Name'}</h4>
                      <p className="text-xs font-bold text-slate-600">
                        Unit Price : <span className="font-normal">৳{(item.price || 0).toFixed(2)} (Tax:0 %)</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-24 text-center font-medium text-slate-700 text-sm">
                    {item.quantity || 1}
                  </div>
                  <div className="w-32 text-right font-medium text-slate-700 text-sm">
                    ৳{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}

              {/* Summary Block */}
              <div className="bg-slate-50 mt-6 rounded-lg p-6 border border-slate-100">
                <div className="grid grid-cols-6 gap-4 text-center text-sm font-bold text-slate-500 mb-6 pb-4 border-b border-slate-200">
                  <div>Sub Total</div>
                  <div>Shipping</div>
                  <div>Tax</div>
                  <div>Discount</div>
                  <div>Coupon Discount</div>
                  <div className="text-slate-800">Total</div>
                </div>
                <div className="grid grid-cols-6 gap-4 text-center text-sm font-medium text-slate-700">
                  <div>৳{order?.total_amount ? (Number(order.total_amount) + (order.coupon_discount || 0) - (order.shipping_cost || 0)).toFixed(2) : '0.00'}</div>
                  <div>৳{(order?.shipping_cost || 0).toFixed(2)}</div>
                  <div>৳0.00</div>
                  <div>-৳0.00</div>
                  <div>- ৳{(order?.coupon_discount || 0).toFixed(2)}</div>
                  <div className="font-bold text-slate-800">৳{order?.total_amount ? Number(order.total_amount).toFixed(2) : '0.00'}</div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
