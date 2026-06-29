import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Gift } from 'lucide-react';

export default function AdminFlashDealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<any>(null);
  const [dealProducts, setDealProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: dealData } = await supabase.from('flash_deals').select('*').eq('id', id).single();
      setDeal(dealData);

      if (dealData) {
        // Fetch submitted products
        const { data: dpData } = await supabase.from('flash_deal_products')
          .select('*, sellers(shop_name), in_house_products(name_en, thumbnail_url, unit_price)')
          .eq('flash_deal_id', id)
          .eq('status', 'submitted');
          
        setDealProducts(dpData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <button onClick={() => navigate('/admin/flash-deals')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Gift className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm font-bold text-slate-800">
            Flash Deal Details {deal ? `- ${deal.title}` : ''}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4">SL</th>
                <th className="p-4">Shop Name</th>
                <th className="p-4">Image</th>
                <th className="p-4">Joined Products Name</th>
                <th className="p-4">Actual Price</th>
                <th className="p-4">Discounted Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading details...</td></tr>
              ) : dealProducts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No joined shops found.</td></tr>
              ) : (
                dealProducts.map((dp, idx) => {
                  const product = dp.in_house_products;
                  const shopName = dp.sellers?.shop_name || 'Unknown Shop';
                  const actualPrice = parseFloat(product?.unit_price) || 0;
                  let discountedPrice = actualPrice;

                  if (deal) {
                    if (deal.discount_type === 'Percentage') {
                      discountedPrice = Math.round(actualPrice - (actualPrice * (deal.discount_amount / 100)));
                    } else {
                      discountedPrice = Math.round(actualPrice - deal.discount_amount);
                    }
                  }

                  return (
                    <tr key={dp.id} className="hover:bg-slate-50">
                      <td className="p-4 text-slate-600">{idx + 1}</td>
                      <td className="p-4 font-medium text-slate-800">{shopName}</td>
                      <td className="p-4">
                        <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden">
                          <img src={product?.thumbnail_url || 'https://via.placeholder.com/150'} alt={product?.name_en} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-4 text-slate-800">{product?.name_en}</td>
                      <td className="p-4 text-slate-600">৳{actualPrice.toLocaleString()}</td>
                      <td className="p-4 text-emerald-600 font-bold">৳{Math.max(0, discountedPrice).toLocaleString()}</td>
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
