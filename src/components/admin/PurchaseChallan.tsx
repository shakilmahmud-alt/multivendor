import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Printer, ArrowLeft, Building2 } from 'lucide-react';

export default function PurchaseChallan() {
  const { id } = useParams<{ id: string }>();
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  useEffect(() => {
    if (!loading && purchase) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('print') === 'true') {
        setTimeout(() => window.print(), 500);
      }
    }
  }, [loading, purchase]);

  const fetchPurchase = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            name, phone, address
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPurchase(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Challan...</div>;
  if (!purchase) return <div className="p-8 text-center text-red-500">Purchase not found.</div>;

  // Map legacy items to items array if missing
  let items = [];
  if (purchase.items && Array.isArray(purchase.items) && purchase.items.length > 0) {
    items = purchase.items;
  } else if (purchase.product_name) {
    items = [{
      product_name: purchase.product_name,
      qty: purchase.qty,
      unit_price: purchase.unit_price,
      selling_price: purchase.unit_price
    }];
  }

  const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.qty) || 0), 0);
  const calculatedTotal = items.reduce((sum: number, item: any) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0);
  const finalTotal = purchase.total_amount || calculatedTotal;

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans text-sm pb-10">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-challan, #printable-challan * { visibility: visible; }
          #printable-challan { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 0;}
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Actions */}
      <div className="flex items-center justify-between no-print">
        <Link to="/admin/purchases" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Purchases
        </Link>
        <button 
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070c0] hover:bg-[#005a9c] text-white rounded font-medium text-[13px] transition shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Challan
        </button>
      </div>

      <div id="printable-challan" className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
        {/* Challan Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-[#0070c0] rounded-lg flex items-center justify-center text-white">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">Holiday Mart</h1>
              <p className="text-slate-500 text-xs mt-1">Purchase Challan / Memo</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest mb-2">Challan</h2>
            <p className="text-sm text-slate-600"><span className="font-semibold">Date:</span> {purchase.purchase_date}</p>
            <p className="text-sm text-slate-600"><span className="font-semibold">Ref No:</span> {purchase.reference_no || 'N/A'}</p>
            <p className="text-sm mt-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                purchase.status === 'Received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {purchase.status}
              </span>
            </p>
          </div>
        </div>

        {/* Supplier Info */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Supplier Details</h3>
          <div className="text-sm text-slate-800">
            <p className="font-bold text-base">{purchase.suppliers?.name || 'Unknown Supplier'}</p>
            <p className="text-slate-600 mt-1">{purchase.suppliers?.phone || 'No phone provided'}</p>
            <p className="text-slate-600">{purchase.suppliers?.address || ''}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4 rounded-tl">SL</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4 text-center">Selling Price</th>
                <th className="py-3 px-4 text-center">Purchase Price</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right rounded-tr">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.product_name}</td>
                  <td className="py-3 px-4 text-center text-slate-600">৳{Number(item.selling_price || item.unit_price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-center text-slate-600">৳{Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{item.qty}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800">৳{(Number(item.unit_price) * Number(item.qty)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={4} className="py-3 px-4 text-right font-bold text-slate-800">Grand Total:</td>
                <td className="py-3 px-4 text-center font-bold text-slate-800">{totalQty}</td>
                <td className="py-3 px-4 text-right font-bold text-[#0070c0] text-base">৳{finalTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-2 gap-8 text-sm pt-4 border-t border-slate-100">
          <div>
            <p className="font-bold text-slate-800 mb-1">Payment Information</p>
            <p className="text-slate-600">Method: <span className="font-medium text-slate-800">{purchase.payment_type || 'N/A'}</span></p>
            <p className="text-slate-600">Amount Paid: <span className="font-medium text-slate-800">৳{Number(purchase.payment_amount).toFixed(2)}</span></p>
            {finalTotal > purchase.payment_amount && (
              <p className="text-red-500 font-medium">Due: ৳{(finalTotal - purchase.payment_amount).toFixed(2)}</p>
            )}
          </div>
          <div>
            {purchase.note && (
              <>
                <p className="font-bold text-slate-800 mb-1">Notes / Terms</p>
                <p className="text-slate-600 italic">{purchase.note}</p>
              </>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-24 text-center">
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto pt-2">
              <p className="text-sm font-bold text-slate-800">Prepared By</p>
              <p className="text-xs text-slate-500">Holiday Mart Admin</p>
            </div>
          </div>
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto pt-2">
              <p className="text-sm font-bold text-slate-800">Authorized Signature</p>
              <p className="text-xs text-slate-500">Manager / Director</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
