import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { UserPlus, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function PurchaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    status: '',
    reference_no: '',
    payment_amount: '',
    payment_type: '',
    note: ''
  });

  // Multi-item state
  const [items, setItems] = useState<any[]>([]);
  const [currentItem, setCurrentItem] = useState({
    product_name: '',
    qty: '1',
    unit_price: '1',
    selling_price: '1'
  });

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    if (isEditMode) {
      fetchPurchase();
    }
  }, [id]);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name');
    if (data) setSuppliers(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('in_house_products').select('id, name_en, unit_price, attributes');
    if (data) {
      const inHouseOnly = data.filter(p => p.attributes?.added_by_admin || !p.attributes?.seller_id);
      setProducts(inHouseOnly);
    }
  };

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          supplier_id: data.supplier_id || '',
          purchase_date: data.purchase_date || '',
          status: data.status || '',
          reference_no: data.reference_no || '',
          payment_amount: data.payment_amount?.toString() || '',
          payment_type: data.payment_type || '',
          note: data.note || ''
        });

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        } else if (data.product_name) {
          // Legacy support
          setItems([{
            product_name: data.product_name,
            qty: data.qty,
            unit_price: data.unit_price,
            selling_price: data.unit_price
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCurrentItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'product_name') {
      const selected = products.find(p => p.name_en === value);
      setCurrentItem({
        ...currentItem,
        product_name: value,
        selling_price: selected ? selected.unit_price : currentItem.selling_price
      });
    } else {
      setCurrentItem({ ...currentItem, [name]: value });
    }
  };

  const handleAddItem = () => {
    if (!currentItem.product_name) {
      showToast('Please select a product', 'error');
      return;
    }
    setItems([...items, {
      product_name: currentItem.product_name,
      qty: parseFloat(currentItem.qty) || 1,
      unit_price: parseFloat(currentItem.unit_price) || 0,
      selling_price: parseFloat(currentItem.selling_price) || 0
    }]);
    setCurrentItem({ product_name: '', qty: '1', unit_price: '1', selling_price: '1' });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      showToast('Please add at least one product', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        supplier_id: formData.supplier_id || null,
        purchase_date: formData.purchase_date,
        status: formData.status,
        reference_no: formData.reference_no,
        payment_amount: parseFloat(formData.payment_amount) || 0,
        payment_type: formData.payment_type,
        note: formData.note,
        items: items,
        total_amount: totalAmount,
        // For legacy single-item display fallback if needed by other parts of the system
        product_name: items[0].product_name,
        qty: items[0].qty,
        unit_price: items[0].unit_price
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('purchases')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        showToast('Purchase updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('purchases')
          .insert([payload]);

        if (error) throw error;
        showToast('Purchase created successfully!', 'success');
      }

      // Automatically update purchase price and selling price for all added in-house products
      for (const item of items) {
        const product = products.find(p => p.name_en === item.product_name);
        const pid = item.product_id || (product ? product.id : null);
        if (pid) {
          await supabase
            .from('in_house_products')
            .update({ 
              purchase_price: item.unit_price, 
              unit_price: item.selling_price 
            })
            .eq('id', pid);
        }
      }
      
      navigate('/admin/purchases');
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      showToast('Error saving purchase: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 font-sans text-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-5 h-5 text-slate-700" />
        <h1 className="text-lg font-bold text-slate-800">
          {isEditMode ? 'Edit Purchase' : 'Add New Purchase'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Block 1: Supplier & Dates */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Supplier Name<span className="text-red-500">*</span></label>
              <select
                name="supplier_id"
                required
                value={formData.supplier_id}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="" disabled>Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Purchase Date<span className="text-red-500">*</span></label>
              <input
                type="date"
                name="purchase_date"
                required
                value={formData.purchase_date}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Status<span className="text-red-500">*</span></label>
              <select
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="" disabled>Select Status</option>
                <option value="Received">Received</option>
                <option value="Pending">Pending</option>
                <option value="Ordered">Ordered</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Reference No</label>
              <input
                type="text"
                name="reference_no"
                value={formData.reference_no}
                onChange={handleChange}
                placeholder="Reference No"
                className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Block 2: Products (Multi-Item) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-800">Purchase Items</h2>
            <Link to={`/admin/in-house-products/add?returnUrl=${encodeURIComponent('/admin/purchases' + (isEditMode ? `/edit/${id}` : '/new'))}`} className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs font-medium bg-blue-50 px-3 py-1.5 rounded">
              <Plus className="w-3.5 h-3.5" /> Add new product to catalog
            </Link>
          </div>

          <div className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg mb-5">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Product</label>
              <select
                name="product_name"
                value={currentItem.product_name}
                onChange={handleCurrentItemChange}
                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-700 outline-none focus:border-blue-500 text-sm"
              >
                <option value="" disabled>Choose a product...</option>
                {products.map((p, i) => (
                  <option key={p.id || i} value={p.name_en}>{p.name_en}</option>
                ))}
              </select>
            </div>
            
            <div className="w-24">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Qty</label>
              <input
                type="number"
                name="qty"
                min="1"
                value={currentItem.qty}
                onChange={handleCurrentItemChange}
                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-700 outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div className="w-32">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Purchase Price</label>
              <input
                type="number"
                name="unit_price"
                min="0"
                step="0.01"
                value={currentItem.unit_price}
                onChange={handleCurrentItemChange}
                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-700 outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div className="w-32">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Selling Price</label>
              <input
                type="number"
                name="selling_price"
                min="0"
                step="0.01"
                value={currentItem.selling_price}
                onChange={handleCurrentItemChange}
                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-700 outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-900 transition"
            >
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-[13px] text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4 text-center">Purchase Price</th>
                  <th className="py-2.5 px-4 text-center">Selling Price</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                  <th className="py-2.5 px-4 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No items added yet.</td>
                  </tr>
                ) : items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-medium text-slate-800">{item.product_name}</td>
                    <td className="py-2.5 px-4 text-center">৳{Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center">৳{Number(item.selling_price).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center font-bold">{item.qty}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-800">৳{(Number(item.unit_price) * Number(item.qty)).toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <button type="button" onClick={() => handleRemoveItem(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length > 0 && (
                  <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                    <td colSpan={3} className="py-3 px-4 text-right">Grand Total:</td>
                    <td className="py-3 px-4 text-center">{totalQty}</td>
                    <td className="py-3 px-4 text-right text-[#0070c0]">৳{totalAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Block 3: Payment & Notes */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Payment Amount<span className="text-red-500">*</span></label>
              <input
                type="number"
                name="payment_amount"
                required
                min="0"
                step="0.01"
                placeholder="Amount Paid to Supplier"
                value={formData.payment_amount}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400"
              />
              <p className="text-xs text-slate-400 mt-1">Total Bill: ৳{totalAmount.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Payment Type<span className="text-red-500">*</span></label>
              <select
                name="payment_type"
                required
                value={formData.payment_type}
                onChange={handleChange}
                className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="" disabled>Select Type</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-[13px] text-slate-600 mb-1.5">Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 outline-none focus:border-blue-400 h-20 resize-y"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded text-white font-medium text-sm transition ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#0070c0] hover:bg-[#005a9c]'
            }`}
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </div>

      </form>
    </div>
  );
}
