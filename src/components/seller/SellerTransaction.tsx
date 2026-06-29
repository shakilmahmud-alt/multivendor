import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function SellerTransaction() {
  const [orders, setOrders] = useState<any[]>([]);
  const [walletStats, setWalletStats] = useState({
    withdrawableBalance: 0,
    collectedCash: 0
  });
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const sessionUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (!sessionUser.id) return;
      
      const { data: sData } = await supabase.from('sellers').select('*').eq('id', sessionUser.id).single();
      if (sData) setSeller(sData);

      const { data: oData, error } = await supabase
        .from('orders')
        .select('*, customers(first_name, last_name)')
        .eq('seller_id', sessionUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(oData || []);

      let commissionGiven = 0;
      let totalPaidAmount = 0;
      let collectedCash = 0;

      if (oData) {
        oData.forEach(o => {
          const isValidStatus = ['delivered', 'returned', 'failed_to_deliver'].includes(o.status?.toLowerCase()) || (o.status?.toLowerCase() === 'canceled' && o.canceled_by === 'seller');
          if (o.payment_status === 'paid' && isValidStatus) {
            let currentTotalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
            const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
            const taxAmt = parseFloat(o.tax_amount || 0);
            const items = Array.isArray(o.items) ? o.items : [];
            const subTotal = items.reduce((acc: number, item: any) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
            
            const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status?.toLowerCase());
            const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status?.toLowerCase());

            if (excludeDelivery) {
              currentTotalAmt = Math.max(0, currentTotalAmt - deliveryFee);
            }

            let orderCommission = 0;
            if (isSpecialStatus) {
              orderCommission = 200;
            } else if (currentTotalAmt <= 0 && subTotal > 0) {
              orderCommission = (subTotal + taxAmt + deliveryFee) * 0.015;
            } else {
              orderCommission = currentTotalAmt * 0.20;
            }

            const vendorOrderAmt = currentTotalAmt - deliveryFee - orderCommission;

            commissionGiven += orderCommission;
            totalPaidAmount += (currentTotalAmt - deliveryFee);

            if (o.shipping_address?.disbursement_status === 'Disbursed') {
               collectedCash += vendorOrderAmt;
            }
          }
        });
      }

      setWalletStats({
        withdrawableBalance: totalPaidAmount - commissionGiven - collectedCash,
        collectedCash: collectedCash
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading transactions...</div>;

  const transactionOrders = orders.filter(o => ['delivered', 'returned', 'failed_to_deliver'].includes(o.status?.toLowerCase()) || (o.status?.toLowerCase() === 'canceled' && o.canceled_by === 'seller'));

  return (
    <div className="p-6 font-sans bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Transaction Report</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Disbursed Amount</span>
          <span className="text-2xl font-black text-emerald-600">৳{walletStats.collectedCash.toFixed(2)}</span>
        </div>
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Hold Amount</span>
          <span className="text-2xl font-black text-amber-500">৳{walletStats.withdrawableBalance.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">Transaction Table</h3>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{transactionOrders.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-white border-b border-slate-200 text-xs text-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4">SL</th>
                <th className="px-4 py-4">Vendor Name</th>
                <th className="px-4 py-4">Customer Name</th>
                <th className="px-4 py-4">Order Id</th>
                <th className="px-4 py-4">Transaction Id</th>
                <th className="px-4 py-4">Order Amount</th>
                <th className="px-4 py-4">Vendor Amount</th>
                <th className="px-4 py-4">Admin Commission</th>
                <th className="px-4 py-4">Received By</th>
                <th className="px-4 py-4">Delivered By</th>
                <th className="px-4 py-4">Delivery Charge</th>
                <th className="px-4 py-4">Payment Method</th>
                <th className="px-4 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactionOrders.length > 0 ? transactionOrders.map((o, i) => {
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
                
                const vendorAmt = totalAmt - deliveryFee - orderCommission;
                const transactionId = `${o.id.slice(0,4)}-${o.id.slice(4,9)}-${new Date(o.created_at).getTime()}`;
                const disbursementStatus = o.shipping_address?.disbursement_status || 'Hold';
                const custName = o.customers ? `${o.customers.first_name || ''} ${o.customers.last_name || ''}`.trim() : (o.shipping_address?.name || 'Guest customer');

                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">{i + 1}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{seller?.name || 'Seller'}</td>
                    <td className="px-4 py-4">{custName}</td>
                    <td className="px-4 py-4 font-medium">{o.id.slice(0,8)}</td>
                    <td className="px-4 py-4 text-xs font-mono text-slate-500">{transactionId}</td>
                    <td className="px-4 py-4">৳{totalAmt.toFixed(2)}</td>
                    <td className="px-4 py-4">৳{vendorAmt.toFixed(2)}</td>
                    <td className="px-4 py-4">৳{orderCommission.toFixed(2)}</td>
                    <td className="px-4 py-4 text-xs">admin</td>
                    <td className="px-4 py-4 text-xs">admin</td>
                    <td className="px-4 py-4">৳{deliveryFee.toFixed(2)}</td>
                    <td className="px-4 py-4 capitalize text-xs">{o.payment_method || 'cash'}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${disbursementStatus === 'Disbursed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {disbursementStatus}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-slate-500">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
