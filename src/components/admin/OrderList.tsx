import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Search, Download, Eye, Filter, ShoppingCart } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function OrderList() {
  const { status } = useParams<{ status: string }>();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/seller') ? '/seller' : '/admin';
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState('All'); // 'All', 'POS', 'Website'
  const [storeType, setStoreType] = useState('All Stores');
  const [selectedShop, setSelectedShop] = useState('All');
  const [sellers, setSellers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [dateType, setDateType] = useState('Select Date Type');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchSellers = async () => {
      const { data } = await supabase.from('sellers').select('id, shop_name');
      if (data) setSellers(data);
    };
    fetchSellers();
  }, []);

  const isDateInRange = (dateStr: string) => {
    if (dateType === 'Select Date Type' || dateType === 'All') return true;
    const date = new Date(dateStr);
    const now = new Date();
    
    if (dateType === 'This Year') {
      return date.getFullYear() === now.getFullYear();
    }
    if (dateType === 'This Month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (dateType === 'This Week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
      firstDay.setHours(0,0,0,0);
      return date >= firstDay;
    }
    if (dateType === 'Custom Date') {
      if (!startDate || !endDate) return true;
      const s = new Date(startDate); s.setHours(0,0,0,0);
      const e = new Date(endDate); e.setHours(23,59,59,999);
      return date >= s && date <= e;
    }
    return true;
  };

  useEffect(() => {
    fetchOrders();
  }, [status, orderType]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      let query = supabase.from('orders').select('*, customers(first_name, last_name), sellers(shop_name)').order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status.replace('_', ' '));
      }

      if (user && user.role === 'seller') {
        query = query.eq('seller_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusName: string) => {
    const s = statusName?.toLowerCase() || '';
    if (s.includes('delivered') || s.includes('confirmed')) return 'text-emerald-500 bg-emerald-50';
    if (s.includes('pending') || s.includes('unturned')) return 'text-blue-500 bg-blue-50';
    if (s.includes('canceled') || s.includes('failed') || s.includes('returned')) return 'text-red-500 bg-red-50';
    if (s.includes('delivery')) return 'text-orange-500 bg-orange-50';
    if (s.includes('packaging')) return 'text-yellow-500 bg-yellow-50';
    return 'text-slate-500 bg-slate-50';
  };

  const getStatusBadge = (statusName: string) => {
    const s = statusName?.toLowerCase() || '';
    if (s.includes('delivered') || s.includes('confirmed')) return 'text-emerald-500';
    if (s.includes('pending') || s.includes('unturned')) return 'text-blue-500';
    if (s.includes('canceled') || s.includes('failed') || s.includes('returned')) return 'text-red-500';
    if (s.includes('delivery')) return 'text-orange-500';
    if (s.includes('packaging')) return 'text-yellow-500';
    return 'text-slate-500';
  };

  const pageTitle = status ? status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1) + ' Orders' : 'All Orders';

  const filteredOrders = orders.filter(order => {
    if (orderType === 'POS' && order.shipping_address?.type !== 'POS') return false;
    if (orderType === 'Website' && order.shipping_address?.type === 'POS') return false;
    if (searchQuery && !order.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (!isDateInRange(order.created_at)) return false;
    
    if (storeType === 'In House' && order.seller_id) return false;
    if (storeType === 'Shop') {
      if (!order.seller_id) return false;
      if (selectedShop !== 'All' && order.seller_id !== selectedShop) return false;
    }
    return true;
  });

  return (
    <div className="w-full space-y-4 font-sans text-sm">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <ShoppingCart className="w-5 h-5 text-slate-700" /> {/* Replaced icon if needed */}
        <h1 className="text-lg font-bold text-slate-800 capitalize">
          {pageTitle} <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs ml-2">{orders.length}</span>
        </h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-[13px] font-bold text-slate-800 mb-4">Filter Order</h2>
        <div className={`grid grid-cols-1 md:grid-cols-4 ${storeType === 'Shop' ? 'lg:grid-cols-5' : ''} gap-4`}>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Order Type</label>
            <select 
              className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="All">All</option>
              <option value="POS">POS</option>
              <option value="Website">Website</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Store</label>
            <select 
              className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
              value={storeType}
              onChange={(e) => { setStoreType(e.target.value); setSelectedShop('All'); }}
            >
              <option value="All Stores">All Stores</option>
              <option value="In House">In House</option>
              <option value="Shop">Shop</option>
            </select>
          </div>
          {storeType === 'Shop' && (
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Select Shop</label>
              <select 
                className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
              >
                <option value="All">All Shops</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Customer</label>
            <select className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400">
              <option>All customer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Date Type</label>
            <select 
              className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
            >
              <option value="Select Date Type">Select Date Type</option>
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
              <option value="Custom Date">Custom Date</option>
            </select>
          </div>
        </div>

        {dateType === 'Custom Date' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Start Date</label>
              <input type="date" className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">End Date</label>
              <input type="date" className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-4">
          <button 
            className="px-5 py-2 border border-slate-200 text-slate-600 rounded bg-white hover:bg-slate-50 font-medium"
            onClick={() => {
              setOrderType('All');
              setStoreType('All Stores');
              setSelectedShop('All');
              setSearchQuery('');
              setSelectedOrders([]);
              setDateType('Select Date Type');
              setStartDate('');
              setEndDate('');
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800">Order List</h2>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {filteredOrders.length}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by Order ID" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-4 py-1.5 border border-slate-200 rounded w-64 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            
            <button 
              onClick={() => {
                if (selectedOrders.length === 0) {
                  alert('Please select at least one order to export.');
                  return;
                }
                const selectedData = filteredOrders.filter(o => selectedOrders.includes(o.id)).map(o => ({
                  'Order ID': o.id,
                  'Order Date': new Date(o.created_at).toLocaleString(),
                  'Customer': o.customers ? `${o.customers.first_name} ${o.customers.last_name}`.trim() : o.shipping_address?.name || 'Guest',
                  'Total Amount': o.total_amount,
                  'Payment Status': o.payment_status,
                  'Order Status': o.status,
                  'Store': o.sellers?.shop_name || 'In House'
                }));
                const header = Object.keys(selectedData[0]).join(',');
                const csv = [header, ...selectedData.map(row => Object.values(row).map(val => `"${val}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Exported_Orders_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#0070c0] text-[#0070c0] hover:bg-blue-50 rounded text-sm font-medium transition"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(filteredOrders.map(o => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                    checked={
                      selectedOrders.length > 0 && 
                      selectedOrders.length === filteredOrders.length
                    }
                  />
                </th>
                <th className="py-3 px-4 w-12 text-center">SL</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Customer Info</th>
                <th className="py-3 px-4">Store</th>
                <th className="py-3 px-4 text-center">Total Amount</th>
                <th className="py-3 px-4 text-center">Order Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="py-8 text-center text-slate-500">Loading...</td></tr>
              ) : (() => {
                if (filteredOrders.length === 0) {
                  return <tr><td colSpan={9} className="py-8 text-center text-slate-500">No orders found.</td></tr>;
                }
                return filteredOrders.map((order, index) => {
                  const orderId = order.id;
                  const oDate = new Date(order.created_at).toLocaleString();
                  const custName = order.customers ? `${order.customers.first_name} ${order.customers.last_name}`.trim() : order.shipping_address?.name || 'Guest customer';
                  const store = order.sellers?.shop_name || 'In House';
                  const tAmount = Number(order.total_amount).toFixed(2);
                  const oStatus = order.status;
                  const pStatus = order.payment_status;

                  return (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300"
                          checked={selectedOrders.includes(orderId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders([...selectedOrders, orderId]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== orderId));
                            }
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {orderId} {order.shipping_address?.type === 'POS' && <span className="text-blue-500 font-normal">(POS)</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[13px]">{oDate}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 text-[13px]">{custName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[13px]">{store}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-slate-800 text-[13px]">৳{tAmount}</div>
                        <div className={`text-[10px] font-bold ${pStatus === 'paid' ? 'text-emerald-500' : 'text-red-500'}`}>{pStatus}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`bg-opacity-10 px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusColor(oStatus)}`}>
                          {oStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <Link to={`${basePath}/orders/details/${order.id}`} className="w-8 h-8 rounded border border-blue-200 text-blue-500 hover:bg-blue-50 flex items-center justify-center transition">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`${basePath}/orders/details/${order.id}?print=true`} className="w-8 h-8 rounded border border-emerald-200 text-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition">
                            <Download className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        
      </div>
      
    </div>
  );
}
