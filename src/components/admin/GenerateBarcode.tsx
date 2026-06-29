import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Box } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function GenerateBarcode() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(3);
  const [generatedCount, setGeneratedCount] = useState<number>(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('in_house_products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setProduct(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load product for barcode', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!product) return;
    if (quantity > product.current_stock_qty && product.current_stock_qty > 0) {
      showToast(`Cannot generate more than current stock (${product.current_stock_qty})`, 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('Quantity must be at least 1', 'error');
      return;
    }
    setGeneratedCount(quantity);
    showToast('Barcodes generated!');
  };

  const handleReset = () => {
    setQuantity(3);
    setGeneratedCount(0);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

  // Safe formatting for currency
  const formatCurrency = (amount: number) => {
    return '৳' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6 print:hidden">
        <Box className="w-6 h-6 text-orange-500" />
        <h1 className="text-xl font-bold text-slate-800">Generate Barcode</h1>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 mb-8 print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 align-top">{product.sku || 'N/A'}</td>
                <td className="px-4 py-4 align-top">{product.name_en}</td>
                <td className="px-4 py-4 align-top">
                  <div className="w-64">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-blue-500 text-sm mb-1"
                    />
                    <p className="text-red-500 text-xs">Maximum quantity {product.current_stock_qty}</p>
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-center">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={handleGenerate}
                      className="px-4 py-1.5 border border-cyan-500 text-cyan-500 text-sm rounded hover:bg-cyan-50 transition"
                    >
                      Generate barcode
                    </button>
                    <button 
                      onClick={handleReset}
                      className="px-4 py-1.5 border border-red-400 text-red-500 text-sm rounded hover:bg-red-50 transition"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="px-4 py-1.5 border border-blue-500 text-blue-500 text-sm rounded hover:bg-blue-50 transition"
                    >
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {generatedCount > 0 && (
        <div className="bg-white p-8 rounded border border-slate-200 print:border-none print:p-0 print:block">
          <div className="flex flex-wrap gap-6 justify-center">
            {Array.from({ length: generatedCount }).map((_, i) => (
              <div key={i} className="border border-dashed border-slate-300 p-4 flex flex-col items-center justify-center text-center w-56 print:break-inside-avoid">
                <h3 className="font-bold text-slate-800 text-sm mb-1">HolidayMart</h3>
                <p className="text-xs text-slate-600 truncate w-full">{product.name_en}</p>
                <p className="text-sm font-semibold text-slate-800 mb-2">{formatCurrency(product.unit_price)}</p>
                
                {/* CSS Barcode Placeholder */}
                <div className="h-12 w-full flex items-center justify-between opacity-80 mb-1">
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-3 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-3 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                  <div className="h-full w-2 bg-black"></div>
                  <div className="h-full w-1 bg-black"></div>
                </div>
                
                <p className="text-xs text-slate-500 mt-1 tracking-widest">Code : {product.sku || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
