import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, Plus, Eye, UserCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function SellerList() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const { data: productsData } = await supabase.from('in_house_products').select('id, attributes');
      const { data: ordersData } = await supabase.from('orders').select('id, seller_id');

      const sellersWithStats = data?.map(seller => {
         const productCount = productsData?.filter(p => p.attributes?.seller_id === seller.id).length || 0;
         const orderCount = ordersData?.filter(o => o.seller_id === seller.id).length || 0;
         return { ...seller, productCount, orderCount };
      }) || [];

      setSellers(sellersWithStats);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller => 
    seller.name?.toLowerCase().includes(search.toLowerCase()) || 
    seller.phone?.includes(search) ||
    seller.shop_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    // Optimistic UI update
    setSellers(sellers.map(s => s.id === id ? { ...s, status: newStatus } : s));

    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      if (newStatus === 'Active') {
        const sellerObj = sellers.find(s => s.id === id);
        if (sellerObj) {
          const shopName = sellerObj.shop_name;
          if (shopName) {
            await supabase
              .from('notifications')
              .delete()
              .eq('message', `Seller "${shopName}" submitted a new seller account request.`);
          }
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      // Revert if error
      setSellers(sellers.map(s => s.id === id ? { ...s, status: currentStatus } : s));
      alert('Failed to update status');
    }
  };

  return (
    <div className="p-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="w-6 h-6 text-slate-700" />
        <h1 className="text-xl font-bold text-slate-800">Seller List</h1>
        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{sellers.length}</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Name or Phone" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-l text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-r hover:bg-blue-700 transition">
            Search
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition bg-white w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export <span className="text-[10px]">▼</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add New seller
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
              <th className="px-4 py-3">SL</th>
              <th className="px-4 py-3">Shop Name</th>
              <th className="px-4 py-3">Seller Name</th>
              <th className="px-4 py-3">Contact Info</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Total Products</th>
              <th className="px-4 py-3 text-center">Total Orders</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">Loading sellers...</td>
              </tr>
            ) : filteredSellers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">No sellers found.</td>
              </tr>
            ) : (
              filteredSellers.map((seller, index) => (
                <tr key={seller.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-xs font-medium text-slate-700">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {seller.shop_logo_url ? (
                          <img src={seller.shop_logo_url} alt={seller.shop_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-xs">{seller.shop_name?.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{seller.shop_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{seller.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-slate-800">{seller.email}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{seller.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => toggleStatus(seller.id, seller.status)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${seller.status === 'Active' ? 'bg-blue-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${seller.status === 'Active' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-sky-50 text-sky-500 font-bold px-3 py-1 rounded text-xs border border-sky-100">{seller.productCount || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-emerald-50 text-emerald-500 font-bold px-3 py-1 rounded text-xs border border-emerald-100">{seller.orderCount || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/admin/sellers/${seller.id}`} className="inline-block p-1.5 border border-sky-200 text-sky-500 rounded hover:bg-sky-50 hover:border-sky-300 transition">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
