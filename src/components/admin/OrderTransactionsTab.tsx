import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Download, ChevronDown, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function OrderTransactionsTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [inHouseProductsCount, setInHouseProductsCount] = useState(0);
  const [vendorProductsCount, setVendorProductsCount] = useState(0);
  const [sellers, setSellers] = useState<any[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All status');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [selectedShop, setSelectedShop] = useState('All');
  const [dateFilter, setDateFilter] = useState('This Year');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [statusFilter, sourceFilter, selectedShop, dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: sData } = await supabase.from('sellers').select('*');
      if (sData) setSellers(sData);

      const { data: pData } = await supabase.from('in_house_products').select('id, attributes');
      if (pData) {
        let inHouse = 0;
        let vendor = 0;
        pData.forEach(p => {
          if (p.attributes?.seller_id) vendor++;
          else inHouse++;
        });
        setInHouseProductsCount(inHouse);
        setVendorProductsCount(vendor);
      }

      let query = supabase
        .from('orders')
        .select('*, customers(first_name, last_name)')
        .order('created_at', { ascending: false });

      const { data: oData, error } = await query;
      if (error) throw error;
      
      let filteredOrders = oData || [];

      // Filter by date
      const now = new Date();
      if (dateFilter === 'This Year') {
        filteredOrders = filteredOrders.filter(o => new Date(o.created_at).getFullYear() === now.getFullYear());
      } else if (dateFilter === 'This Month') {
        filteredOrders = filteredOrders.filter(o => {
          const d = new Date(o.created_at);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
      } else if (dateFilter === 'This Week') {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= firstDay);
      }

      // Filter by status
      if (statusFilter !== 'All status') {
        filteredOrders = filteredOrders.filter(o => o.shipping_address?.disbursement_status === statusFilter);
      }

      // Filter by source
      if (sourceFilter === 'In-House') {
        filteredOrders = filteredOrders.filter(o => !o.seller_id);
      } else if (sourceFilter === 'Shop') {
        filteredOrders = filteredOrders.filter(o => o.seller_id);
        if (selectedShop !== 'All') {
          filteredOrders = filteredOrders.filter(o => o.seller_id === selectedShop);
        }
      }

      setOrders(filteredOrders);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    let csv = 'SL,Order Id,Shop Name,Customer Name,Total Product Amount,Product Discount,Coupon Discount,Discounted Amount,VAT/TAX,Shipping Charge,Order Amount,Delivered By,Admin Discount,Vendor Discount,Admin Commission,Admin Net Income,Vendor Net Income,Payment Method,Payment Status\n';
    
    orders.forEach((o, i) => {
      let totalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
      const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
      const taxAmt = parseFloat(o.tax_amount || 0);
      const items = Array.isArray(o.items) ? o.items : [];
      const subTotal = items.reduce((acc: number, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
      
      const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status?.toLowerCase());
      const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status?.toLowerCase());

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

      const vendorAmt = o.seller_id ? totalAmt - deliveryFee - orderCommission : 0;
      const adminNet = o.seller_id ? orderCommission : totalAmt;
      const disbursementStatus = o.shipping_address?.disbursement_status || 'Hold';
      const custName = o.customers ? `${o.customers.first_name || ''} ${o.customers.last_name || ''}`.trim() : (o.shipping_address?.name || 'Guest customer');
      const shopName = o.seller_id ? (sellers.find(s => s.id === o.seller_id)?.shop_name || 'Vendor') : 'In-House';

      const prodDiscount = 0; // Assuming 0 for now as items don't have separate discount
      const couponDiscount = parseFloat(o.coupon_discount || 0);
      const discountedAmt = subTotal - prodDiscount - couponDiscount;
      
      const adminDiscount = 0; // Depends on bearer
      const vendorDiscount = 0;

      csv += `"${i + 1}","${o.id.slice(0,8)}","${shopName}","${custName}","${subTotal.toFixed(2)}","${prodDiscount.toFixed(2)}","${couponDiscount.toFixed(2)}","${discountedAmt.toFixed(2)}","${taxAmt.toFixed(2)}","${deliveryFee.toFixed(2)}","${totalAmt.toFixed(2)}","admin","${adminDiscount.toFixed(2)}","${vendorDiscount.toFixed(2)}","${orderCommission.toFixed(2)}","${adminNet.toFixed(2)}","${vendorAmt.toFixed(2)}","${o.payment_method || 'cash'}","${disbursementStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Order_Transactions_${new Date().getTime()}.csv`;
    a.click();
  };

  // Stats
  const inHouseOrders = orders.filter(o => !o.seller_id).length;
  const vendorOrders = orders.filter(o => o.seller_id).length;
  
  const paymentStats = {
    cash: 0,
    digital: 0,
    wallet: 0,
    offline: 0,
    bkash: 0,
    nagad: 0,
    upay: 0,
    otherOffline: 0
  };

  const monthlyOrders = Array(12).fill(0);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  orders.forEach(o => {
    const d = new Date(o.created_at);
    if (d.getFullYear() === new Date().getFullYear()) {
      monthlyOrders[d.getMonth()] += parseFloat(o.total_amount || 0);
    }

    let totalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
    const pm = (o.payment_method || '').toLowerCase();
    
    if (pm === 'cash on delivery' || pm === 'cash') paymentStats.cash += totalAmt;
    else if (pm === 'wallet') paymentStats.wallet += totalAmt;
    else if (['sslcommerz', 'stripe', 'paypal'].includes(pm)) paymentStats.digital += totalAmt;
    else if (pm === 'offline payment') paymentStats.offline += totalAmt;
    else if (pm === 'bkash') paymentStats.bkash += totalAmt;
    else if (pm === 'nagad') paymentStats.nagad += totalAmt;
    else if (pm === 'upay') paymentStats.upay += totalAmt;
    else paymentStats.otherOffline += totalAmt;
  });

  const chartData = monthNames.map((name, i) => ({
    name: `${name}-${new Date().getFullYear()}`,
    Orders: monthlyOrders[i]
  }));

  const pieData = [
    { name: 'Cash payments', value: paymentStats.cash, color: '#0ea5e9' },
    { name: 'bKash payments', value: paymentStats.bkash, color: '#e11471' },
    { name: 'Nagad payments', value: paymentStats.nagad, color: '#ec1c24' },
    { name: 'Upay payments', value: paymentStats.upay, color: '#fcb116' },
    { name: 'Other Offline payments', value: paymentStats.otherOffline + paymentStats.offline, color: '#94a3b8' },
    { name: 'Digital payments', value: paymentStats.digital, color: '#3b82f6' },
    { name: 'Wallet payments', value: paymentStats.wallet, color: '#6366f1' },
  ].filter(d => d.value > 0);
  
  if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1, color: '#e2e8f0' });

  const totalPayments = pieData.reduce((acc, curr) => curr.name !== 'No Data' ? acc + curr.value : acc, 0);

  const renderTableData = () => {
    let filtered = orders;
    if (searchQuery) {
      filtered = filtered.filter(o => o.id.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return filtered.map((o, i) => {
      let totalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
      const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
      const taxAmt = parseFloat(o.tax_amount || 0);
      const items = Array.isArray(o.items) ? o.items : [];
      const subTotal = items.reduce((acc: number, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
      
      const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status?.toLowerCase());
      const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status?.toLowerCase());

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
      
      const vendorAmt = o.seller_id ? totalAmt - deliveryFee - orderCommission : 0;
      const adminNet = o.seller_id ? orderCommission : totalAmt;
      const disbursementStatus = o.shipping_address?.disbursement_status || 'Hold';
      const custName = o.customers ? `${o.customers.first_name || ''} ${o.customers.last_name || ''}`.trim() : (o.shipping_address?.name || 'Guest customer');
      const shopName = o.seller_id ? (sellers.find(s => s.id === o.seller_id)?.shop_name || 'Vendor') : 'In-House';

      const prodDiscount = 0; 
      const couponDiscount = parseFloat(o.coupon_discount || 0);
      const discountedAmt = subTotal - prodDiscount - couponDiscount;
      const adminDiscount = 0; 
      const vendorDiscount = 0;

      return (
        <tr key={o.id} className="hover:bg-slate-50 transition-colors text-xs border-b border-slate-100">
          <td className="px-4 py-3">{i + 1}</td>
          <td className="px-4 py-3 font-medium text-slate-800">{o.id.slice(0,8)}</td>
          <td className="px-4 py-3">{shopName}</td>
          <td className="px-4 py-3">{custName}</td>
          <td className="px-4 py-3">৳{subTotal.toFixed(2)}</td>
          <td className="px-4 py-3">৳{prodDiscount.toFixed(2)}</td>
          <td className="px-4 py-3">৳{couponDiscount.toFixed(2)}</td>
          <td className="px-4 py-3">৳{discountedAmt.toFixed(2)}</td>
          <td className="px-4 py-3">৳{taxAmt.toFixed(2)}</td>
          <td className="px-4 py-3">৳{deliveryFee.toFixed(2)}</td>
          <td className="px-4 py-3 font-bold text-slate-800">৳{totalAmt.toFixed(2)}</td>
          <td className="px-4 py-3 text-slate-500">admin</td>
          <td className="px-4 py-3">৳{adminDiscount.toFixed(2)}</td>
          <td className="px-4 py-3">৳{vendorDiscount.toFixed(2)}</td>
          <td className="px-4 py-3 text-blue-600">৳{orderCommission.toFixed(2)}</td>
          <td className="px-4 py-3">৳{adminNet.toFixed(2)}</td>
          <td className="px-4 py-3">৳{vendorAmt.toFixed(2)}</td>
          <td className="px-4 py-3 capitalize">{o.payment_method || 'cash'}</td>
          <td className="px-4 py-3 text-center">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${disbursementStatus === 'Disbursed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {disbursementStatus}
            </span>
          </td>
          <td className="px-4 py-3 text-center">
            <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition">
              <Download className="w-4 h-4" />
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="bg-white rounded border border-slate-200 p-4 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Filter Data</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All status">All status</option>
              <option value="Disbursed">Disbursed</option>
              <option value="Hold">Hold</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All</option>
              <option value="In-House">In-House</option>
              <option value="Shop">Shop</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {sourceFilter === 'Shop' && (
            <div className="relative flex-1 min-w-[200px]">
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full appearance-none border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Shops</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.shop_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
              <option value="Custom Date">Custom Date</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium transition">
            Filter
          </button>
        </div>
      </div>

      {/* Stats and Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full"><FileText className="w-6 h-6 text-blue-500" /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800">{orders.length}</h4>
                <span className="text-xs font-bold text-slate-500">Total Orders</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-blue-500 font-bold">{inHouseOrders} <span className="font-medium text-slate-400">In House Orders</span></div>
              <div className="text-emerald-500 font-bold mt-1">{vendorOrders} <span className="font-medium text-slate-400">Vendor Orders</span></div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-full"><FileText className="w-6 h-6 text-amber-500" /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800">{inHouseProductsCount + vendorProductsCount}</h4>
                <span className="text-xs font-bold text-slate-500">Total Products</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-blue-500 font-bold">{inHouseProductsCount} <span className="font-medium text-slate-400">In House Products</span></div>
              <div className="text-emerald-500 font-bold mt-1">{vendorProductsCount} <span className="font-medium text-slate-400">Vendor Products</span></div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-full"><FileText className="w-6 h-6 text-red-500" /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800">{sellers.length}</h4>
                <span className="text-xs font-bold text-slate-500">Total Stores</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
          <h4 className="font-bold text-slate-700 mb-4">Order Statistics</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Orders" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
          <h4 className="font-bold text-slate-700 mb-4">Payment Statistics</h4>
          <div className="h-48 relative flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `৳${value.toFixed(2)}`} />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-lg font-black text-slate-800">৳{totalPayments >= 1000 ? (totalPayments/1000).toFixed(1) + 'K+' : totalPayments.toFixed(2)}</span>
               <span className="text-[10px] text-slate-500 font-medium">Completed payments</span>
             </div>
          </div>
          <div className="mt-2 space-y-1">
            {pieData.filter(d => d.name !== 'No Data').map((d, i) => (
              <div key={i} className="flex items-center text-xs">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: d.color }}></div>
                <span className="text-slate-600 flex-1">{d.name}</span>
                <span className="font-medium text-slate-800">(৳{d.value.toFixed(2)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">Total Transactions</h3>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{orders.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by order id" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 w-48"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition">
              Search
            </button>
            <button onClick={downloadCSV} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-white border-b border-slate-200 text-xs text-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4">SL</th>
                <th className="px-4 py-4">Order Id</th>
                <th className="px-4 py-4">Shop Name</th>
                <th className="px-4 py-4">Customer Name</th>
                <th className="px-4 py-4">Total Product Amount</th>
                <th className="px-4 py-4">Product Discount</th>
                <th className="px-4 py-4">Coupon Discount</th>
                <th className="px-4 py-4">Discounted Amount</th>
                <th className="px-4 py-4">VAT/TAX</th>
                <th className="px-4 py-4">Shipping Charge</th>
                <th className="px-4 py-4">Order Amount</th>
                <th className="px-4 py-4">Delivered By</th>
                <th className="px-4 py-4">Admin Discount</th>
                <th className="px-4 py-4">Vendor Discount</th>
                <th className="px-4 py-4">Admin Commission</th>
                <th className="px-4 py-4">Admin Net Income</th>
                <th className="px-4 py-4">Vendor Net Income</th>
                <th className="px-4 py-4">Payment Method</th>
                <th className="px-4 py-4 text-center">Payment Status</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {renderTableData()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
