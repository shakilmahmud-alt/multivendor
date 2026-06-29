import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Edit, Trash2, Truck } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function ShippingMethodList() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    cost: '',
  });

  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
      showToast('Failed to fetch shipping methods', 'error');
    } else {
      setMethods(data || []);
    }
  };

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.duration || !formData.cost) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setLoading(true);

    const payload = {
      title: formData.title,
      duration: formData.duration,
      cost: parseFloat(formData.cost) || 0,
      status: true
    };

    try {
      if (editId) {
        const { error } = await supabase.from('shipping_methods').update(payload).eq('id', editId);
        if (error) throw error;
        showToast('Shipping method updated successfully', 'success');
      } else {
        const { error } = await supabase.from('shipping_methods').insert([payload]);
        if (error) throw error;
        showToast('Shipping method added successfully', 'success');
      }
      
      setFormData({
        title: '',
        duration: '',
        cost: '',
      });
      setEditId(null);
      fetchMethods();
    } catch (err: any) {
      console.error(err);
      showToast('Error saving shipping method: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (method: any) => {
    setFormData({
      title: method.title,
      duration: method.duration,
      cost: method.cost.toString(),
    });
    setEditId(method.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipping method?')) return;
    
    try {
      const { error } = await supabase.from('shipping_methods').delete().eq('id', id);
      if (error) throw error;
      showToast('Shipping method deleted successfully', 'success');
      fetchMethods();
    } catch (err: any) {
      console.error(err);
      showToast('Error deleting shipping method: ' + err.message, 'error');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('shipping_methods').update({ status: !currentStatus }).eq('id', id);
      if (error) throw error;
      showToast('Status updated successfully', 'success');
      fetchMethods();
    } catch (err: any) {
      console.error(err);
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Truck className="w-6 h-6 text-slate-800" />
        <h2 className="text-xl font-bold text-slate-800">Shipping Method Setup</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <h3 className="font-semibold text-slate-800">
                {editId ? 'Update Shipping Method' : 'Add New Shipping Method'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Inside Dhaka"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration *</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. ( 2 Days )"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost (৳) *</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. 60.00"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {editId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(null);
                      setFormData({ title: '', duration: '', cost: '' });
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                >
                  {loading ? 'Saving...' : editId ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Shipping Method List <span className="text-slate-500 text-sm font-normal">({methods.length})</span></h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">SL</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Cost</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method, idx) => (
                    <tr key={method.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{method.title}</td>
                      <td className="px-4 py-3 text-slate-600">{method.duration}</td>
                      <td className="px-4 py-3 text-slate-800 font-bold">৳{method.cost}</td>
                      <td className="px-4 py-3 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={method.status}
                            onChange={() => toggleStatus(method.id, method.status)}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(method)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(method.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {methods.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No shipping methods found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
