import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Download, ShoppingCart, Store as StoreIcon, DollarSign, Briefcase, Box, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useToast } from '../ToastContext';

export default function EarningReports() {
  const [activeTab, setActiveTab] = useState<'admin' | 'vendor'>('admin');
  const [filter, setFilter] = useState('This Year');
  const [loading, setLoading] = useState(true);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const { showToast } = useToast();

  // Admin Data
  const [adminEarnings, setAdminEarnings] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState({ commission: 0, inHouse: 0, shipping: 0, discountGiven: 0 });
  const [totalInHouseProducts, setTotalInHouseProducts] = useState(0);
  const [totalShops, setTotalShops] = useState(0);

  // Vendor Data
  const [vendorEarnings, setVendorEarnings] = useState<any[]>([]);
  const [vendorStats, setVendorStats] = useState({ totalVendors: 0, totalProducts: 0, approved: 0, pending: 0, denied: 0, totalEarning: 0 });
  const [vendorWallet, setVendorWallet] = useState({ withdrawable: 0, pending: 0, withdrawn: 0, disbursed: 0, hold: 0, penalty: 0 });

  // Admin Chart
  const [adminChartData, setAdminChartData] = useState<any[]>([]);
  
  // Vendor Chart
  const [vendorChartData, setVendorChartData] = useState<any[]>([]);

  useEffect(() => {
    if (filter !== 'Custom Date') {
      fetchData();
    }
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Determine Date Range
      const now = new Date();
      let startDate = new Date(0);
      const isCustom = filter === 'Custom Date';

      if (isCustom && (!startDateInput || !endDateInput)) {
        showToast('Please select both start and end dates', 'error');
        setLoading(false);
        return;
      }

      if (filter === 'This Year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else if (filter === 'This Month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (filter === 'This Week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
      }

      // 2. Fetch Orders
      let query = supabase.from('orders').select('*');
      
      if (isCustom) {
        const end = new Date(endDateInput);
        end.setHours(23, 59, 59, 999);
        query = query
          .gte('created_at', new Date(startDateInput).toISOString())
          .lte('created_at', end.toISOString());
      } else {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: ordersData, error: ordersError } = await query.order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Fetch Refunds
      const { data: refundsData } = await supabase
        .from('refund_requests')
        .select('order_id, amount, status')
        .eq('status', 'approved');

      // Fetch Coupons to check Bearer
      const { data: couponsData } = await supabase
        .from('coupons')
        .select('code, bearer');
        
      const couponsMap = new Map(couponsData?.map(c => [c.code, c.bearer]) || []);

      // Filter paid/successful orders (for simplicity, we assume delivered/completed or just all non-canceled orders that contributed to revenue. We will use delivered and confirmed, or simply all non-canceled)
      // Actually, standard logic uses `payment_status` but it's not selected. Let's use all orders except canceled/failed/returned for earning, but refund logic handles returned.
      // EcomMatrix usually counts all confirmed/delivered. Let's just use total_amount as base, and subtract refunds.
      
      const validOrders = ordersData || [];

      // --- ADMIN EARNING CALCULATION ---
      let totalCommission = 0;
      let totalInHouse = 0;
      let totalShipping = 0;
      let totalDiscountGiven = 0;

      const monthlyAdminMap: Record<string, any> = {};

      validOrders.forEach(o => {
        const status = o.status?.toLowerCase() || '';
        const isValidStatus = ['delivered', 'completed', 'returned', 'failed_to_deliver'].includes(status) || ((status === 'canceled' || status === 'cancelled') && o.canceled_by === 'seller');
        if (!isValidStatus) return;

        const date = new Date(o.created_at);
        const monthYear = `${date.toLocaleString('default', { month: 'long' })}-${date.getFullYear()}`;
        
        if (!monthlyAdminMap[monthYear]) {
          monthlyAdminMap[monthYear] = {
            duration: monthYear, inHouse: 0, commission: 0, shipping: 0, discount: 0, tax: 0, refund: 0, total: 0
          };
        }

        const currentTotalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
        const ship = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
        const taxAmt = parseFloat(o.tax_amount || 0);
        const items = Array.isArray(o.items) ? o.items : [];
        const subTotal = items.reduce((acc: number, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);

        let orderCommission = 0;
        let vendorTotalAmt = currentTotalAmt;
        let inHouseAmt = 0;

        // Commission Logic
        if (o.seller_id) {
          // Seller order
          const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled', 'cancelled'].includes(o.status?.toLowerCase());
          const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status?.toLowerCase());
          
          if (excludeDelivery) {
            vendorTotalAmt = Math.max(0, vendorTotalAmt - ship);
          }

          if (isSpecialStatus) {
            orderCommission = 200;
          } else if (vendorTotalAmt <= 0 && subTotal > 0) {
            orderCommission = (subTotal + taxAmt + ship) * 0.015;
          } else {
            orderCommission = vendorTotalAmt * 0.20;
          }

          totalCommission += orderCommission;
          monthlyAdminMap[monthYear].commission += orderCommission;
        } else {
          // InHouse order
          inHouseAmt = currentTotalAmt;
          totalInHouse += inHouseAmt;
          monthlyAdminMap[monthYear].inHouse += inHouseAmt;
        }

        totalShipping += ship;
        monthlyAdminMap[monthYear].shipping += ship;

        // Discount logic
        if (o.applied_coupon && couponsMap.get(o.applied_coupon) === 'admin') {
          const disc = parseFloat(o.coupon_discount || 0);
          totalDiscountGiven += disc;
          monthlyAdminMap[monthYear].discount += disc;
        }

        // Refund logic
        const orderRefunds = refundsData?.filter(r => r.order_id === o.id) || [];
        const refundAmt = orderRefunds.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
        monthlyAdminMap[monthYear].refund += refundAmt;

        // Total
        monthlyAdminMap[monthYear].total += (inHouseAmt + orderCommission + ship - monthlyAdminMap[monthYear].discount - refundAmt);
      });

      setAdminStats({
        commission: totalCommission,
        inHouse: totalInHouse,
        shipping: totalShipping,
        discountGiven: totalDiscountGiven
      });

      const adminTableData = Object.values(monthlyAdminMap);
      setAdminEarnings(adminTableData);
      
      const aChartData = adminTableData.map(d => ({
        name: d.duration,
        Earning: d.total
      }));
      setAdminChartData(aChartData);

      const { data: inHouseProds } = await supabase.from('in_house_products').select('id, attributes');
      
      const inHouseCount = inHouseProds?.filter(p => !p.attributes?.seller_id).length || 0;
      const { count: shopsCount } = await supabase.from('sellers').select('*', { count: 'exact', head: true });
      
      setTotalInHouseProducts(inHouseCount);
      setTotalShops(shopsCount || 0);

      // --- VENDOR EARNING CALCULATION ---
      const { data: sellersData } = await supabase.from('sellers').select('*');
      const allProducts = inHouseProds || [];
      const { data: withdrawals } = await supabase.from('withdraw_requests').select('amount, status');

      const sellerMap: Record<string, any> = {};
      
      sellersData?.forEach(s => {
        sellerMap[s.id] = {
          info: s.shop_name,
          orderEarn: 0,
          shippingEarn: 0,
          commission: 0,
          discount: 0,
          tax: 0,
          refund: 0,
          total: 0
        };
      });

      let totalVendorPenalty = 0;
      let totalDisbursed = 0;
      let totalHold = 0;

      validOrders.forEach(o => {
        const status = o.status?.toLowerCase() || '';
        const isValidStatus = ['delivered', 'completed', 'returned', 'failed_to_deliver'].includes(status) || ((status === 'canceled' || status === 'cancelled') && o.canceled_by === 'seller');
        if (!isValidStatus) return;

        if (o.seller_id && sellerMap[o.seller_id]) {
          const currentTotalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
          const ship = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
          const taxAmt = parseFloat(o.tax_amount || 0);
          const items = Array.isArray(o.items) ? o.items : [];
          const subTotal = items.reduce((acc: number, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
          
          let orderCommission = 0;
          let vendorTotalAmt = currentTotalAmt;

          const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled', 'cancelled'].includes(o.status?.toLowerCase());
          const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status?.toLowerCase());
          
          if (excludeDelivery) {
            vendorTotalAmt = Math.max(0, vendorTotalAmt - ship);
          }

          if (isSpecialStatus) {
            orderCommission = 200;
            totalVendorPenalty += 200;
          } else if (vendorTotalAmt <= 0 && subTotal > 0) {
            orderCommission = (subTotal + taxAmt + ship) * 0.015;
          } else {
            orderCommission = vendorTotalAmt * 0.20;
          }

          let sellerEarn = vendorTotalAmt - ship - orderCommission;
          
          if (o.shipping_address?.disbursement_status === 'Disbursed') {
            totalDisbursed += sellerEarn;
          } else {
            totalHold += sellerEarn;
          }
          
          sellerMap[o.seller_id].orderEarn += sellerEarn;
          sellerMap[o.seller_id].shippingEarn += 0;
          sellerMap[o.seller_id].commission += orderCommission;

          if (o.applied_coupon && couponsMap.get(o.applied_coupon) === 'seller') {
            const disc = parseFloat(o.coupon_discount || 0);
            sellerMap[o.seller_id].discount += disc;
          }

          const orderRefunds = refundsData?.filter(r => r.order_id === o.id) || [];
          const refundAmt = orderRefunds.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
          sellerMap[o.seller_id].refund += refundAmt;

          sellerMap[o.seller_id].total += (sellerEarn - sellerMap[o.seller_id].discount - refundAmt);
        }
      });

      setVendorEarnings(Object.values(sellerMap).filter((v: any) => v.total > 0 || v.info));

      let pendingProd = 0;
      let approvedProd = 0;
      let deniedProd = 0;

      allProducts?.forEach(p => {
        if (p.attributes?.seller_id) {
          const status = p.attributes.request_status;
          if (status === 'new-requests' || status === 'update-requests') pendingProd++;
          else if (status === 'denied') deniedProd++;
          else if (status === 'approved') approvedProd++;
        }
      });

      const totalVendorEarn = Object.values(sellerMap).reduce((acc: number, val: any) => acc + val.total, 0);

      setVendorStats({
        totalVendors: shopsCount || 0,
        totalProducts: pendingProd + approvedProd + deniedProd,
        pending: pendingProd,
        approved: approvedProd,
        denied: deniedProd,
        totalEarning: totalVendorEarn
      });

      let pendingW = 0;
      let approvedW = 0;
      withdrawals?.forEach(w => {
        if (w.status === 'pending') pendingW += parseFloat(w.amount);
        if (w.status === 'approved') approvedW += parseFloat(w.amount);
      });

      setVendorWallet({
        withdrawable: totalVendorEarn - approvedW - pendingW,
        pending: pendingW,
        withdrawn: approvedW,
        disbursed: totalDisbursed,
        hold: totalHold,
        penalty: totalVendorPenalty
      });

      // Vendor Chart (Average Earning)
      const vChartData = adminTableData.map(d => ({
        name: d.duration,
        Average: d.total > 0 && shopsCount ? d.total / shopsCount : 0 // approximate average based on time
      }));
      setVendorChartData(vChartData);

    } catch (err) {
      console.error("Error fetching earning reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string, columns: any[]) => {
    const csvContent = [
      columns.map(c => c.header).join(','),
      ...data.map(row => columns.map(c => `"${c.accessor(row)}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('url');
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const adminPieData = [
    { name: 'Commission', value: adminStats.commission, color: '#f43f5e' }, // rose-500
    { name: 'In House', value: adminStats.inHouse, color: '#3b82f6' }, // blue-500
    { name: 'Shipping', value: adminStats.shipping, color: '#10b981' }, // emerald-500
  ];

  const vendorPieData = [
    { name: 'Disbursed Amount', value: vendorWallet.disbursed, color: '#0f172a' },
    { name: 'Hold Amount', value: vendorWallet.hold, color: '#3b82f6' },
    { name: 'Penalty', value: vendorWallet.penalty, color: '#94a3b8' },
  ];

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-2 mb-2 text-slate-700">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-bold">Earning Reports</h1>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200">
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('admin')}
        >
          Admin Earning
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'vendor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('vendor')}
        >
          Vendor Earning
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 mb-2">Filter Data</label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
              <option value="Custom Date">Custom Date</option>
            </select>
          </div>

          {filter === 'Custom Date' && (
            <>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                <input 
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                <input 
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button onClick={fetchData} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded text-sm font-bold transition">
              Filter
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'admin' && (
        <div className="space-y-6 animate-fadeIn">
          {/* STATS CARDS & CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col justify-center items-center relative overflow-hidden">
                <ShoppingCart className="w-10 h-10 text-blue-500 mb-2" />
                <h3 className="text-2xl font-black text-slate-800">৳{(adminStats.commission + adminStats.inHouse + adminStats.shipping).toLocaleString()}</h3>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">Total earnings</p>
                <div className="flex justify-between w-full text-center border-t border-slate-100 pt-4">
                  <div>
                    <div className="text-rose-500 font-bold text-sm">৳{adminStats.commission.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Commission</div>
                  </div>
                  <div>
                    <div className="text-blue-500 font-bold text-sm">৳{adminStats.inHouse.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 uppercase">In House</div>
                  </div>
                  <div>
                    <div className="text-emerald-500 font-bold text-sm">৳{adminStats.shipping.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Shipping</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{totalInHouseProducts}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total In House Products</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                  <StoreIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{totalShops}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Shop</p>
                </div>
              </div>
            </div>

            {/* Middle Chart */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Earning Statistics</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `৳${val}`} />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="Earning" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Pie */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Payment Statistics</h3>
              <div className="h-[200px] relative flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {adminPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-lg font-black text-slate-800">৳{((adminStats.commission + adminStats.inHouse + adminStats.shipping) / 1000).toFixed(1)}K+</div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Earnings</div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {adminPieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </div>
                    <div className="font-bold text-slate-800">৳{item.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* TABLE */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">Total Earnings</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{adminEarnings.length}</span>
              </div>
              <button 
                onClick={() => exportToCSV(adminEarnings, 'admin_earnings.csv', [
                  { header: 'Duration', accessor: (row: any) => row.duration },
                  { header: 'In-House Earning', accessor: (row: any) => row.inHouse },
                  { header: 'Commission Earning', accessor: (row: any) => row.commission },
                  { header: 'Earn From Shipping', accessor: (row: any) => row.shipping },
                  { header: 'Discount Given', accessor: (row: any) => row.discount },
                  { header: 'VAT/TAX', accessor: (row: any) => row.tax },
                  { header: 'Refund Given', accessor: (row: any) => row.refund },
                  { header: 'Total Earning', accessor: (row: any) => row.total }
                ])}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-4">SL</th>
                    <th className="py-4 px-4">Duration</th>
                    <th className="py-4 px-4">In-House Earning</th>
                    <th className="py-4 px-4">Commission Earning</th>
                    <th className="py-4 px-4">Earn From Shipping</th>
                    <th className="py-4 px-4">Discount Given</th>
                    <th className="py-4 px-4">VAT/TAX</th>
                    <th className="py-4 px-4">Refund Given</th>
                    <th className="py-4 px-4">Total Earning</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminEarnings.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4 text-slate-500">{index + 1}</td>
                      <td className="py-4 px-4 font-medium text-slate-800">{item.duration}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.inHouse).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.commission).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.shipping).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.discount).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.tax).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.refund).toLocaleString()}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">৳{Math.round(item.total).toLocaleString()}</td>
                      <td className="py-4 px-4 text-center">
                        <button className="p-2 border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition shadow-sm">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {adminEarnings.length === 0 && (
                    <tr><td colSpan={10} className="py-8 text-center text-slate-500">No data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendor' && (
        <div className="space-y-6 animate-fadeIn">
          {/* STATS CARDS & CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                  <StoreIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{vendorStats.totalVendors}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Vendor</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{vendorStats.totalProducts}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Vendor Products</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-center pt-2">
                  <div className="text-rose-500 font-bold text-xs"><span className="block text-lg">{vendorStats.denied}</span> Denied</div>
                  <div className="text-blue-500 font-bold text-xs"><span className="block text-lg">{vendorStats.pending}</span> Pending Request</div>
                  <div className="text-emerald-500 font-bold text-xs"><span className="block text-lg">{vendorStats.approved}</span> Approved</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">৳{vendorStats.totalEarning.toLocaleString()}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Earning</p>
                </div>
              </div>
            </div>

            {/* Middle Chart */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700">Earning Statistics</h3>
                <span className="text-xs text-slate-500 font-medium">Average Earning Value: ৳{(vendorStats.totalVendors > 0 ? vendorStats.totalEarning / vendorStats.totalVendors : 0).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vendorChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `৳${val}`} />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="Average" stroke="#3b82f6" strokeWidth={3} dot={{r:4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Pie */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Vendor Wallet Status</h3>
              <div className="h-[200px] relative flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {vendorPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-lg font-black text-slate-800">৳{((vendorWallet.withdrawable + vendorWallet.pending + vendorWallet.withdrawn) / 1000).toFixed(1)}K+</div>
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Wallet Amount</div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {vendorPieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </div>
                    <div className="font-bold text-slate-800">৳{Math.round(item.value).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* TABLE */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800">Total Vendor</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{vendorEarnings.length}</span>
              </div>
              <button 
                onClick={() => exportToCSV(vendorEarnings, 'vendor_earnings.csv', [
                  { header: 'Vendor Info', accessor: (row: any) => row.info },
                  { header: 'Earn From Order', accessor: (row: any) => row.orderEarn },
                  { header: 'Earn From Shipping', accessor: (row: any) => row.shippingEarn },
                  { header: 'Commission Given', accessor: (row: any) => row.commission },
                  { header: 'Discount Given', accessor: (row: any) => row.discount },
                  { header: 'Tax Collected', accessor: (row: any) => row.tax },
                  { header: 'Refund Given', accessor: (row: any) => row.refund },
                  { header: 'Total Earning', accessor: (row: any) => row.total }
                ])}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-4">SL</th>
                    <th className="py-4 px-4">Vendor Info</th>
                    <th className="py-4 px-4">Earn From Order</th>
                    <th className="py-4 px-4">Earn From Shipping</th>
                    <th className="py-4 px-4">Commission Given</th>
                    <th className="py-4 px-4">Discount Given</th>
                    <th className="py-4 px-4">Tax Collected</th>
                    <th className="py-4 px-4">Refund Given</th>
                    <th className="py-4 px-4">Total Earning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorEarnings.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4 text-slate-500">{index + 1}</td>
                      <td className="py-4 px-4 font-medium text-slate-800">{item.info}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.orderEarn).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.shippingEarn).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.commission).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.discount).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.tax).toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-600">৳{Math.round(item.refund).toLocaleString()}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">৳{Math.round(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                  {vendorEarnings.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-slate-500">No data found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
