import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Download, ChevronDown, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function GrossProfitReport() {
  const [profitData, setProfitData] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('This Year');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: coupons } = await supabase.from('coupons').select('code, coupon_bearer');
      const couponsMap = new Map(coupons?.map(c => [c.code, c.coupon_bearer]) || []);

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: oData, error } = await query;
      if (error) throw error;
      
      let filteredOrders = oData || [];

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

      const records: any[] = [];
      let tIncome = 0;
      let tExpense = 0;

      filteredOrders.forEach((o, index) => {
        let orderTotal = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
        const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
        const taxAmt = parseFloat(o.tax_amount || 0);
        const items = Array.isArray(o.items) ? o.items : [];
        const subTotal = items.reduce((acc: number, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);

        const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status?.toLowerCase());
        const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status?.toLowerCase());

        if (excludeDelivery) {
          orderTotal = Math.max(0, orderTotal - deliveryFee);
        }

        // Calculate Admin Income
        let income = 0;
        if (!o.seller_id) {
           // In-house order: admin gets the whole order total
           income = orderTotal;
        } else {
           // Vendor order: admin gets commission
           if (isSpecialStatus) {
             income = 200; // Flat penalty/commission
           } else if (orderTotal <= 0 && subTotal > 0) {
             income = (subTotal + taxAmt + deliveryFee) * 0.015;
           } else {
             income = orderTotal * 0.20;
           }
        }

        // Calculate Admin Expense
        let expense = 0;
        if (o.applied_coupon && couponsMap.get(o.applied_coupon) === 'admin' && parseFloat(o.coupon_discount) > 0) {
          expense += parseFloat(o.coupon_discount);
        }
        if (parseFloat(o.loyalty_discount) > 0) {
          expense += parseFloat(o.loyalty_discount);
        }

        const profit = income - expense;

        tIncome += income;
        tExpense += expense;

        records.push({
          id: o.id,
          date: o.created_at,
          orderId: o.id,
          income,
          expense,
          profit,
          source: o.seller_id ? 'Vendor' : 'In-House'
        });
      });

      setProfitData(records);
      setTotalIncome(tIncome);
      setTotalExpense(tExpense);
      setGrossProfit(tIncome - tExpense);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  profitData.forEach(p => {
    const d = new Date(p.date);
    if (d.getFullYear() === new Date().getFullYear()) {
      monthlyIncome[d.getMonth()] += p.income;
      monthlyExpense[d.getMonth()] += p.expense;
    }
  });

  const chartData = monthNames.map((name, i) => ({
    name: `${name}-${new Date().getFullYear().toString().slice(2)}`,
    Income: monthlyIncome[i],
    Expense: monthlyExpense[i],
    Profit: monthlyIncome[i] - monthlyExpense[i]
  }));

  const downloadCSV = () => {
    let csv = 'SL,Transaction Date,Order ID,Source,Income,Expense,Gross Profit\n';
    
    profitData.forEach((p, i) => {
      csv += `"${i + 1}","${new Date(p.date).toLocaleDateString()}","${p.orderId.slice(0,8)}","${p.source}","${p.income.toFixed(2)}","${p.expense.toFixed(2)}","${p.profit.toFixed(2)}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gross_Profit_Report_${new Date().getTime()}.csv`;
    a.click();
  };

  const renderTableData = () => {
    let filtered = profitData;
    if (searchQuery) {
      filtered = filtered.filter(p => p.orderId.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              No data to show
            </div>
          </td>
        </tr>
      );
    }

    return filtered.map((p, i) => (
      <tr key={p.id} className="hover:bg-slate-50 transition-colors text-xs border-b border-slate-100">
        <td className="px-4 py-3">{i + 1}</td>
        <td className="px-4 py-3">{new Date(p.date).toLocaleString()}</td>
        <td className="px-4 py-3 font-medium text-blue-600">{p.orderId.slice(0,8)}</td>
        <td className="px-4 py-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${p.source === 'In-House' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                {p.source}
            </span>
        </td>
        <td className="px-4 py-3 font-medium text-slate-700">৳{p.income.toFixed(2)}</td>
        <td className="px-4 py-3 font-medium text-slate-700">৳{p.expense.toFixed(2)}</td>
        <td className={`px-4 py-3 font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {p.profit >= 0 ? '+' : ''}৳{p.profit.toFixed(2)}
        </td>
      </tr>
    ));
  };

  return (
    <div className="p-6 font-sans bg-slate-50 min-h-screen text-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-emerald-600" />
          <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">Gross Profit Report</h1>
              <p className="text-sm text-slate-500 font-medium">Track your marketplace earnings and expenses</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-1.5 shadow-sm">
           <div className="relative">
            <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none border-none bg-transparent pl-4 pr-10 py-1.5 text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
                <option value="This Year">This Year</option>
                <option value="This Month">This Month</option>
                <option value="This Week">This Week</option>
                <option value="Custom Date">Custom Date</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
           </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-500">Total Income</h3>
                </div>
                <h2 className="text-3xl font-black text-slate-800">৳{totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-bold text-slate-500">Total Expenses</h3>
                </div>
                <h2 className="text-3xl font-black text-slate-800">৳{totalExpense.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-500">Gross Profit</h3>
                </div>
                <h2 className="text-3xl font-black text-slate-800">৳{grossProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
            </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-6 text-lg">Profit Overview</h3>
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                    <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 text-lg">Transaction Details</h3>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200">{profitData.length} Records</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by Order ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button onClick={downloadCSV} className="bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">SL</th>
                <th className="px-5 py-4">Transaction Date</th>
                <th className="px-5 py-4">Order ID</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Income</th>
                <th className="px-5 py-4">Expense</th>
                <th className="px-5 py-4">Gross Profit</th>
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
