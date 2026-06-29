import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuppliers(suppliers.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-800">Supplier List</h2>
        <Link 
          to="/admin/suppliers/create" 
          className="text-xs font-semibold px-4 py-2 border border-cyan-400 text-cyan-500 rounded-md hover:bg-cyan-50 transition"
        >
          Add Supplier
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Name</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Phone</th>
              <th className="py-4 px-6">Address</th>
              <th className="py-4 px-6">Description</th>
              <th className="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">No suppliers found.</td>
              </tr>
            ) : (
              suppliers.map((supplier, index) => (
                <tr key={supplier.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 px-6">{index + 1}</td>
                  <td className="py-4 px-6 uppercase text-xs">{supplier.name}</td>
                  <td className="py-4 px-6">{supplier.email}</td>
                  <td className="py-4 px-6">{supplier.phone}</td>
                  <td className="py-4 px-6 truncate max-w-[200px]">{supplier.address}</td>
                  <td className="py-4 px-6 truncate max-w-[200px]">{supplier.description}</td>
                  <td className="py-4 px-6 flex items-center justify-center gap-2">
                    <Link 
                      to={`/admin/suppliers/edit/${supplier.id}`}
                      className="p-1.5 border border-cyan-400 text-cyan-500 rounded hover:bg-cyan-50 transition"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(supplier.id)}
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
