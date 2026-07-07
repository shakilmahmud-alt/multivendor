import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Store, Package, Users, Activity, 
  CheckCircle, Truck, XCircle, ArrowLeftRight, Clock, BarChart3, History, ShoppingBag, Bell
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

// earningsData moved to component state
const StatCard = ({ title, value, icon: Icon, gradient }: any) => (
  <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
    <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${gradient}`}></div>
    <div>
      <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
    </div>
    <div className={`p-3.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const SubStatCard = ({ title, value, icon: Icon, textColor, bgColor }: any) => (
  <div className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-3 shadow-xs hover:shadow-sm hover:border-slate-200/50 hover:-translate-y-0.5 transition-all duration-300 group">
    <div className={`p-2.5 rounded-xl ${bgColor} ${textColor} group-hover:scale-105 transition-transform duration-300`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</span>
      <span className={`text-base font-black ${textColor}`}>{value}</span>
    </div>
  </div>
);

const WalletCard = ({ title, value, icon: Icon, colorClass, subtitle = "" }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
    <div>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
      {subtitle && <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3.5 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function AdminDashboard() {
  const [user, setUser] = React.useState<{ id: string; role: string; name: string } | null>(null);
  const [timeFilter, setTimeFilter] = React.useState('Overall statistics');
  const [stats, setStats] = React.useState({
    totalSales: 0,
    totalStores: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pending: 0,
    confirmed: 0,
    packaging: 0,
    outForDelivery: 0,
    delivered: 0,
    canceled: 0,
    returned: 0,
    failed: 0,
    inHouseProducts: 0,
    sellerNewRequests: 0,
    sellerApproved: 0,
    sellerUpdateRequests: 0,
    sellerDenied: 0,
  });
  
  const [topCustomers, setTopCustomers] = React.useState<{name: string; orders: number}[]>([]);
  const [topStores, setTopStores] = React.useState<{name: string; count: number}[]>([]);
  const [topSellingStores, setTopSellingStores] = React.useState<{name: string; val: string}[]>([]);
  const [mostRatedProducts, setMostRatedProducts] = React.useState<any[]>([]);
  const [topSellingProducts, setTopSellingProducts] = React.useState<any[]>([]);
  const [topDeliveryMen, setTopDeliveryMen] = React.useState<any[]>([]);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  
  const [earningsData, setEarningsData] = React.useState([
    { name: 'Jan', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Feb', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Mar', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Apr', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'May', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Jun', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Jul', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Aug', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Sep', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Oct', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Nov', inHouse: 0, vendor: 0, commission: 0 },
    { name: 'Dec', inHouse: 0, vendor: 0, commission: 0 },
  ]);

  const [notifications, setNotifications] = React.useState<any[]>([]);

  const fetchNotifications = async (currentUser: any) => {
    try {
      // Auto-cleanup: delete read notifications older than 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', twentyFourHoursAgo);

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentUser.role === 'seller') {
        query = query.eq('target_role', 'seller').eq('target_user_id', currentUser.id);
      } else {
        query = query.eq('target_role', 'admin');
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching/cleaning notifications:', err);
    }
  };

  const toggleNotificationRead = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, is_read: !currentStatus } : n));
    } catch (err) {
      console.error('Error toggling notification status:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
        
      if (error) throw error;
      setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  React.useEffect(() => {
    const session = localStorage.getItem('user');
    if (session) {
      const parsedUser = JSON.parse(session);
      setUser(parsedUser);
      fetchNotifications(parsedUser);

      const channel = supabase
        .channel('admin-notifications-dashboard')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          () => {
            fetchNotifications(parsedUser);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      fetchDashboardStats(user);
    }
  }, [timeFilter, user]);

  const fetchDashboardStats = async (currentUser: { id: string; role: string }) => {
    try {
      const now = new Date();
      let startDate: Date | null = null;
      if (timeFilter === 'Todays Statistics') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (timeFilter === 'This Months Statistics') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Products count & analytics
      let fetchedProductsCount = 0;
      let inHouseCount = 0;
      let newReqCount = 0;
      let appReqCount = 0;
      let updReqCount = 0;
      let denReqCount = 0;

      if (currentUser.role === 'seller') {
        let pQuery = supabase.from('in_house_products').select('*', { count: 'exact', head: true }).contains('attributes', { seller_id: currentUser.id });
        if (startDate) pQuery = pQuery.gte('created_at', startDate.toISOString());
        const { count } = await pQuery;
        fetchedProductsCount = count || 0;
      } else {
        let pQuery = supabase.from('in_house_products').select('id, attributes, created_at');
        if (startDate) pQuery = pQuery.gte('created_at', startDate.toISOString());
        const { data: pData } = await pQuery;
        fetchedProductsCount = pData?.length || 0;
        
        if (pData) {
          pData.forEach(p => {
            if (!p.attributes || !p.attributes.seller_id) {
              inHouseCount++;
            } else {
              const status = p.attributes.request_status;
              if (status === 'new-requests') newReqCount++;
              else if (status === 'approved') appReqCount++;
              else if (status === 'update-requests') updReqCount++;
              else if (status === 'denied') denReqCount++;
            }
          });
        }
      }

      // Orders query for business analytics (filtered)
      let ordersQuery = supabase.from('orders').select('*');
      if (currentUser.role === 'seller') ordersQuery = ordersQuery.eq('seller_id', currentUser.id);
      if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      const { data: ordersData } = await ordersQuery;

      // Orders query for wallet & chart (always unfiltered by date)
      let allOrdersQuery = supabase.from('orders').select('*');
      if (currentUser.role === 'seller') allOrdersQuery = allOrdersQuery.eq('seller_id', currentUser.id);
      const { data: allOrdersData } = await allOrdersQuery;

      let inHouseEarning = 0;
      let commissionEarned = 0;
      let deliveryChargeEarned = 0;
      let pendingAmount = 0;
      let totalTaxCollected = 0;

      let pCount = 0, cCount = 0, pkgCount = 0, ofdCount = 0, dCount = 0, cxCount = 0, rCount = 0, fCount = 0;
      
      const newEarningsData = [
        { name: 'Jan', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Feb', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Mar', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Apr', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'May', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Jun', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Jul', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Aug', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Sep', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Oct', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Nov', inHouse: 0, vendor: 0, commission: 0 },
        { name: 'Dec', inHouse: 0, vendor: 0, commission: 0 },
      ];
      
      if (ordersData) {
        ordersData.forEach(o => {
          // Status counts (filtered by date range)
          const s = o.status?.toLowerCase();
          if (s === 'pending') pCount++;
          else if (s === 'confirmed') cCount++;
          else if (s === 'processing' || s === 'packaging') pkgCount++;
          else if (s === 'out_for_delivery' || s === 'out for delivery') ofdCount++;
          else if (s === 'completed' || s === 'delivered') dCount++;
          else if (s === 'failed_to_deliver' || s === 'failed to deliver') fCount++;
          else if (s === 'cancelled' || s === 'canceled') cxCount++;
          else if (s === 'refunded' || s === 'returned') rCount++;
        });
      }

      if (allOrdersData) {
        allOrdersData.forEach(o => {
          // Wallet calculations & chart statistics (unfiltered by date range)
          const isPaid = o.payment_status === 'paid';
          const currentTotalAmt = parseFloat(o.total_amount || 0) + parseFloat(o.loyalty_discount || 0);
          const deliveryFee = parseFloat(o.deliveryman_fee || o.shipping_cost || 0);
          const taxAmt = parseFloat(o.tax_amount || 0);
          const items = Array.isArray(o.items) ? o.items : [];
          const subTotal = items.reduce((acc, item) => acc + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
          
          let orderCommission = 0;
          let vendorTotalAmt = currentTotalAmt;

          if (o.seller_id) {
            const isSpecialStatus = ['returned', 'failed_to_deliver', 'canceled'].includes(o.status?.toLowerCase());
            const excludeDelivery = ['returned', 'failed_to_deliver'].includes(o.status?.toLowerCase());
            
            if (excludeDelivery) {
              vendorTotalAmt = Math.max(0, vendorTotalAmt - deliveryFee);
            }

            if (isSpecialStatus) {
              orderCommission = 200;
            } else if (vendorTotalAmt <= 0 && subTotal > 0) {
              orderCommission = (subTotal + taxAmt + deliveryFee) * 0.015;
            } else {
              orderCommission = vendorTotalAmt * 0.20;
            }
          }

          const isDisbursed = o.shipping_address?.disbursement_status === 'Disbursed';
          const vendorAmount = vendorTotalAmt - orderCommission;

          if (currentUser.role === 'admin') {
            deliveryChargeEarned += deliveryFee;
            totalTaxCollected += taxAmt;
            if (isPaid) {
              const monthIndex = new Date(o.created_at).getMonth();
              if (!o.seller_id) {
                inHouseEarning += currentTotalAmt;
                newEarningsData[monthIndex].inHouse += currentTotalAmt;
              } else {
                commissionEarned += orderCommission;
                newEarningsData[monthIndex].vendor += vendorAmount;
                newEarningsData[monthIndex].commission += orderCommission;
                
                if (!isDisbursed) {
                  pendingAmount += vendorAmount;
                }
              }
            }
          } else {
            // Seller role
            if (isPaid) {
              const monthIndex = new Date(o.created_at).getMonth();
              inHouseEarning += vendorAmount; // Shop Earning (after commission)
              commissionEarned += orderCommission; // Commission Given
              deliveryChargeEarned += currentTotalAmt; // Repurposed for Total Order Amount
              totalTaxCollected += taxAmt;
              
              newEarningsData[monthIndex].vendor += vendorAmount;
              newEarningsData[monthIndex].commission += orderCommission;

              if (!isDisbursed) {
                pendingAmount += vendorAmount;
              }
            }
          }
        });
        setEarningsData(newEarningsData);
      }

      let sellersCount = 0;
      let customersCount = 0;

      if (currentUser.role === 'admin') {
        let sellersQuery = supabase.from('sellers').select('*', { count: 'exact', head: true });
        if (startDate) sellersQuery = sellersQuery.gte('created_at', startDate.toISOString());
        const { count: sCount } = await sellersQuery;
        sellersCount = sCount || 0;

        let customersQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
        if (startDate) customersQuery = customersQuery.gte('created_at', startDate.toISOString());
        const { count: cCount } = await customersQuery;
        customersCount = cCount || 0;
        
        const { data: sellers } = await supabase.from('sellers').select('id, shop_name');
        const { data: customers } = await supabase.from('customers').select('id, first_name, last_name');
        const { data: allOrders } = await supabase.from('orders').select('customer_id, seller_id, total_amount, loyalty_discount');
        
        if (customers && allOrders) {
           const customerOrderCounts = customers.map(c => {
             const count = allOrders.filter((o: any) => o.customer_id === c.id).length;
             const name = c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : 'Unknown';
             return { name: name, orders: count };
           }).sort((a,b) => b.orders - a.orders).slice(0,6);
           setTopCustomers(customerOrderCounts);
        }

        if (sellers) {
           const { data: allAdminProducts } = await supabase.from('in_house_products').select('*');
           const storeProductCounts = sellers.map(s => {
             const count = (allAdminProducts || []).filter((p: any) => p.attributes?.seller_id === s.id).length;
             return { name: s.shop_name || 'Unknown', count: count };
           }).sort((a,b) => b.count - a.count).slice(0,4);
           setTopStores(storeProductCounts);
        }

        if (sellers && allOrders) {
           const storeSales = sellers.map(s => {
             const total = allOrders.filter((o: any) => o.seller_id === s.id).reduce((sum, o) => sum + Number(o.total_amount || 0) + Number(o.loyalty_discount || 0), 0);
             return { name: s.shop_name || 'Unknown', val: `৳${total.toFixed(2)}`, raw: total };
           }).sort((a,b) => b.raw - a.raw).slice(0,6);
           setTopSellingStores(storeSales);
        }
        
        // Currently no delivery man table, leaving empty
        setTopDeliveryMen([]);
      }

      // Calculate product sales from allOrdersData (Available for both Admin and Seller)
      let productSales: { [id: string]: number } = {};
      if (allOrdersData) {
        allOrdersData.forEach(o => {
          if (o.payment_status === 'paid') {
            const items = Array.isArray(o.items) ? o.items : [];
            items.forEach(item => {
              const pid = item.id || item.product_id;
              const qty = parseInt(item.quantity) || 1;
              if (pid) {
                productSales[pid] = (productSales[pid] || 0) + qty;
              }
            });
          }
        });
      }

      // Fetch products for Most Rated & Top Selling
      let productsQuery = supabase.from('in_house_products').select('*');
      if (currentUser.role === 'seller') {
        productsQuery = productsQuery.contains('attributes', { seller_id: currentUser.id });
      }
      const { data: dashProducts } = await productsQuery;
      const { data: allReviews } = await supabase.from('reviews').select('product_id, rating');

      // Calculate product reviews
      let productReviews: { [id: string]: { sum: number, count: number } } = {};
      if (allReviews) {
        allReviews.forEach(r => {
          if (r.product_id) {
            if (!productReviews[r.product_id]) productReviews[r.product_id] = { sum: 0, count: 0 };
            productReviews[r.product_id].sum += Number(r.rating) || 0;
            productReviews[r.product_id].count += 1;
          }
        });
      }

      if (dashProducts && dashProducts.length > 0) {
         const productsWithStats = dashProducts.map(p => {
           const rev = productReviews[p.id] || { sum: 0, count: 0 };
           const avgRating = rev.count > 0 ? (rev.sum / rev.count) : 0;
           return {
             ...p,
             sold_count: productSales[p.id] || 0,
             rating_avg: avgRating,
             review_count: rev.count
           }
         });
         
         // Sort by review count descending (most rated) and filter out 0 reviews
         const rated = [...productsWithStats]
           .filter(p => p.review_count > 0)
           .sort((a,b) => b.review_count - a.review_count)
           .slice(0, 4);
         setMostRatedProducts(rated);
         
         // Sort by sold_count descending and filter out 0 sales
         const sold = [...productsWithStats]
           .filter(p => p.sold_count > 0)
           .sort((a,b) => b.sold_count - a.sold_count)
           .slice(0, 5);
         setTopSellingProducts(sold);
      }

      setStats({
        totalSales: ordersData?.length || 0,
        totalStores: sellersCount,
        totalProducts: fetchedProductsCount || 0,
        totalCustomers: customersCount,
        pending: pCount,
        confirmed: cCount,
        packaging: pkgCount,
        outForDelivery: ofdCount,
        delivered: dCount,
        canceled: cxCount,
        returned: rCount,
        failed: fCount,
        inHouseProducts: inHouseCount,
        sellerNewRequests: newReqCount,
        sellerApproved: appReqCount,
        sellerUpdateRequests: updReqCount,
        sellerDenied: denReqCount,
        wallet: {
          inHouseEarning,
          commissionEarned,
          deliveryChargeEarned,
          pendingAmount,
          totalTaxCollected
        }
      });

    } catch (error: any) {
      console.error('Error fetching dashboard stats', error);
      setFetchError(error?.message || error?.toString() || 'Unknown error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">{user?.role === 'seller' ? 'Seller Dashboard' : 'Admin Dashboard'}</h1>
          <p className="text-sm font-semibold text-slate-400">Welcome back, <span className="text-slate-700">{user?.name || 'Loading...'}</span></p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Analytics
        </div>
        {fetchError && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 w-full">
            <strong>Debug Error:</strong> {fetchError}
          </div>
        )}
      </div>

      {/* Notifications List */}
      {(() => {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length === 0) return null;
        
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-500" /> Notifications
              </h2>
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                Mark all as read
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {unreadNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="p-4 rounded-xl border flex items-start gap-3 transition bg-blue-50/30 border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 duration-200"
                >
                  <div className="p-2 rounded-full shrink-0 bg-blue-100 text-blue-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{notif.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => toggleNotificationRead(notif.id, notif.is_read)}
                    className="p-1.5 rounded-full hover:bg-blue-100/50 transition text-blue-600"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Business Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" /> Business Analytics
          </h2>
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-600 outline-none bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
          >
            <option value="Overall statistics">Overall statistics</option>
            <option value="Todays Statistics">Todays Statistics</option>
            <option value="This Months Statistics">This Months Statistics</option>
          </select>
        </div>

        <div className={`grid grid-cols-1 ${user?.role === 'seller' ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-6 mb-6`}>
          <StatCard title={user?.role === 'seller' ? "My Total Orders" : "Total Sale"} value={stats.totalSales} icon={TrendingUp} gradient="from-blue-500 to-indigo-600" />
          {user?.role === 'admin' && (
            <StatCard title="Total Stores" value={stats.totalStores} icon={Store} gradient="from-emerald-400 to-teal-600" />
          )}
          <StatCard title={user?.role === 'seller' ? "My Products" : "Total Products"} value={stats.totalProducts} icon={Package} gradient="from-amber-400 to-brand-500" />
          {user?.role === 'admin' && (
            <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} gradient="from-pink-500 to-rose-600" />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SubStatCard title="Pending" value={stats.pending} icon={Clock} textColor="text-blue-600" bgColor="bg-blue-50/70" />
          <SubStatCard title="Confirmed" value={stats.confirmed} icon={CheckCircle} textColor="text-emerald-600" bgColor="bg-emerald-50/70" />
          <SubStatCard title="Packaging" value={stats.packaging} icon={Package} textColor="text-brand-600" bgColor="bg-brand-50/70" />
          <SubStatCard title="Out for delivery" value={stats.outForDelivery} icon={Truck} textColor="text-amber-600" bgColor="bg-amber-50/70" />
          <SubStatCard title="Delivered" value={stats.delivered} icon={CheckCircle} textColor="text-green-600" bgColor="bg-green-50/70" />
          <SubStatCard title="Canceled" value={stats.canceled} icon={XCircle} textColor="text-red-600" bgColor="bg-red-50/70" />
          <SubStatCard title="Returned" value={stats.returned} icon={ArrowLeftRight} textColor="text-purple-600" bgColor="bg-purple-50/70" />
          <SubStatCard title="Failed to delivery" value={stats.failed} icon={XCircle} textColor="text-rose-600" bgColor="bg-rose-50/70" />
        </div>
      </div>

      {user?.role === 'admin' && (
        <>
          {/* Product Analytics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-brand-500" /> Product Analytics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <SubStatCard title="In-House Products" value={stats.inHouseProducts} icon={Store} textColor="text-blue-600" bgColor="bg-blue-50/70" />
              <SubStatCard title="New Requests" value={stats.sellerNewRequests} icon={Clock} textColor="text-brand-600" bgColor="bg-brand-50/70" />
              <SubStatCard title="Approved" value={stats.sellerApproved} icon={CheckCircle} textColor="text-emerald-600" bgColor="bg-emerald-50/70" />
              <SubStatCard title="Update Requests" value={stats.sellerUpdateRequests} icon={History} textColor="text-purple-600" bgColor="bg-purple-50/70" />
              <SubStatCard title="Denied" value={stats.sellerDenied} icon={XCircle} textColor="text-red-600" bgColor="bg-red-50/70" />
            </div>
          </div>
        </>
      )}

      {/* Wallet Section */}
      {/* Wallet Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-brand-500" /> {user?.role === 'seller' ? 'Seller Wallet' : 'Admin Wallet'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Earning Card (Light Premium Theme) */}
          <div className="md:col-span-1 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-blue-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
            <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
              <TrendingUp className="w-7 h-7 text-cyan-600" />
            </div>
            <p className="text-3xl font-black tracking-tight mb-1 text-slate-800">৳{(stats.wallet?.inHouseEarning || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{user?.role === 'seller' ? 'Shop Earning' : 'In-House Earning'}</p>
          </div>

          {/* Smaller Stat Cards */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xl font-black text-slate-800">৳{(stats.wallet?.commissionEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{user?.role === 'seller' ? 'Commission Given' : 'Commission Earned'}</p>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xl font-black text-slate-800">৳{(stats.wallet?.deliveryChargeEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                {user?.role === 'seller' ? <ShoppingBag className="w-5 h-5 text-purple-500" /> : <Truck className="w-5 h-5 text-purple-500" />}
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{user?.role === 'seller' ? 'Total Order Amount' : 'Delivery Charge Earned'}</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xl font-black text-slate-800">৳{(stats.wallet?.totalTaxCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Tax Collected</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xl font-black text-slate-800">৳{(stats.wallet?.pendingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <Clock className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Pending Amount</p>
            </div>
          </div>
        </div>
      </div>


      {/* Earning Statistics Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="text-xl">📊</span> Earning Statistics
          </h2>
          <div className="flex text-xs font-semibold bg-slate-50 border border-slate-200/60 rounded-lg p-1">
            <button className="bg-white text-blue-600 shadow-sm border border-slate-200/50 px-4 py-1.5 rounded-md transition-all">This Year</button>
            <button className="text-slate-500 hover:text-slate-800 px-4 py-1.5 transition-colors">This Month</button>
            <button className="text-slate-500 hover:text-slate-800 px-4 py-1.5 transition-colors">This Week</button>
          </div>
        </div>

        <div className="h-80 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earningsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInHouse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.35}/>
                </linearGradient>
                <linearGradient id="colorVendor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.35}/>
                </linearGradient>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.85}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.35}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                }}
                cursor={{ fill: '#f1f5f9', opacity: 0.5 }} 
              />
              <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600, color: '#64748b' }} />
              
              {user?.role === 'admin' ? (
                <>
                  <Bar dataKey="inHouse" name="In-house" fill="url(#colorInHouse)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="vendor" name="Vendor" fill="url(#colorVendor)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="commission" name="Commission" fill="url(#colorCommission)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </>
              ) : (
                <>
                  <Bar dataKey="vendor" name="My Shop" fill="url(#colorVendor)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="commission" name="Commission Given" fill="url(#colorCommission)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {user?.role === 'admin' && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Customer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
             <Users className="w-4 h-4 text-brand-500" /> Top Customer
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {topCustomers.length > 0 ? topCustomers.map((c, i) => {
              const initials = c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
              const gradients = [
                'from-blue-500 to-indigo-600',
                'from-pink-500 to-rose-600',
                'from-amber-400 to-brand-500',
                'from-emerald-400 to-teal-600',
                'from-violet-500 to-purple-600',
                'from-cyan-400 to-blue-500'
              ];
              const grad = gradients[i % gradients.length];
              return (
                <div key={i} className="flex flex-col items-center group">
                  <div className={`w-12 h-12 bg-gradient-to-tr ${grad} text-white font-black rounded-full mb-2 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {initials}
                  </div>
                  <p className="text-xs font-bold text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors">{c.name}</p>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold mt-1.5">Orders: {c.orders}</span>
                </div>
              );
            }) : <p className="text-xs text-slate-500 col-span-3">No customers found</p>}
          </div>
        </div>

        {/* Most Popular Stores */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
             <Store className="w-4 h-4 text-brand-500" /> Most Popular Stores
          </h2>
          <div className="space-y-4">
            {topStores.length > 0 ? topStores.map((s, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Store className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-brand-500 transition-colors">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  {s.count} <span className="text-red-500 text-sm group-hover:scale-125 transition-transform">♥</span>
                </span>
              </div>
            )) : <p className="text-xs text-slate-500">No stores found</p>}
          </div>
        </div>

        {/* Top Selling Store */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
             <Store className="w-4 h-4 text-brand-500" /> Top Selling Store
          </h2>
          <div className="space-y-4">
            {topSellingStores.length > 0 ? topSellingStores.map((s, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Store className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{s.name}</span>
                </div>
                <span className="text-xs font-black text-blue-600">{s.val}</span>
              </div>
            )) : <p className="text-xs text-slate-500">No stores found</p>}
            </div>
          </div>
        </div>
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Most Rated Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
             <span className="text-yellow-400 text-lg">★</span> Most Rated Products
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {mostRatedProducts.length > 0 ? mostRatedProducts.map((p, i) => (
              <div key={i} className="flex flex-col items-center text-center p-3 border border-slate-100 rounded-xl hover:shadow-md hover:border-slate-200/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="w-16 h-16 bg-slate-50 rounded-lg mb-2.5 flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                  {p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.name_en} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> : <Package className="w-6 h-6 text-slate-400" />}
                </div>
                <p className="text-[11px] font-bold text-slate-700 line-clamp-2 leading-tight h-7 group-hover:text-blue-600 transition-colors">{p.name_en || 'Unknown Product'}</p>
                <p className="text-[10px] text-amber-500 mt-1 font-bold">★ {p.rating_avg ? p.rating_avg.toFixed(1) : '0'} ({p.review_count || 0} Reviews)</p>
              </div>
            )) : <p className="text-xs text-slate-500 col-span-2">No rated products</p>}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
             <Package className="w-4 h-4 text-brand-500" /> Top Selling Products
          </h2>
          <div className="space-y-3.5">
            {topSellingProducts.length > 0 ? topSellingProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0 cursor-pointer group">
                <div className="flex items-center gap-3 w-3/4">
                  <div className="w-9 h-9 rounded bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.name_en} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> : <Package className="w-4 h-4 text-slate-400" />}
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 truncate group-hover:text-brand-500 transition-colors">{p.name_en || 'Unknown Product'}</span>
                </div>
                <span className="text-[10px] font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2.5 py-1 rounded-full shadow-sm">
                  Sold: {p.sold_count || 0}
                </span>
              </div>
            )) : <p className="text-xs text-slate-500">No selling products</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
