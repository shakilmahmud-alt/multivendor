import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function CustomerList() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'seller'>('admin');

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      let isSeller = false;
      let sellerId = '';

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'seller') {
          isSeller = true;
          sellerId = parsed.id;
          setUserRole('seller');
        }
      }

      try {
        if (isSeller) {
          // Fetch distinct customers who ordered from this seller
          const { data, error } = await supabase
            .from('orders')
            .select(`
              customer_id,
              customers (
                id,
                first_name,
                last_name,
                email,
                phone,
                created_at
              )
            `)
            .eq('seller_id', sellerId);

          if (error) throw error;
          
          if (data) {
            const uniqueCustomersMap = new Map();
            data.forEach((order: any) => {
              if (order.customers && !uniqueCustomersMap.has(order.customers.id)) {
                uniqueCustomersMap.set(order.customers.id, order.customers);
              }
            });
            setCustomers(Array.from(uniqueCustomersMap.values()));
          }
        } else {
          // Admin fetches all customers
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          if (data) setCustomers(data);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {userRole === 'admin' ? 'All Customers' : 'My Customers'}
        </h1>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Contact</th>
              <th className="p-4 font-medium">Joined Date</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-500">No customers found.</td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={customer.image_url || `https://ui-avatars.com/api/?name=${customer.first_name}+${customer.last_name}&background=f1f5f9&color=64748b`} 
                        alt={customer.first_name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="font-medium text-slate-800">
                        {customer.first_name} {customer.last_name}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
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
