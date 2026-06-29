import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="bg-slate-50 min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 max-w-2xl w-full text-center">
        <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Order Placed Successfully!</h1>
        
        <p className="text-sm text-slate-600 mb-8 font-medium">
          Your payment has been successfully processed and your order - <strong className="text-orange-500">{String(id).substring(0, 6).toUpperCase()}</strong> has been placed.
        </p>

        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
          <Link 
            to="/track-order" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-md transition text-sm shadow-md"
          >
            Track Order
          </Link>
          <Link 
            to="/" 
            className="text-slate-600 hover:text-orange-500 text-sm font-semibold transition flex items-center justify-center gap-1"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
