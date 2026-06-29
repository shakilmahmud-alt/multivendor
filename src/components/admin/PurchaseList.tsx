import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, FileText } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function PurchaseList() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) return;
    
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPurchases(purchases.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting purchase:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-800">Purchase List</h2>
        <Link 
          to="/admin/purchases/create" 
          className="text-xs font-semibold px-4 py-2 border border-cyan-400 text-cyan-500 rounded-md hover:bg-cyan-50 transition"
        >
          Add New Purchase
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Supplier</th>
              <th className="py-4 px-6">Total Amount</th>
              <th className="py-4 px-6">Paid</th>
              <th className="py-4 px-6">Due</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Payment Type</th>
              <th className="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">Loading...</td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">No purchases found.</td>
              </tr>
            ) : (
              purchases.map((purchase, index) => (
                <tr key={purchase.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 px-6">{index + 1}</td>
                  <td className="py-4 px-6">{purchase.purchase_date}</td>
                  <td className="py-4 px-6 font-medium text-slate-800">{purchase.suppliers?.name || 'Unknown'}</td>
                  <td className="py-4 px-6 font-semibold text-slate-700">৳{Number(purchase.total_amount || purchase.payment_amount).toLocaleString()}</td>
                  <td className="py-4 px-6 font-semibold text-emerald-600">৳{Number(purchase.payment_amount).toLocaleString()}</td>
                  <td className="py-4 px-6 font-semibold text-rose-500">৳{Math.max(0, Number(purchase.total_amount || purchase.payment_amount) - Number(purchase.payment_amount)).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      purchase.status === 'Received' ? 'bg-emerald-100 text-emerald-600' :
                      purchase.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">{purchase.payment_type}</td>
                  <td className="py-4 px-6 flex items-center justify-center gap-2">
                    <Link 
                      to={`/admin/purchases/challan/${purchase.id}`}
                      className="p-1.5 border border-indigo-400 text-indigo-500 rounded hover:bg-indigo-50 transition"
                      title="View / Print Challan"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                    <Link 
                      to={`/admin/purchases/edit/${purchase.id}`}
                      className="p-1.5 border border-cyan-400 text-cyan-500 rounded hover:bg-cyan-50 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(purchase.id)}
                      className="p-1.5 border border-pink-400 text-pink-500 rounded hover:bg-pink-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
