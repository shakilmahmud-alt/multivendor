import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Zap, Send } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function FlashDeals() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const { showToast } = useToast();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: dpData } = await supabase.from('flash_deal_products')
        .select(`
          *,
          flash_deals (*),
          in_house_products (*)
        `)
        .eq('seller_id', user.id)
        .in('status', ['approved', 'submitted']);

      setProducts(dpData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCampaign = async (dealId: string) => {
    try {
      setLoading(true);
      await supabase.from('flash_deal_products')
        .update({ status: 'submitted' })
        .eq('seller_id', user.id)
        .eq('flash_deal_id', dealId)
        .eq('status', 'approved');
      
      showToast('Campaign submitted successfully!', 'success');
      fetchProducts();
    } catch (err) {
      showToast('Failed to submit campaign', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Group by flash deal
  const groupedDeals = products.reduce((acc: any, dp: any) => {
    const dealId = dp.flash_deal_id;
    if (!acc[dealId]) {
      acc[dealId] = {
        deal: dp.flash_deals,
        items: []
      };
    }
    acc[dealId].items.push(dp);
    return acc;
  }, {});

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="flex items-center gap-2">
        <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
        <h2 className="text-lg font-bold text-slate-800">My Flash Deals</h2>
      </div>

      {loading && Object.keys(groupedDeals).length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">Loading...</div>
      ) : Object.keys(groupedDeals).length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">You haven't approved any products for a flash deal yet.</div>
      ) : (
        Object.values(groupedDeals).map((group: any) => {
          const { deal, items } = group;
          if (!deal) return null;

          const hasApprovedItems = items.some((item: any) => item.status === 'approved');

          return (
            <div key={deal.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
                <div>
                  <h3 className="font-bold text-amber-800">{deal.title}</h3>
                  <p className="text-sm text-amber-700">
                    Discount: {deal.discount_type === 'Amount' ? '৳' : ''}{deal.discount_amount}{deal.discount_type === 'Percentage' ? '%' : ''} off
                  </p>
                </div>
                {hasApprovedItems ? (
                  <button 
                    onClick={() => handleSubmitCampaign(deal.id)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded font-bold shadow transition"
                  >
                    <Send className="w-4 h-4" /> Submit Campaign
                  </button>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-emerald-700" /> Campaign Submitted
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="p-4">SL</th>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Actual Price</th>
                      <th className="p-4">Discounted Price</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((dp: any, idx: number) => {
                      const product = dp.in_house_products;
                      if (!product) return null;

                      const actualPrice = parseFloat(product.unit_price) || 0;
                      let discountedPrice = actualPrice;
                      
                      if (deal.discount_type === 'Percentage') {
                        discountedPrice = Math.round(actualPrice - (actualPrice * (deal.discount_amount / 100)));
                      } else {
                        discountedPrice = Math.round(actualPrice - deal.discount_amount);
                      }

                      return (
                        <tr key={dp.id} className="hover:bg-slate-50">
                          <td className="p-4 text-slate-600">{idx + 1}</td>
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden">
                              <img src={product.thumbnail_url || 'https://via.placeholder.com/150'} alt={product.name_en} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium text-slate-800">{product.name_en}</span>
                          </td>
                          <td className="p-4 text-slate-600">৳{actualPrice.toLocaleString()}</td>
                          <td className="p-4 text-emerald-600 font-bold">৳{Math.max(0, discountedPrice).toLocaleString()}</td>
                          <td className="p-4">
                            {dp.status === 'submitted' ? (
                              <span className="text-emerald-600 font-bold text-xs uppercase">Submitted</span>
                            ) : (
                              <span className="text-amber-600 font-bold text-xs uppercase">Pending Submit</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
