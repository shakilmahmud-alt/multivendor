import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  Search, LayoutDashboard, Truck, Monitor, Target, ShoppingBag, 
  ShoppingCart, RefreshCcw, FolderTree, Tag, Box, Store, 
  BookOpen, Image as ImageIcon, Gift, Bell, Megaphone, 
  MessageSquare, LifeBuoy, BarChart3, TrendingUp, FileText, 
  Users, UserCheck, Bike, Briefcase, UserPlus, ChevronDown, 
  Menu, Globe, Settings, User, LogOut, CheckCircle2, Circle, X, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [refundsOpen, setRefundsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [inHouseProductsOpen, setInHouseProductsOpen] = useState(false);
  const [vendorProductsOpen, setVendorProductsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [sellersOpen, setSellersOpen] = useState(false);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [refundCounts, setRefundCounts] = useState<Record<string, number>>({
    pending: 0,
    approved: 0,
    refunded: 0,
    rejected: 0
  });
  const [user, setUser] = useState<{ id: string; role: string; name: string; image?: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerMessages, setHeaderMessages] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);
  const [showCouponPopup, setShowCouponPopup] = useState(false);
  const [showFlashDealPopup, setShowFlashDealPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getSearchableItems = () => {
    const items = [
      { title: 'Dashboard', path: user?.role === 'seller' ? '/seller' : '/admin', icon: LayoutDashboard },
      { title: 'Settings', path: user?.role === 'seller' ? '/seller/settings' : '/admin/settings', icon: Settings },
      { title: 'Messages', path: user?.role === 'seller' ? '/seller/messages' : '/admin/messages', icon: MessageSquare },
    ];
    if (user?.role === 'admin') {
      items.push(
        { title: 'Suppliers', path: '/admin/suppliers', icon: Truck },
        { title: 'POS', path: '/admin/pos', icon: Monitor },
        { title: 'Purchase List', path: '/admin/purchases', icon: ShoppingBag },
        { title: 'Orders (All)', path: '/admin/orders/all', icon: ShoppingCart },
        { title: 'Orders (Pending)', path: '/admin/orders/pending', icon: ShoppingCart },
        { title: 'Orders (Confirmed)', path: '/admin/orders/confirmed', icon: ShoppingCart },
        { title: 'Orders (Packaging)', path: '/admin/orders/packaging', icon: ShoppingCart },
        { title: 'Orders (Out for delivery)', path: '/admin/orders/out_for_delivery', icon: ShoppingCart },
        { title: 'Orders (Delivered)', path: '/admin/orders/delivered', icon: ShoppingCart },
        { title: 'Orders (Returned)', path: '/admin/orders/returned', icon: ShoppingCart },
        { title: 'Orders (Failed to Deliver)', path: '/admin/orders/failed', icon: ShoppingCart },
        { title: 'Orders (Canceled)', path: '/admin/orders/canceled', icon: ShoppingCart },
        { title: 'Refund Requests (Pending)', path: '/admin/refunds?status=pending', icon: RefreshCcw },
        { title: 'Refund Requests (Approved)', path: '/admin/refunds?status=approved', icon: RefreshCcw },
        { title: 'Refund Requests (Refunded)', path: '/admin/refunds?status=refunded', icon: RefreshCcw },
        { title: 'Refund Requests (Rejected)', path: '/admin/refunds?status=rejected', icon: RefreshCcw },
        { title: 'Category Setup', path: '/admin/categories', icon: FolderTree },
        { title: 'Sub Categories', path: '/admin/sub-categories', icon: FolderTree },
        { title: 'Sub Sub Categories', path: '/admin/sub-sub-categories', icon: FolderTree },
        { title: 'Brands (Add New)', path: '/admin/brands/add', icon: Tag },
        { title: 'Brands (List)', path: '/admin/brands/list', icon: Tag },
        { title: 'Product Attributes', path: '/admin/product-attributes', icon: Box },
        { title: 'In-house Products (List)', path: '/admin/in-house-products/list', icon: Store },
        { title: 'In-house Products (Add)', path: '/admin/in-house-products/add', icon: Store },
        { title: 'Seller Products (New Requests)', path: '/admin/seller-products/new-requests', icon: Store },
        { title: 'Seller Products (Update Requests)', path: '/admin/seller-products/update-requests', icon: Store },
        { title: 'Seller Products (Approved)', path: '/admin/seller-products/approved', icon: Store },
        { title: 'Seller Products (Denied)', path: '/admin/seller-products/denied', icon: Store },
        { title: 'Banners', path: '/admin/banner-setup', icon: ImageIcon },
        { title: 'Coupons', path: '/admin/coupons', icon: Gift },
        { title: 'Flash Deals', path: '/admin/flash-deals', icon: Gift },
        { title: 'Earning Reports', path: '/admin/earning-reports', icon: BarChart3 },
        { title: 'Transaction Report', path: '/admin/transaction-report', icon: BarChart3 },
        { title: 'Gross Profit', path: '/admin/gross-profit', icon: BarChart3 },
        { title: 'Customer List', path: '/admin/customers/list', icon: Users },
        { title: 'Customer Reviews', path: '/admin/customers/reviews', icon: Users },
        { title: 'Seller List', path: '/admin/sellers', icon: UserCheck },
        { title: 'Shipping Method', path: '/admin/shipping-methods', icon: Truck },
        { title: 'Support Ticket', path: '/admin/support-tickets', icon: LifeBuoy }
      );
    }
    if (user?.role === 'seller') {
      items.push(
        { title: 'Orders (All)', path: '/seller/orders/all', icon: ShoppingCart },
        { title: 'Refund Requests (Pending)', path: '/seller/refunds?status=pending', icon: RefreshCcw },
        { title: 'Products (List)', path: '/seller/products/list', icon: Box },
        { title: 'Products (Add New)', path: '/seller/products/add', icon: Box },
        { title: 'Coupons', path: '/seller/coupons', icon: Gift },
        { title: 'Join Flash Deals', path: '/seller/flash-deals/join', icon: Gift },
        { title: 'My Flash Deals', path: '/seller/flash-deals', icon: Gift },
        { title: 'Customer List', path: '/seller/customers/list', icon: Users },
        { title: 'Customer Reviews', path: '/seller/customers/reviews', icon: Users },
        { title: 'Transaction Report', path: '/seller/transaction-report', icon: FileText }
      );
    }
    return items;
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadCoupons = notifications.filter(n => !n.is_read && n.type === 'coupon');
  const unreadFlashDeals = notifications.filter(n => !n.is_read && n.type === 'flash_deal');

  useEffect(() => {
    if (user?.role === 'seller') {
      if (unreadCoupons.length > 0) setShowCouponPopup(true);
      if (unreadFlashDeals.length > 0) setShowFlashDealPopup(true);
    }
  }, [unreadCoupons.length, unreadFlashDeals.length, user?.role]);

  useEffect(() => {
    if (unreadNotifications.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentNotifIndex(prev => (prev + 1) % unreadNotifications.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [unreadNotifications.length]);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        
        // Fetch fresh user data to get the profile image
        if (parsed.role === 'seller') {
          const { data } = await supabase.from('sellers').select('*').eq('id', parsed.id).single();
          if (data) {
            setUser({ ...parsed, image: data.seller_image_url });
          } else {
            setUser(parsed);
          }
        } else {
          setUser(parsed);
        }
      } else {
        navigate('/login');
      }
    };
    
    fetchUser();

    // Listen for custom event from Settings page
    const handleUserUpdate = () => {
      fetchUser();
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifications(user);
      fetchHeaderMessages();

      const channel = supabase
        .channel('admin-notifications-layout')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          (payload) => {
            fetchNotifications(user);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchHeaderMessages = async () => {
    try {
      if (!user) return;
      let query = supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (user.role === 'seller') {
        query = query.eq('seller_id', user.id);
      } else {
        // For admin we could show all or a specific set, let's show all
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setHeaderMessages(data || []);
      setUnreadMessagesCount(data ? data.filter(m => !m.is_read).length : 0);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const toggleMessageReadStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ is_read: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      const updated = headerMessages.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m);
      setHeaderMessages(updated);
      setUnreadMessagesCount(updated.filter(m => !m.is_read).length);
    } catch (err) {
      console.error('Error toggling message status:', err);
    }
  };

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
      setUnreadCount(data ? data.filter(n => !n.is_read).length : 0);
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
      
      const updated = notifications.map(n => n.id === id ? { ...n, is_read: !currentStatus } : n);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.is_read).length);
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
      
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updated);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  useEffect(() => {
    // Open orders menu automatically if we're on an orders page
    if (location.pathname.includes('/admin/orders')) {
      setOrdersOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (ordersOpen && user) {
      fetchOrderCounts();
    }
    if (refundsOpen && user) {
      fetchRefundCounts();
    }
  }, [ordersOpen, refundsOpen, user]);

  const fetchOrderCounts = async () => {
    if (!user) return;
    try {
      let query = supabase.from('orders').select('status');
      if (user.role === 'seller') {
        query = query.eq('seller_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      const counts: Record<string, number> = {
        all: data.length,
        pending: 0,
        confirmed: 0,
        packaging: 0,
        out_for_delivery: 0,
        delivered: 0,
        returned: 0,
        failed: 0,
        canceled: 0
      };

      data.forEach(order => {
        const s = order.status?.toLowerCase().replace(' ', '_');
        if (counts[s] !== undefined) {
          counts[s]++;
        }
      });
      
      setOrderCounts(counts);
    } catch (err) {
      console.error('Error fetching order counts:', err);
    }
  };

  const fetchRefundCounts = async () => {
    if (!user) return;
    try {
      let query = supabase.from('refund_requests').select('status, orders!inner(seller_id)');
      if (user.role === 'seller') {
        query = query.eq('orders.seller_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      const counts: Record<string, number> = {
        pending: 0,
        approved: 0,
        refunded: 0,
        rejected: 0
      };

      data.forEach(req => {
        const s = req.status?.toLowerCase();
        if (counts[s] !== undefined) {
          counts[s]++;
        }
      });
      
      setRefundCounts(counts);
    } catch (err) {
      console.error('Error fetching refund counts:', err);
    }
  };

  const NavItem = ({ icon: Icon, text, hasDropdown = false, isOpen = false }: any) => (
    <div className={`flex items-center justify-between px-4 py-2 hover:bg-[#1e293b] hover:text-white cursor-pointer transition text-sm ${isOpen ? 'text-white bg-[#1e293b]' : 'text-slate-300'}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${isOpen ? 'text-blue-500' : ''}`} />
        <span>{text}</span>
      </div>
      {hasDropdown && <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
    </div>
  );

  const NavSection = ({ title }: { title: string }) => (
    <div className="px-4 py-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
      {title}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-[#0f172a] h-full flex flex-col transition-all duration-300 overflow-y-auto overflow-x-hidden no-scrollbar shrink-0`}>
        {/* Logo Area */}
        <div className="flex items-center justify-center h-16 border-b border-slate-800 bg-[#0f172a] shrink-0 sticky top-0 z-10">
          <Link to="/admin" className="flex items-center gap-2">
             <img src="https://ik.imagekit.io/eg7u6xcn0u/HolidayMart-logo-wide.png" alt="HolidayMart" className="h-6" />
          </Link>
        </div>

        {/* Sidebar Nav */}
        <div className="py-4">
          <div className="px-4 mb-4">
            <div className="bg-slate-800 flex items-center px-3 py-2 rounded">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search menu..." 
                className="bg-transparent border-none outline-none text-white text-xs ml-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {searchQuery ? (
            <div className="px-2">
              {getSearchableItems()
                .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item, idx) => (
                  <Link key={idx} to={item.path} onClick={() => setSearchQuery('')}>
                    <NavItem icon={item.icon} text={item.title} />
                  </Link>
                ))}
              {getSearchableItems().filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="text-slate-400 text-xs px-4 py-8 text-center bg-slate-800/30 rounded mx-2 border border-slate-700/50 mt-4">
                  <Search className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-50" />
                  No matching menus
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to={user?.role === 'seller' ? "/seller" : "/admin"}><NavItem icon={LayoutDashboard} text="Dashboard" /></Link>
          
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/suppliers"><NavItem icon={Truck} text="Suppliers" /></Link>
              <Link to="/admin/pos"><NavItem icon={Monitor} text="POS" /></Link>
              <Link to="/admin/purchases"><NavItem icon={ShoppingBag} text="Purchase List" /></Link>
            </>
          )}

          <NavSection title="ORDER MANAGEMENT" />
          <div>
            <div onClick={() => setOrdersOpen(!ordersOpen)}>
              <NavItem icon={ShoppingCart} text="Orders" hasDropdown isOpen={ordersOpen} />
            </div>
            {ordersOpen && (
              <div className="bg-[#10192b] py-2 flex flex-col">
                <Link to={user?.role === 'seller' ? "/seller/orders/all" : "/admin/orders/all"} className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> All</div>
                  <span className="bg-[#1e3a5f] text-[#38bdf8] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.all || 0}</span>
                </Link>
                <Link to="/admin/orders/pending" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Pending</div>
                  <span className="bg-[#1e3a5f] text-[#38bdf8] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.pending || 0}</span>
                </Link>
                <Link to="/admin/orders/confirmed" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-emerald-400"></div> Confirmed</div>
                  <span className="bg-[#113a36] text-[#34d399] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.confirmed || 0}</span>
                </Link>
                <Link to="/admin/orders/packaging" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-yellow-400"></div> Packaging</div>
                  <span className="bg-[#3b301a] text-[#fbbf24] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.packaging || 0}</span>
                </Link>
                <Link to="/admin/orders/out_for_delivery" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-brand-400"></div> Out for delivery</div>
                  <span className="bg-[#3a2618] text-[#fb923c] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.out_for_delivery || 0}</span>
                </Link>
                <Link to="/admin/orders/delivered" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-emerald-400"></div> Delivered</div>
                  <span className="bg-[#113a36] text-[#34d399] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.delivered || 0}</span>
                </Link>
                <Link to="/admin/orders/returned" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-red-400"></div> Returned</div>
                  <span className="bg-[#3a1d26] text-[#fb7185] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.returned || 0}</span>
                </Link>
                <Link to="/admin/orders/failed" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-red-400"></div> Failed to Deliver</div>
                  <span className="bg-[#3a1d26] text-[#fb7185] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.failed || 0}</span>
                </Link>
                <Link to="/admin/orders/canceled" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-red-400"></div> Canceled</div>
                  <span className="bg-[#3a1d26] text-[#fb7185] px-2 py-0.5 rounded-md text-[10px] font-bold">{orderCounts.canceled || 0}</span>
                </Link>
              </div>
            )}
          </div>

          <div>
            <div onClick={() => setRefundsOpen(!refundsOpen)}>
              <NavItem icon={RefreshCcw} text="Refund Requests" hasDropdown isOpen={refundsOpen} />
            </div>
            
            {refundsOpen && (
              <div className="bg-[#0b1f38] py-2 space-y-1">
                <Link to={user?.role === 'seller' ? "/seller/refunds?status=pending" : "/admin/refunds?status=pending"} className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Pending</div>
                  <span className="bg-[#3a1d26] text-[#fb7185] px-2 py-0.5 rounded-md text-[10px] font-bold">{refundCounts.pending || 0}</span>
                </Link>
                <Link to="/admin/refunds?status=approved" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Approved</div>
                  <span className="bg-[#1e3a5f] text-cyan-400 px-2 py-0.5 rounded-md text-[10px] font-bold">{refundCounts.approved || 0}</span>
                </Link>
                <Link to="/admin/refunds?status=refunded" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Refunded</div>
                  <span className="bg-[#103a3a] text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold">{refundCounts.refunded || 0}</span>
                </Link>
                <Link to="/admin/refunds?status=rejected" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Rejected</div>
                  <span className="bg-[#3a1d26] text-[#fb7185] px-2 py-0.5 rounded-md text-[10px] font-bold">{refundCounts.rejected || 0}</span>
                </Link>
              </div>
            )}
          </div>

          {user?.role === 'admin' && (
            <>
              <NavSection title="PRODUCT MANAGEMENT" />
              <div>
            <div onClick={() => setCategoriesOpen(!categoriesOpen)}>
              <NavItem icon={FolderTree} text="Category Setup" hasDropdown isOpen={categoriesOpen} />
            </div>
            
            {categoriesOpen && (
              <div className="bg-[#0b1f38] py-2 space-y-1">
                <Link to="/admin/categories" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Categories
                </Link>
                <Link to="/admin/sub-categories" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Sub Categories
                </Link>
                <Link to="/admin/sub-sub-categories" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Sub Sub Categories
                </Link>
              </div>
            )}
          </div>
          <div>
            <div onClick={() => setBrandsOpen(!brandsOpen)}>
              <NavItem icon={Tag} text="Brands" hasDropdown isOpen={brandsOpen} />
            </div>
            {brandsOpen && (
              <div className="bg-[#0b1f38] py-2 space-y-1">
                <Link to="/admin/brands/add" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Add New
                </Link>
                <Link to="/admin/brands/list" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> List
                </Link>
              </div>
            )}
          </div>
          <Link to="/admin/product-attributes">
            <NavItem icon={Box} text="Product Attributes" />
          </Link>
          <div>
            <div onClick={() => setInHouseProductsOpen(!inHouseProductsOpen)}>
              <NavItem icon={Store} text="In-house Products" hasDropdown isOpen={inHouseProductsOpen} />
            </div>
            {inHouseProductsOpen && (
              <div className="bg-[#0b1f38] py-2 space-y-1">
                <Link to="/admin/in-house-products/list" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Product List
                </Link>
                <Link to="/admin/in-house-products/add" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Add New Product
                </Link>
              </div>
            )}
          </div>
          </>
        )}

          {user?.role === 'seller' && (
            <>
              <NavSection title="PRODUCT MANAGEMENT" />
              <div>
                <div onClick={() => setProductsOpen(!productsOpen)}>
                  <NavItem icon={Box} text="Products" hasDropdown isOpen={productsOpen} />
                </div>
                {productsOpen && (
                  <div className="bg-[#0b1f38] py-2 space-y-1">
                    <Link to="/seller/products/list" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Product List
                    </Link>
                    <Link to="/seller/products/add" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Add New Product
                    </Link>
                  </div>
                )}
              </div>
              <NavSection title="PROMOTION MANAGEMENT" />
              <div>
                <div 
                  className={`flex items-center justify-between px-4 py-2 hover:bg-[#1e293b] hover:text-white cursor-pointer transition text-sm ${offersOpen ? 'text-white bg-[#1e293b]' : 'text-slate-300'}`}
                  onClick={() => setOffersOpen(!offersOpen)}
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4" />
                    <span>Offers & Deals</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${offersOpen ? 'rotate-180' : ''}`} />
                </div>
                {offersOpen && (
                  <div className="bg-[#0f172a] py-2">
                    <Link to="/seller/coupons" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Coupon
                    </Link>
                    <Link to="/seller/flash-deals/join" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Join Flash Deals
                    </Link>
                    <Link to="/seller/flash-deals" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> My Flash Deals
                    </Link>
                  </div>
                )}
              </div>
              <NavSection title="USER MANAGEMENT" />
              <div>
                <div 
                  className={`flex items-center justify-between px-4 py-2 hover:bg-[#1e293b] hover:text-white cursor-pointer transition text-sm ${customersOpen ? 'text-white bg-[#1e293b]' : 'text-slate-300'}`}
                  onClick={() => setCustomersOpen(!customersOpen)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>Customers</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${customersOpen ? 'rotate-180' : ''}`} />
                </div>
                {customersOpen && (
                  <div className="bg-[#10192b] py-2 flex flex-col">
                    <Link to="/seller/customers/list" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Customer List</div>
                    </Link>
                    <Link to="/seller/customers/reviews" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Customer Reviews</div>
                    </Link>
                  </div>
                )}
              </div>
              <NavSection title="REPORTS & ANALYSIS" />
              <Link to="/seller/transaction-report"><NavItem icon={FileText} text="Transaction Report" /></Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div>
                <div onClick={() => setVendorProductsOpen(!vendorProductsOpen)}>
                  <NavItem icon={Store} text="Seller Products" hasDropdown isOpen={vendorProductsOpen} />
                </div>
                {vendorProductsOpen && (
                  <div className="bg-[#0b1f38] py-2 space-y-1">
                    <Link to="/admin/seller-products/new-requests" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> New Products Requests
                    </Link>
                    <Link to="/admin/seller-products/update-requests" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Product Update Requests
                    </Link>
                    <Link to="/admin/seller-products/approved" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Approved Products
                    </Link>
                    <Link to="/admin/seller-products/denied" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Denied Products
                    </Link>
                  </div>
                )}
              </div>

              <NavSection title="PROMOTION MANAGEMENT" />
              <Link to="/admin/banner-setup"><NavItem icon={ImageIcon} text="Banners" /></Link>
              
              <div>
                <div 
                  className={`flex items-center justify-between px-4 py-2 hover:bg-[#1e293b] hover:text-white cursor-pointer transition text-sm ${offersOpen ? 'text-white bg-[#1e293b]' : 'text-slate-300'}`}
                  onClick={() => setOffersOpen(!offersOpen)}
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4" />
                    <span>Offers & Deals</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${offersOpen ? 'rotate-180' : ''}`} />
                </div>
                {offersOpen && (
                  <div className="bg-[#0f172a] py-2">
                    <Link to="/admin/coupons" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Coupon
                    </Link>
                    <Link to="/admin/flash-deals" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Flash Deals
                    </Link>
                  </div>
                )}
              </div>


              <NavSection title="REPORTS & ANALYSIS" />
              <div>
                <div 
                  className={`flex items-center justify-between px-4 py-2 hover:bg-[#1e293b] hover:text-white cursor-pointer transition text-sm ${reportsOpen ? 'text-white bg-[#1e293b]' : 'text-slate-300'}`}
                  onClick={() => setReportsOpen(!reportsOpen)}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4" />
                    <span>Sales & Transaction Report</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
                </div>
                {reportsOpen && (
                  <div className="bg-[#0f172a] py-2">
                    <Link to="/admin/earning-reports" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Earning Reports
                    </Link>
                    <Link to="/admin/transaction-report" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Transaction Report
                    </Link>
                    <Link to="/admin/gross-profit" className="flex items-center gap-2 px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Gross Profit
                    </Link>
                  </div>
                )}
              </div>


              <NavSection title="USER MANAGEMENT" />
              <div>
                <div 
                  className={`flex items-center justify-between px-4 py-2 hover:bg-[#1e293b] hover:text-white cursor-pointer transition text-sm ${customersOpen ? 'text-white bg-[#1e293b]' : 'text-slate-300'}`}
                  onClick={() => setCustomersOpen(!customersOpen)}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4" />
                    <span>Customers</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${customersOpen ? 'rotate-180' : ''}`} />
                </div>
                {customersOpen && (
                  <div className="bg-[#10192b] py-2 flex flex-col">
                    <Link to="/admin/customers/list" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Customer List</div>
                    </Link>
                    <Link to="/admin/customers/reviews" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Customer Reviews</div>
                    </Link>
                  </div>
                )}
              </div>
              
              <div>
                <div 
                  className={`flex items-center justify-between px-4 py-2 hover:bg-[#1e293b] hover:text-white cursor-pointer transition text-sm ${sellersOpen ? 'text-white bg-[#1e293b]' : 'text-slate-300'}`}
                  onClick={() => setSellersOpen(!sellersOpen)}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4" />
                    <span>Sellers</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${sellersOpen ? 'rotate-180' : ''}`} />
                </div>
                {sellersOpen && (
                  <div className="bg-[#10192b] py-2 flex flex-col">
                    <Link to="/admin/sellers" className="flex items-center justify-between px-10 py-2 text-[13px] text-slate-300 hover:text-white transition group">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-400"></div> Seller List</div>
                    </Link>
                  </div>
                )}
              </div>


            </>
          )}

          {/* Settings available for both admin and seller */}
          <NavSection title="SYSTEM SETTINGS" />
          {user?.role === 'admin' && (
            <Link to="/admin/home-layout">
              <NavItem icon={LayoutDashboard} text="Home Layout" />
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin/shipping-methods">
              <NavItem icon={Truck} text="Shipping Method" />
            </Link>
          )}
          <Link to={user?.role === 'seller' ? "/seller/settings" : "/admin/settings"}>
            <NavItem icon={Settings} text="Settings" />
          </Link>

          {/* Help & Support (Visible to both) */}
          <NavSection title="HELP & SUPPORT" />
          <Link to={user?.role === 'seller' ? "/seller/messages" : "/admin/messages"}>
            <NavItem icon={MessageSquare} text="Messages" />
          </Link>
          {user?.role !== 'seller' && (
            <Link to="/admin/support-tickets">
              <NavItem icon={LifeBuoy} text="Support Ticket" />
            </Link>
          )}
          
            </>
          )}

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 shrink-0 z-10 border-b border-slate-200">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-700">
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Notification Ticker */}
            {unreadNotifications.length > 0 && (
              <div className="hidden md:flex flex-1 max-w-4xl mx-4 relative h-10 items-center bg-blue-50/50 rounded-full px-4 border border-blue-100 overflow-hidden group shadow-inner">
                <Bell className="w-4 h-4 text-blue-500 shrink-0 animate-bounce mr-3" />
                <div className="flex-1 relative h-full">
                  {unreadNotifications.map((notif, idx) => (
                    <div 
                      key={notif.id}
                      className={`absolute inset-0 flex items-center justify-between transition-opacity duration-500 ${idx === (currentNotifIndex % unreadNotifications.length) ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                    >
                      <div className="flex items-center gap-2 truncate pr-4">
                        <span className="text-xs font-bold text-blue-700 shrink-0">{notif.title}:</span>
                        <span className="text-xs text-blue-600 truncate">{notif.message}</span>
                      </div>
                      <button 
                        onClick={() => toggleNotificationRead(notif.id, notif.is_read)}
                        className="text-[10px] bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-600 hover:text-white transition shrink-0 font-medium whitespace-nowrap shadow-sm"
                      >
                        Mark Read
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2 border-l border-blue-200 pl-2">
                  <button 
                    onClick={() => setCurrentNotifIndex(prev => (prev - 1 + unreadNotifications.length) % unreadNotifications.length)}
                    className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-blue-400 min-w-[20px] text-center">
                    {(currentNotifIndex % unreadNotifications.length) + 1}/{unreadNotifications.length}
                  </span>
                  <button 
                    onClick={() => setCurrentNotifIndex(prev => (prev + 1) % unreadNotifications.length)}
                    className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 text-sm text-slate-600 font-medium">
              <Globe className="w-4 h-4" /> English <ChevronDown className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div 
                  className="cursor-pointer text-slate-500 hover:text-slate-700"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-md shadow-xl border border-slate-200 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[10px] text-blue-500 hover:text-blue-700 font-bold uppercase tracking-wider">
                            Mark all as read
                          </button>
                        )}
                        <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No notifications yet.</div>
                      ) : (
                        notifications.map((notif: any) => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (notif.link) {
                                navigate(notif.link);
                                setNotificationsOpen(false);
                              }
                            }}
                            className={`p-3 border-b border-slate-50 flex gap-3 transition ${notif.link ? 'cursor-pointer' : ''} ${notif.type === 'coupon' ? (!notif.is_read ? 'bg-amber-50 hover:bg-amber-100' : 'bg-amber-50/30 hover:bg-amber-50') : (!notif.is_read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50')}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notif.type === 'coupon' ? 'text-amber-800' : (!notif.is_read ? 'font-semibold text-slate-800' : 'text-slate-700')} ${!notif.is_read ? 'font-semibold' : ''}`}>
                                {notif.type === 'coupon' && <Tag className="w-3.5 h-3.5 inline mr-1 text-amber-600 mb-0.5"/>}
                                {notif.title}
                              </p>
                              <p className={`text-xs mt-0.5 line-clamp-2 ${notif.type === 'coupon' ? 'text-amber-700/80' : 'text-slate-500'}`}>{notif.message}</p>
                              <p className={`text-[10px] mt-1 ${notif.type === 'coupon' ? 'text-amber-600/60' : 'text-slate-400'}`}>
                                {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-start pt-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNotificationRead(notif.id, notif.is_read);
                                }}
                                title={notif.is_read ? "Mark as unread" : "Mark as read"}
                                className={`${notif.type === 'coupon' ? (notif.is_read ? 'text-amber-300 hover:text-amber-500' : 'text-amber-600 hover:text-amber-800') : (notif.is_read ? 'text-slate-300 hover:text-slate-500' : 'text-blue-500 hover:text-blue-700')}`}
                              >
                                {notif.is_read ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" fill="currentColor" />}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <div 
                  className="cursor-pointer text-slate-500 hover:text-slate-700"
                  onClick={() => {
                    setMessagesOpen(!messagesOpen);
                    setNotificationsOpen(false);
                    setProfileOpen(false);
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                      {unreadMessagesCount}
                    </span>
                  )}
                </div>

                {/* Messages Dropdown */}
                {messagesOpen && (
                  <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200 py-2 z-50">
                    <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-800">Messages</h3>
                      <Link to={user?.role === 'seller' ? "/seller/messages" : "/admin/messages"} onClick={() => setMessagesOpen(false)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">View All</Link>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {headerMessages.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No messages.</div>
                      ) : (
                        headerMessages.map((msg: any) => (
                          <div key={msg.id} className={`p-3 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition ${!msg.is_read ? 'bg-brand-50/30' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!msg.is_read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                                {msg.customer_name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{msg.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-start pt-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMessageReadStatus(msg.id, msg.is_read);
                                }}
                                title={msg.is_read ? "Mark as unread" : "Mark as read"}
                                className={`${msg.is_read ? 'text-slate-300 hover:text-slate-500' : 'text-brand-500 hover:text-brand-700'}`}
                              >
                                {msg.is_read ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" fill="currentColor" />}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 border-l pl-6 border-slate-200 cursor-pointer relative" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); setMessagesOpen(false); }}>
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || 'Loading...'}</p>
                <p className="text-[10px] text-slate-500 font-semibold capitalize">{user?.role || 'Admin'}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-slate-300">
                {user?.image ? (
                  <img src={user.image} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-500" />
                )}
              </div>
              
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(user?.role === 'seller' ? '/seller/settings' : '/admin/settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('user');
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>

      {/* Coupon Notification Popup for Sellers */}
      {showCouponPopup && unreadCoupons.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-amber-500 p-6 text-center relative">
              <button 
                onClick={() => setShowCouponPopup(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Tag className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">New Coupon Available!</h2>
              <p className="text-amber-100 text-sm mt-1">Boost your sales with our latest offer</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 max-h-[30vh] overflow-y-auto mb-6">
                {unreadCoupons.map(coupon => (
                  <div key={coupon.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="font-bold text-slate-800 text-sm">{coupon.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{coupon.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowCouponPopup(false);
                    navigate('/seller/coupons');
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg transition"
                >
                  View Coupons Now
                </button>
                
                <label className="flex items-center justify-center gap-2 cursor-pointer mt-2 group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    onChange={async (e) => {
                      if (e.target.checked) {
                        for (const coupon of unreadCoupons) {
                          await toggleNotificationRead(coupon.id, false);
                        }
                        setTimeout(() => setShowCouponPopup(false), 300);
                      }
                    }}
                  />
                  <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition">Mark as read and don't show again</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flash Deal Notification Popup for Sellers */}
      {showFlashDealPopup && unreadFlashDeals.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-blue-600 p-6 text-center relative">
              <button 
                onClick={() => setShowFlashDealPopup(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">New Flash Deal!</h2>
              <p className="text-blue-100 text-sm mt-1">Join the latest flash deal campaign</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 max-h-[30vh] overflow-y-auto mb-6">
                {unreadFlashDeals.map(deal => (
                  <div key={deal.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="font-bold text-slate-800 text-sm">{deal.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{deal.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowFlashDealPopup(false);
                    navigate('/seller/flash-deals/join');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition"
                >
                  Join Flash Deal
                </button>
                
                <label className="flex items-center justify-center gap-2 cursor-pointer mt-2 group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    onChange={async (e) => {
                      if (e.target.checked) {
                        for (const deal of unreadFlashDeals) {
                          await toggleNotificationRead(deal.id, false);
                        }
                        setTimeout(() => setShowFlashDealPopup(false), 300);
                      }
                    }}
                  />
                  <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition">Mark as read and don't show again</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
