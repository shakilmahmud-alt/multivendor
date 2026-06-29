import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../ToastContext';
import { Zap, Check, X as XIcon } from 'lucide-react';

export default function FlashDealsJoin() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeDeals, setActiveDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [dealProducts, setDealProducts] = useState<any[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dealsData } = await supabase.from('flash_deals').select('*').eq('status', 'active');
      setActiveDeals(dealsData || []);
      if (dealsData && dealsData.length > 0) {
        setSelectedDealId(dealsData[0].id);
      }

      const { data: prodData } = await supabase.from('in_house_products')
        .select('*')
        .eq('attributes->>seller_id', user.id);
      setProducts(prodData || []);

      const { data: dpData } = await supabase.from('flash_deal_products')
        .select('*')
        .eq('seller_id', user.id);
      setDealProducts(dpData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (productId: string, action: 'approved' | 'denied') => {
    if (!selectedDealId) return;

    // Optimistic UI update
    setDealProducts(prev => {
      const existing = prev.find(dp => dp.flash_deal_id === selectedDealId && dp.product_id === productId);
      if (existing) {
        return prev.map(dp => dp.id === existing.id ? { ...dp, status: action } : dp);
      } else {
        return [...prev, { flash_deal_id: selectedDealId, product_id: productId, seller_id: user.id, status: action }];
      }
    });

    try {
      const existing = dealProducts.find(dp => dp.flash_deal_id === selectedDealId && dp.product_id === productId);
      
      if (existing) {
        const { error } = await supabase.from('flash_deal_products').update({ status: action }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('flash_deal_products').insert([{
          flash_deal_id: selectedDealId,
          product_id: productId,
          seller_id: user.id,
          status: action
        }]);
        if (error) throw error;
      }
      
      showToast(`Product ${action} for Flash Deal`, 'success');
    } catch (err: any) {
      showToast('Failed to update product status', 'error');
      fetchData(); // revert on error
    }
  };

  const selectedDeal = activeDeals.find(d => d.id === selectedDealId);

  // Filter out products that are already approved or denied for the selected deal
  const pendingProducts = products.filter(p => {
    const dp = dealProducts.find(dp => dp.flash_deal_id === selectedDealId && dp.product_id === p.id);
    return !dp || dp.status === 'pending';
  });

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">Join Flash Deals</h2>
          </div>
          {activeDeals.length > 0 && (
            <select 
              value={selectedDealId} 
              onChange={(e) => setSelectedDealId(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 outline-none"
            >
              {activeDeals.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          )}
        </div>
        
        {selectedDeal && (
          <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-800">{selectedDeal.title}</h3>
              <p className="text-sm text-amber-700">
                Discount: {selectedDeal.discount_type === 'Amount' ? '৳' : ''}{selectedDeal.discount_amount}{selectedDeal.discount_type === 'Percentage' ? '%' : ''} off
              </p>
            </div>
            <div className="text-right text-sm text-amber-700">
              <p>Starts: {new Date(selectedDeal.start_date).toLocaleDateString()}</p>
              <p>Ends: {new Date(selectedDeal.end_date).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4">SL</th>
                <th className="p-4">Image</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Actual Price</th>
                <th className="p-4">Discounted Price</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading products...</td></tr>
              ) : pendingProducts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No pending products to review for this deal.</td></tr>
              ) : (
                pendingProducts.map((product, idx) => {
                  const actualPrice = parseFloat(product.unit_price) || 0;
                  let discountedPrice = actualPrice;
                  
                  if (selectedDeal) {
                    if (selectedDeal.discount_type === 'Percentage') {
                      discountedPrice = Math.round(actualPrice - (actualPrice * (selectedDeal.discount_amount / 100)));
                    } else {
                      discountedPrice = Math.round(actualPrice - selectedDeal.discount_amount);
                    }
                  }
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600">{idx + 1}</td>
                      <td className="p-4">
                        <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden">
                          <img src={product.thumbnail_url || 'https://via.placeholder.com/150'} alt={product.name_en} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{product.name_en}</td>
                      <td className="p-4 text-slate-600">৳{actualPrice.toLocaleString()}</td>
                      <td className="p-4 text-emerald-600 font-bold">৳{Math.max(0, discountedPrice).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleAction(product.id, 'approved')}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded transition flex items-center gap-1 font-medium"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            onClick={() => handleAction(product.id, 'denied')}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded transition flex items-center gap-1 font-medium"
                          >
                            <XIcon className="w-4 h-4" /> Deny
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
