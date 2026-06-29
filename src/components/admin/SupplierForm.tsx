import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchSupplier();
    }
  }, [id]);

  const fetchSupplier = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          description: data.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching supplier:', error);
      alert('Failed to load supplier details.');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([formData]);

        if (error) throw error;
      }

      // On success, redirect back to list
      navigate('/admin/suppliers');
    } catch (error) {
      console.error(isEditMode ? 'Error updating supplier:' : 'Error creating supplier:', error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} supplier. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        Loading supplier details...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
        <h2 className="text-sm font-bold text-slate-800">
          {isEditMode ? 'Edit Supplier' : 'Create Supplier'}
        </h2>
        <Link 
          to="/admin/suppliers" 
          className="text-xs font-semibold px-4 py-2 border border-cyan-400 text-cyan-500 rounded-md hover:bg-cyan-50 transition bg-white"
        >
          Back To Supplier List
        </Link>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
          
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name:</label>
            <input 
              type="text" 
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Email:</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Phone:</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Address:</label>
            <textarea 
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Description:</label>
            <textarea 
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-md p-2.5 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={loading}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm px-6 py-2.5 rounded-md transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Supplier' : 'Create Supplier')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
