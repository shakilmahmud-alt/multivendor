import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import {
  User,
  Package,
  Heart,
  Wallet,
  Gift,
  MessageSquare,
  MapPin,
  LifeBuoy,
  Users,
  Tag,
  Truck,
  MoreVertical,
  Search,
  Send,
  Eye,
  Download,
  Star,
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowLeft,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useToast } from "../components/ToastContext";
import { uploadToCpanel } from "../utils/mediaUpload";

export default function MyAccount({ wishlist: propsWishlist, setWishlist: propsSetWishlist }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Extract tab from URL query params, default to 'profile'
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [localWishlist, setLocalWishlist] = useState<any[]>(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  const wishlist = propsWishlist || localWishlist;
  const setWishlist = propsSetWishlist || setLocalWishlist;

  const handleRemoveWishlist = async (id: string) => {
    const newWishlist = wishlist.filter((item) => item.id !== id);
    setWishlist(newWishlist);
    localStorage.setItem("wishlist", JSON.stringify(newWishlist));
    
    const session = localStorage.getItem('user');
    if (session) {
      const user = JSON.parse(session);
      try {
        await supabase.from('wishlists').delete().match({
          user_id: user.id,
          product_id: id
        });
      } catch (err) {}
    }
  };

  // Inbox State
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedVendor]);

  // Support Ticket State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketType, setTicketType] = useState("Website problem");
  const [ticketPriority, setTicketPriority] = useState("Low");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketAttachments, setTicketAttachments] = useState<File[]>([]);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [customerReplyText, setCustomerReplyText] = useState("");

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderTab, setOrderTab] = useState<
    "summary" | "vendor" | "reviews" | "track"
  >("summary");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [loyaltyPoints, setLoyaltyPoints] = useState<any[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);
  const [coupons, setCoupons] = useState<any[]>([]);

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    address_type: 'Home',
    contact_person_name: '',
    phone: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Bangladesh',
    address: '',
    latitude: 23.8103,
    longitude: 90.4125
  });

  useEffect(() => {
    const session = localStorage.getItem("user");
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.role !== "customer") {
        navigate("/");
      } else {
        setUser(parsed);
        const nameParts = (parsed.name || "").split(" ");
        setFirstName(parsed.first_name || nameParts[0] || "");
        setLastName(parsed.last_name || nameParts.slice(1).join(" ") || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");

        fetchMessages(parsed.phone || "N/A");
        fetchTickets(parsed.id);
        fetchOrders(parsed.id);
        fetchLoyaltyPoints(parsed.id);
        fetchCoupons();
        fetchAddresses(parsed.id);
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "inbox" && user?.phone) {
      const channel = supabase
        .channel("public:support_messages_customer")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_messages",
            filter: `customer_phone=eq.${user.phone}`,
          },
          (payload) => {
            fetchMessages(user.phone);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeTab, user]);

  const fetchMessages = async (customerPhone: string) => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select(
          `
          *,
          sellers(id, shop_name, shop_logo_url)
        `,
        )
        .eq("customer_phone", customerPhone)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Select vendor with the latest message by default if none is selected
      setSelectedVendor((currentSelected: any) => {
        if (currentSelected) return currentSelected;
        if (data && data.length > 0) {
          return data[data.length - 1].sellers || {
            id: "admin",
            shop_name: "Admin",
            shop_logo_url: "",
          };
        }
        return null;
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchTickets = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  const fetchOrders = async (customerId: string) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, sellers(shop_name, shop_logo_url)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchLoyaltyPoints = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLoyaltyPoints(data || []);
      const balance = (data || []).reduce((acc: number, row: any) => {
        if (new Date(row.expires_at) > new Date()) {
          return acc + (row.remaining_points || 0);
        }
        return acc;
      }, 0);
      setLoyaltyBalance(balance);
    } catch (err) {
      console.error("Error fetching loyalty points:", err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*, sellers(shop_name, shop_logo_url)")
        .eq("status", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error("Error fetching coupons:", err);
    }
  };

  const fetchAddresses = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = { ...addressFormData, customer_id: user.id };
      const { error } = await supabase.from("customer_addresses").insert([payload]);
      if (error) throw error;
      showToast("Address saved successfully!", "success");
      setShowAddressModal(false);
      fetchAddresses(user.id);
      setAddressFormData({
        address_type: 'Home',
        contact_person_name: '',
        phone: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Bangladesh',
        address: '',
        latitude: 23.8103,
        longitude: 90.4125
      });
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };


  const handleCancelOrder = async () => {
    if (!selectedOrder || selectedOrder.status !== 'pending') return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', selectedOrder.id);
        
      if (error) throw error;
      
      // Auto-remove "New Order Received" notification for this order
      await supabase
        .from('notifications')
        .delete()
        .like('message', `%Order #${selectedOrder.id.toUpperCase()}%`);
      
      showToast("Order cancelled successfully", "success");
      
      // Update local state
      const updatedOrder = { ...selectedOrder, status: 'cancelled' };
      setSelectedOrder(updatedOrder);
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setShowCancelModal(false);
    } catch(err) {
      console.error(err);
      showToast("Failed to cancel order", "error");
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleUpdateProfile = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    try {
      const updates: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone,
        email,
      };
      if (newPassword) updates.password = newPassword;

      const { error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      const updatedUser = {
        ...user,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        phone,
        email,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      showToast("Profile updated successfully", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile", "error");
    }
  };

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingImage(true);
      try {
        const url = await uploadToCpanel(e.target.files[0], 'vendors');
        const { error } = await supabase
          .from("customers")
          .update({ image_url: url })
          .eq("id", user.id);

        // Even if DB update fails (due to missing column), update local session so UI works
        if (error && !error.message.includes("image_url")) {
          throw error;
        }

        const updatedUser = { ...user, image_url: url };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        showToast("Profile image updated successfully", "success");
      } catch (err) {
        console.error("Image upload err:", err);
        showToast(
          "Failed to upload image. Make sure admin_schema.sql is applied.",
          "error",
        );
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const getItems = (itemsData: any) => {
    if (!itemsData) return [];
    if (typeof itemsData === "string") {
      try {
        return JSON.parse(itemsData);
      } catch (e) {
        return [];
      }
    }
    if (Array.isArray(itemsData)) return itemsData;
    return [];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedVendor) return;

    setSendingMessage(true);
    try {
      const isToAdmin = selectedVendor.id === "admin";
      const { error } = await supabase.from("support_messages").insert([
        {
          customer_name:
            user.name ||
            (user.first_name
              ? `${user.first_name} ${user.last_name}`
              : "Customer"),
          customer_phone: user.phone || "N/A",
          seller_id: isToAdmin ? null : selectedVendor.id,
          message: chatInput,
        },
      ]);

      if (error) throw error;

      setChatInput("");
      fetchMessages(user.phone || "N/A");
    } catch (err) {
      console.error(err);
      showToast("Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTicketAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (ticketAttachments.length + files.length > 3) {
        showToast("Maximum 3 images allowed", "error");
        return;
      }
      const validFiles = files.filter((f: File) => {
        if (f.size > 500 * 1024) {
          showToast(`File ${f.name} is too large (max 500KB)`, "error");
          return false;
        }
        return true;
      });
      setTicketAttachments((prev) => [...prev, ...validFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setTicketAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDescription) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setSubmittingTicket(true);
    try {
      // Upload images first
      const attachmentUrls = [];
      for (const file of ticketAttachments) {
        const url = await uploadToCpanel(file, 'vendors');
        attachmentUrls.push(url);
      }

      // Insert ticket
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert([
          {
            customer_id: user.id,
            subject: ticketSubject,
            type: ticketType,
            priority: ticketPriority,
            description: ticketDescription,
            attachments: attachmentUrls,
            seller_id: null, // Assuming it goes to admin by default unless a seller is selected. We'll default to null for now.
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Send Notification to Admin
      await supabase.from("notifications").insert([
        {
          target_role: "admin",
          title: "New Support Ticket",
          message: `Customer ${user.name} submitted a new ticket: ${ticketSubject}`,
          link: "/admin/messages",
        },
      ]);

      showToast("Support ticket submitted successfully", "success");
      setShowTicketModal(false);
      setTicketSubject("");
      setTicketDescription("");
      setTicketAttachments([]);
      setTicketType("Website problem");
      setTicketPriority("Low");
      fetchTickets(user.id);
    } catch (err) {
      console.error(err);
      showToast("Failed to submit support ticket", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "Closed" })
        .eq("id", ticketId);

      if (error) throw error;

      const ticketObj = tickets.find(t => t.id === ticketId);
      if (ticketObj) {
        // Delete notifications related to this ticket
        await supabase
          .from('notifications')
          .delete()
          .like('message', `%${ticketObj.subject}%`);
      }

      showToast("Ticket closed successfully", "success");
      if (user?.id) {
        fetchTickets(user.id);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to close ticket", "error");
    }
  };

  const handleCustomerReply = async (ticket: any) => {
    if (!customerReplyText.trim()) return;
    try {
      const formattedReply = ticket.reply 
        ? `${ticket.reply}\n\nCustomer: ${customerReplyText.trim()}`
        : `Customer: ${customerReplyText.trim()}`;

      const { error } = await supabase
        .from("support_tickets")
        .update({ reply: formattedReply })
        .eq("id", ticket.id);

      if (error) throw error;

      // Send Notification to Admin
      await supabase.from("notifications").insert([
        {
          target_role: "admin",
          title: "Customer Replied to Ticket",
          message: `Customer replied to ticket: "${ticket.subject}"`,
          link: "/admin/support-tickets",
        },
      ]);

      showToast("Reply sent successfully", "success");
      setReplyingTicketId(null);
      setCustomerReplyText("");
      if (user?.id) {
        fetchTickets(user.id);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to send reply", "error");
    }
  };

  if (!user) return null;

  // Group messages by vendor
  const vendorChats = messages.reduce(
    (acc, msg) => {
      const v = msg.sellers || {
        id: "admin",
        shop_name: "Admin",
        shop_logo_url: "",
      };
      if (!acc[v.id]) {
        acc[v.id] = { vendor: v, messages: [] };
      }
      acc[v.id].messages.push(msg);
      return acc;
    },
    {} as Record<string, { vendor: any; messages: any[] }>,
  );

  const chatList = Object.values(vendorChats).sort((a, b) => {
    const aLastMsg = a.messages[a.messages.length - 1];
    const bLastMsg = b.messages[b.messages.length - 1];
    const aTime = aLastMsg ? new Date(aLastMsg.created_at).getTime() : 0;
    const bTime = bLastMsg ? new Date(bLastMsg.created_at).getTime() : 0;
    return bTime - aTime;
  });

  const filteredChatList = chatSearchQuery.trim()
    ? chatList.filter((chat: any) => {
        const name = chat.vendor.shop_name?.toLowerCase() ?? "";
        const lastMsg = chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1].message?.toLowerCase() ?? ""
          : "";
        const q = chatSearchQuery.toLowerCase();
        return name.includes(q) || lastMsg.includes(q);
      })
    : chatList;

  const selectedChat = selectedVendor
    ? vendorChats[selectedVendor.id]?.messages || []
    : [];

  const menuItems = [
    { id: "profile", icon: User, label: "Profile Info" },
    { id: "orders", icon: Package, label: "My Order" },
    { id: "wishlist", icon: Heart, label: "Wish List" },
    { id: "loyalty", icon: Gift, label: "My Loyalty Point" },
    { id: "inbox", icon: MessageSquare, label: "Inbox" },
    { id: "address", icon: MapPin, label: "Address" },
    { id: "support", icon: LifeBuoy, label: "Support Ticket" },
    { id: "coupons", icon: Tag, label: "Coupons" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fa] py-8 px-4 font-sans flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Menu */}
        <div className="hidden md:block w-64 bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden shrink-0">
          <div className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/my-account?tab=${item.id}`)}
                  className={`w-full text-left px-5 py-3 text-sm font-medium flex items-center gap-3 transition border-l-4 ${
                    isActive
                      ? "border-[#ff8c00] bg-brand-50/50 text-[#ff8c00]"
                      : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] ${isActive ? "text-[#ff8c00]" : "text-slate-400"}`}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full bg-transparent">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">
                  Profile Info
                </h3>
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="text-slate-400 hover:text-[#ff8c00] transition duration-200"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center mb-8 relative">
                <div className="relative">
                  <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border-4 border-white shadow-sm">
                    {uploadingImage ? (
                      <span className="text-xs">Uploading...</span>
                    ) : user.image_url ? (
                      <img
                        src={user.image_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#ff8c00] text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-brand-600 transition shadow-sm cursor-pointer">
                    <span className="text-xs font-bold leading-none mb-0.5">
                      📷
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                <h2 className="text-lg font-bold text-slate-800 mt-4">
                  {user.name ||
                    `${user.first_name || ""} ${user.last_name || ""}`.trim()}
                </h2>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Phone Number{" "}
                      <span className="text-[10px] text-brand-500 font-normal">
                        (* Country Code Is Must Like For BD 880)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#f8faff] border border-blue-100 rounded-full text-sm focus:outline-none focus:border-blue-300 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#f8faff] border border-blue-100 rounded-full text-sm focus:outline-none focus:border-blue-300 transition"
                        placeholder="••••••••"
                      />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <span className="text-[10px]">👁</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                        placeholder="Minimum 8 characters long"
                      />
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <span className="text-[10px]">👁</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateProfile}
                    className="px-8 py-2.5 bg-[#ff8c00] hover:bg-[#e67e00] text-white rounded text-sm font-bold transition shadow-sm"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-h-[500px]">
              {selectedOrder ? (
                // Order Details View
                <div className="flex flex-col">
                  {/* Order Details Header */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <button
                          onClick={() => {
                            setSelectedOrder(null);
                            setOrderTab("summary");
                          }}
                          className="text-slate-400 hover:text-slate-600 transition"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800">
                          Order #{String(selectedOrder.id).toUpperCase()}
                        </h2>
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-md capitalize ${
                            selectedOrder.status === "pending"
                              ? "bg-blue-100 text-blue-600"
                              : selectedOrder.status === "confirmed"
                                ? "bg-[#e5f5e5] text-[#28a745]"
                                : selectedOrder.status === "cancelled"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 ml-8">
                        {new Date(selectedOrder.created_at)
                          .toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                          .replace(",", "")}
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="text-slate-400 hover:text-slate-600 transition p-2 no-print"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="flex border-b border-slate-100 px-6 no-print">
                    {["summary", "vendor", "reviews", "track"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setOrderTab(tab as any)}
                        className={`py-4 px-4 text-sm font-bold border-b-2 transition ${
                          orderTab === tab
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {tab === "summary" && "Order summary"}
                        {tab === "vendor" && "Seller info"}
                        {tab === "reviews" && "Reviews"}
                        {tab === "track" && "Track Order"}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {orderTab === "summary" && (
                      <div className="grid grid-cols-1 gap-6">
                        {/* Address & Payment Info */}
                        <div className="grid grid-cols-3 gap-6 bg-[#fcfcfc] p-6 rounded-lg border border-slate-100">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-4">
                              Payment Info
                            </h4>
                            <div className="text-xs text-slate-600 mb-2 flex items-center gap-2">
                              <span className="w-24">Payment Status</span>{" "}
                              <span className="font-bold text-red-500">
                                : {selectedOrder.payment_status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 flex items-center gap-2">
                              <span className="w-24">Payment Method</span>{" "}
                              <span className="font-bold text-brand-500">
                                :{" "}
                                {selectedOrder.payment_method === "cash"
                                  ? "Cash On Delivery"
                                  : selectedOrder.payment_method}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-4">
                              Shipping Address :
                            </h4>
                            <div className="text-xs text-slate-600 space-y-1.5">
                              <div className="flex items-start gap-2">
                                <span className="w-12 shrink-0">Name</span> :{" "}
                                {user?.name ||
                                  `${user?.first_name} ${user?.last_name}`}
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-12 shrink-0">Phone</span> :{" "}
                                {user?.phone || "N/A"}
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-12 shrink-0">Address</span> :
                                Dhaka, Bangladesh
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-4">
                              Billing Address :
                            </h4>
                            <div className="text-xs text-slate-600 space-y-1.5">
                              <div className="flex items-start gap-2">
                                <span className="w-12 shrink-0">Name</span> :{" "}
                                {user?.name ||
                                  `${user?.first_name} ${user?.last_name}`}
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-12 shrink-0">Phone</span> :{" "}
                                {user?.phone || "N/A"}
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-12 shrink-0">Address</span> :
                                Dhaka, Bangladesh
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Details Table */}
                        <div className="border border-slate-100 rounded-lg overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-[#f8faff] text-sm font-bold text-slate-700">
                              <tr>
                                <th className="py-4 px-6">Order Details</th>
                                <th className="py-4 px-6 text-center">Qty</th>
                                <th className="py-4 px-6 text-right">Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {getItems(selectedOrder.items).length > 0 ? (
                                getItems(selectedOrder.items).map(
                                  (item: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                          <div className="w-16 h-16 rounded bg-slate-100 overflow-hidden shrink-0">
                                            {item.image ? (
                                              <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <Package className="w-8 h-8 m-4 text-slate-300" />
                                            )}
                                          </div>
                                          <div className="text-sm font-medium text-slate-800">
                                            {item.name || "Product Name"}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-6 text-center text-sm font-bold text-slate-800">
                                        {item.quantity || 1}
                                      </td>
                                      <td className="py-4 px-6 text-right text-sm font-bold text-slate-800">
                                        ৳
                                        {(
                                          item.price * (item.quantity || 1)
                                        ).toFixed(2)}
                                      </td>
                                    </tr>
                                  ),
                                )
                              ) : (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="py-8 text-center text-slate-500"
                                  >
                                    No items found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                          <div className="w-80 border border-slate-100 rounded-lg p-6 bg-[#fcfcfc]">
                            <div className="space-y-3 text-sm text-slate-600 mb-4">
                              <div className="flex justify-between">
                                <span>Item</span>{" "}
                                <span className="font-bold text-slate-800">
                                  {getItems(selectedOrder.items).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Subtotal</span>{" "}
                                <span className="font-bold text-slate-800">
                                  ৳{(Number(selectedOrder.total_amount) + (selectedOrder.coupon_discount || 0) - (selectedOrder.shipping_cost || 0)).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tax fee</span>{" "}
                                <span className="font-bold text-slate-800">
                                  ৳0.00
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Shipping Fee</span>{" "}
                                <span className="font-bold text-slate-800">
                                  ৳{(selectedOrder.shipping_cost || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Discount on product</span>{" "}
                                <span className="font-bold text-slate-800">
                                  - ৳0.00
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Coupon discount</span>{" "}
                                <span className="font-bold text-slate-800">
                                  - ৳{(selectedOrder.coupon_discount || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-slate-200 pt-4 flex justify-between items-center mb-6">
                              <span className="font-bold text-slate-800">
                                Total
                              </span>
                              <span className="text-lg font-black text-slate-900">
                                ৳{selectedOrder.total_amount}
                              </span>
                            </div>
                            {selectedOrder.status === 'pending' && (
                              <button onClick={() => setShowCancelModal(true)} className="w-full text-center text-red-500 font-medium text-sm hover:underline no-print">
                                Cancel order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {orderTab === "vendor" && (
                      <div className="border border-slate-100 rounded-lg p-6">
                        <div className="flex items-center gap-4">
                          <Link
                            to={`/store/${(
                              selectedOrder.sellers?.shop_name || "HolidayMart"
                            )
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)+/g, "")}`}
                            className="w-20 h-20 rounded bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-2 hover:opacity-80 transition cursor-pointer"
                          >
                            {selectedOrder.sellers?.shop_logo_url ? (
                              <img
                                src={selectedOrder.sellers.shop_logo_url}
                                alt={selectedOrder.sellers.shop_name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-center font-bold text-brand-500 text-xl leading-none">
                                =com
                                <br />
                                Matrix
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link
                              to={`/store/${(
                                selectedOrder.sellers?.shop_name || "HolidayMart"
                              )
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/(^-|-$)+/g, "")}`}
                              className="hover:text-blue-600 transition cursor-pointer"
                            >
                              <h3 className="text-lg font-bold text-slate-800 mb-1">
                                {selectedOrder.sellers?.shop_name ||
                                  "HolidayMart"}
                              </h3>
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {orderTab === "reviews" && (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="flex items-center justify-center mb-4 text-slate-300">
                          <Star className="w-10 h-10 fill-current -mr-3 z-0 relative top-2" />
                          <Star className="w-14 h-14 fill-current z-10 relative" />
                          <Star className="w-10 h-10 fill-current -ml-3 z-0 relative top-2" />
                        </div>
                        <p className="font-bold text-slate-500">
                          No Review Found!
                        </p>
                      </div>
                    )}

                    {orderTab === "track" &&
                      (() => {
                        const statusMap: Record<string, number> = {
                          pending: 1,
                          confirmed: 2,
                          packaging: 3,
                          out_for_delivery: 4,
                          delivered: 5,
                        };
                        const currentIndex =
                          statusMap[selectedOrder.status] || 1;

                        const steps = [
                          {
                            label: "Order Placed",
                            date: `${new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}, ${new Date(selectedOrder.created_at).toLocaleDateString()}`,
                            icon: ClipboardList,
                            completed: currentIndex >= 1,
                          },
                          {
                            label: "Order Confirmed",
                            date: "",
                            icon: CheckCircle,
                            completed: currentIndex >= 2,
                          },
                          {
                            label: "Preparing Shipment",
                            date: "",
                            icon: Package,
                            completed: currentIndex >= 3,
                          },
                          {
                            label: "Order is on the way",
                            date: "",
                            icon: Truck,
                            completed: currentIndex >= 4,
                            extraInfo: "Your Deliveryman Is Coming",
                          },
                          {
                            label: "Order Shipped",
                            date: "",
                            icon: CheckCircle,
                            completed: currentIndex >= 5,
                          },
                        ];

                        return (
                          <div className="py-12 px-8">
                            <div className="relative flex items-start justify-between mb-8 mt-4">
                              {/* Progress Line Background */}
                              <div className="absolute top-6 left-12 right-12 h-0.5 bg-slate-200 -z-10 border-t border-dashed border-slate-300"></div>

                              {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                  <div
                                    key={index}
                                    className={`flex flex-col items-center gap-3 w-1/5 ${!step.completed ? "opacity-40 grayscale" : ""}`}
                                  >
                                    <div
                                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.completed ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-blue-600 shadow-sm"}`}
                                    >
                                      <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                      <h4 className="text-sm font-bold text-slate-800">
                                        {step.label}
                                      </h4>
                                      {step.date && (
                                        <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-1">
                                          <Clock className="w-3 h-3" />
                                          {step.date}
                                        </p>
                                      )}
                                      {step.extraInfo && (
                                        <p className="text-[10px] text-slate-500 mt-1">
                                          {step.extraInfo}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              ) : (
                // Order List View
                <div className="p-6 bg-[#f8faff] min-h-[500px]">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 md:hidden">
                    <h3 className="text-xl font-bold text-slate-800">My Orders</h3>
                    <button 
                      onClick={() => setIsMenuOpen(true)}
                      className="text-slate-400 hover:text-[#ff8c00] transition duration-200"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-4 min-w-[600px]">
                      <thead className="bg-transparent text-sm font-bold text-slate-700">
                        <tr>
                          <th className="px-6 pb-2">Order List</th>
                          <th className="px-6 pb-2">Status</th>
                          <th className="px-6 pb-2">Total</th>
                          <th className="px-6 pb-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingOrders ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-12 text-center text-slate-500"
                            >
                              Loading orders...
                            </td>
                          </tr>
                        ) : orders.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100"
                            >
                              No orders found.
                            </td>
                          </tr>
                        ) : (
                          orders.map((order) => (
                            <tr
                              key={order.id}
                              className="bg-white hover:bg-slate-50 transition border border-slate-100 shadow-sm outline outline-1 outline-slate-100 rounded-xl relative"
                            >
                              <td className="py-4 px-6 rounded-l-xl first:rounded-l-xl last:rounded-r-xl border-l border-t border-b border-transparent">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">
                                    {order.sellers?.shop_logo_url ? (
                                      <img
                                        src={order.sellers.shop_logo_url}
                                        alt={order.sellers.shop_name}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="text-center font-bold text-brand-500 text-xs leading-none">
                                        =com
                                        <br />
                                        Matrix
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-slate-800 text-sm">
                                      ID: {String(order.id).toUpperCase()}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                      {getItems(order.items).length} Items
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {new Date(order.created_at)
                                        .toLocaleString("en-GB", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                        .replace(",", "")}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 border-t border-b border-transparent">
                                <span
                                  className={`px-3 py-1 text-[11px] font-bold rounded-full capitalize ${
                                    order.status === "pending"
                                      ? "bg-blue-100 text-blue-600"
                                      : order.status === "confirmed"
                                        ? "bg-[#e5f5e5] text-[#28a745]"
                                        : order.status === "cancelled"
                                          ? "bg-red-100 text-red-600"
                                          : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm font-bold text-slate-800 border-t border-b border-transparent">
                                ৳{order.total_amount}
                              </td>
                              <td className="py-4 px-6 rounded-r-xl first:rounded-l-xl last:rounded-r-xl border-r border-t border-b border-transparent">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setOrderTab("summary");
                                    }}
                                    className="w-8 h-8 rounded-full border border-brand-200 text-brand-500 hover:bg-brand-50 flex items-center justify-center transition"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setTimeout(() => window.print(), 100);
                                    }}
                                    className="w-8 h-8 rounded-full border border-green-200 text-green-500 hover:bg-green-50 flex items-center justify-center transition no-print"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inbox Tab */}
          {activeTab === "inbox" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">

              {/* ===== MOBILE LAYOUT ===== */}
              <div className="flex flex-col md:hidden" style={{ height: '100dvh', maxHeight: '70vh' }}>
                {/* Mobile: Show Vendor List when no vendor selected */}
                {!selectedVendor ? (
                  <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
                      <h3 className="text-base font-bold text-slate-800">Inbox</h3>
                      <button
                        onClick={() => setIsMenuOpen(true)}
                        className="text-slate-400 hover:text-[#ff8c00] transition duration-200"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Vendor Tab Header */}
                    <div className="border-b border-slate-100 text-sm font-bold text-slate-700 shrink-0">
                      <div className="flex-1 py-2.5 border-b-2 border-[#ff8c00] text-[#ff8c00] text-center bg-slate-50/50">
                        Vendor
                      </div>
                    </div>
                    {/* Search */}
                    <div className="p-3 shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          value={chatSearchQuery}
                          onChange={(e) => setChatSearchQuery(e.target.value)}
                          placeholder="Search vendors..."
                          className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs focus:outline-none focus:border-blue-200"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    {/* Vendor List */}
                    <div className="flex-1 overflow-y-auto">
                      {filteredChatList.length === 0 && (
                        <p className="text-center text-xs text-slate-400 mt-6">No results found</p>
                      )}
                      {filteredChatList.map((chat: any) => (
                        <div
                          key={chat.vendor.id}
                          onClick={() => setSelectedVendor(chat.vendor)}
                          className="flex items-center gap-3 p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {chat.vendor.shop_logo_url ? (
                              <img src={chat.vendor.shop_logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 m-2 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className="text-[13px] font-bold text-slate-800 truncate">{chat.vendor.shop_name}</h4>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                {chat.messages.length > 0 && new Date(chat.messages[chat.messages.length - 1].created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].message : "Hello"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Mobile: Show Chat Area when vendor is selected */
                  <div className="flex flex-col h-full">
                    {/* Chat Header with back button */}
                    <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedVendor(null)}
                        className="text-slate-400 hover:text-[#ff8c00] transition p-1"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        {selectedVendor.shop_logo_url ? (
                          <img src={selectedVendor.shop_logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 m-1.5 text-slate-400" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 flex-1">{selectedVendor.shop_name}</h3>
                      <button
                        onClick={() => setIsMenuOpen(true)}
                        className="text-slate-400 hover:text-[#ff8c00] transition duration-200"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Messages */}
                    <div
                      ref={chatMessagesRef}
                      className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#fafbfc]"
                    >
                      {selectedChat.map((msg: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-3">
                          <div className="flex justify-end">
                            <div className="max-w-[80%] flex flex-col items-end">
                              <div className="bg-[#ff8c00] text-white px-3 py-2 rounded-2xl rounded-tr-sm text-[13px] shadow-sm mb-1">{msg.message}</div>
                              <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          </div>
                          {msg.reply && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] flex flex-col items-start">
                                <div className="bg-white text-slate-700 px-3 py-2 rounded-2xl rounded-tl-sm text-[13px] border border-slate-100 shadow-sm mb-1">{msg.reply}</div>
                                <span className="text-[10px] text-slate-400">Vendor Reply</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Chat Input */}
                    <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Write your message here..."
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-[13px] focus:outline-none focus:border-blue-300 transition"
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !chatInput.trim()}
                          className="w-10 h-10 bg-[#4285F4] hover:bg-blue-600 disabled:bg-blue-300 text-white flex items-center justify-center rounded-full transition shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* ===== DESKTOP LAYOUT (unchanged) ===== */}
              <div className="hidden md:flex flex-row h-[600px]">
                {/* Left Chat List */}
                <div className="w-1/3 border-r border-slate-100 flex flex-col bg-white">
                  <div className="flex border-b border-slate-100 text-sm font-bold text-slate-700">
                    <div className="flex-1 py-3 border-b-2 border-[#ff8c00] text-[#ff8c00] text-center bg-slate-50/50">
                      Vendor
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        placeholder="Search vendors..."
                        className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs focus:outline-none focus:border-blue-200"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredChatList.length === 0 && (
                      <p className="text-center text-xs text-slate-400 mt-6">No results found</p>
                    )}
                    {filteredChatList.map((chat: any) => (
                      <div
                        key={chat.vendor.id}
                        onClick={() => setSelectedVendor(chat.vendor)}
                        className={`flex items-center gap-3 p-4 border-b border-slate-50 cursor-pointer transition ${selectedVendor?.id === chat.vendor.id ? "bg-brand-50/30" : "hover:bg-slate-50"}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {chat.vendor.shop_logo_url ? (
                            <img src={chat.vendor.shop_logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 m-2 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="text-[13px] font-bold text-slate-800 truncate">{chat.vendor.shop_name}</h4>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                              {chat.messages.length > 0 && new Date(chat.messages[chat.messages.length - 1].created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].message : "Hello"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Chat Area */}
                <div className="flex-1 flex flex-col bg-[#fafbfc]">
                  {selectedVendor ? (
                    <>
                      {/* Chat Header */}
                      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {selectedVendor.shop_logo_url ? (
                            <img src={selectedVendor.shop_logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 m-1.5 text-slate-400" />
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {selectedVendor.shop_name}
                        </h3>
                      </div>

                      {/* Chat Messages */}
                      <div
                        ref={chatMessagesRef}
                        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
                      >
                        {selectedChat.map((msg: any, idx: number) => (
                          <div key={idx} className="flex flex-col gap-4">
                            {/* Customer Message (Right) */}
                            <div className="flex justify-end">
                              <div className="max-w-[75%] flex flex-col items-end">
                                <div className="bg-[#ff8c00] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-[13px] shadow-sm mb-1">
                                  {msg.message}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>

                            {/* Vendor Reply (Left) */}
                            {msg.reply && (
                              <div className="flex justify-start">
                                <div className="max-w-[75%] flex flex-col items-start">
                                  <div className="bg-white text-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-sm text-[13px] border border-slate-100 shadow-sm mb-1">
                                    {msg.reply}
                                  </div>
                                  <span className="text-[10px] text-slate-400">Vendor Reply</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3 relative">
                          <div className="absolute left-3 text-slate-400">
                            <span className="text-lg leading-none">🖼️</span>
                          </div>
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Write your message here..."
                            className="flex-1 pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-300 transition"
                          />
                          <button
                            type="submit"
                            disabled={sendingMessage || !chatInput.trim()}
                            className="absolute right-2 w-8 h-8 bg-[#4285F4] hover:bg-blue-600 disabled:bg-blue-300 text-white flex items-center justify-center rounded transition"
                          >
                            <Send className="w-4 h-4 -ml-0.5" />
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                      <p className="text-sm font-medium">Select a conversation to start chatting</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Support Ticket Tab */}
          {activeTab === "support" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800">
                    Support Ticket
                  </h3>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="text-slate-400 hover:text-[#ff8c00] transition duration-200 md:hidden"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="px-4 py-2 bg-[#ff8c00] hover:bg-[#e67e00] text-white rounded text-sm font-bold transition shadow-sm"
                >
                  Add new ticket
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                {tickets.length === 0 ? (
                  <>
                    <LifeBuoy className="w-16 h-16 mb-4 opacity-30" />
                    <p className="font-medium text-sm">
                      No support tickets found
                    </p>
                  </>
                ) : (
                  <div className="w-full text-left space-y-4 text-slate-700">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-slate-50 border border-slate-200 rounded p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm">
                            {ticket.subject}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${ticket.status === "Open" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}
                          >
                            {ticket.status || "Open"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          Type: {ticket.type} | Priority: {ticket.priority} |
                          Date:{" "}
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[13px] bg-white p-3 border border-slate-100 rounded mb-2">
                          {ticket.description}
                        </div>
                        {ticket.reply && (
                          <div className="text-[13px] bg-brand-50/50 p-3 border border-brand-100 rounded mt-2 text-slate-800 whitespace-pre-wrap">
                            <span className="font-bold text-brand-600 block mb-1">
                              Reply:
                            </span>
                            {ticket.reply}
                          </div>
                        )}
                        {ticket.status !== "Closed" && replyingTicketId === ticket.id && (
                          <div className="mt-3 bg-white p-3 border border-slate-200 rounded">
                            <textarea
                              value={customerReplyText}
                              onChange={(e) => setCustomerReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-brand-500 mb-2"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setReplyingTicketId(null);
                                  setCustomerReplyText("");
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleCustomerReply(ticket)}
                                className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-semibold transition"
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        )}
                        {ticket.status !== "Closed" && (
                          <div className="mt-3 flex justify-end gap-2">
                            {ticket.reply && replyingTicketId !== ticket.id && (
                              <button
                                onClick={() => {
                                  setReplyingTicketId(ticket.id);
                                  setCustomerReplyText("");
                                }}
                                className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 rounded text-xs font-semibold transition shadow-sm"
                              >
                                Reply
                              </button>
                            )}
                            <button
                              onClick={() => handleCloseTicket(ticket.id)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-xs font-semibold transition shadow-sm"
                            >
                              Close Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === "wishlist" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-h-[500px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Wishlist</h3>
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="text-slate-400 hover:text-[#ff8c00] transition duration-200 md:hidden"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <ClipboardList className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-bold text-slate-700 text-lg">
                      No Product Found In Wishlist!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlist.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-lg shadow-sm hover:shadow transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {item.discountBadge && (
                              <span className="absolute -top-2 -left-2 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                                {item.discountBadge}
                              </span>
                            )}
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded border border-slate-200"
                            />
                          </div>
                          <div>
                            <h4
                              className="font-bold text-sm text-slate-800 hover:text-brand-500 cursor-pointer"
                              onClick={() =>
                                navigate(`/product/${item.slug || item.id}`)
                              }
                            >
                              {item.title}
                            </h4>
                            {item.brand && (
                              <p className="text-xs text-slate-500 mt-1">
                                Brand :{" "}
                                <span className="text-brand-500 font-medium">
                                  {item.brand}
                                </span>
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-slate-800">
                                ৳{Number(item.price).toLocaleString()}
                              </span>
                              {item.oldPrice && (
                                <span className="text-xs text-slate-400 line-through">
                                  ৳{Number(item.oldPrice).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveWishlist(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "loyalty" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-800">My Loyalty Points</h2>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="text-slate-400 hover:text-[#ff8c00] transition duration-200 md:hidden"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-brand-50 text-brand-600 px-4 py-2 rounded-full font-black text-lg shadow-sm border border-brand-100">
                  {loyaltyBalance} Points
                </div>
              </div>
              <div className="space-y-4">
                {loyaltyPoints.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>You haven't earned any loyalty points yet.</p>
                  </div>
                ) : (
                  loyaltyPoints.map((pt, idx) => {
                    const isExpired = new Date(pt.expires_at) <= new Date() && pt.remaining_points > 0;
                    return (
                      <div key={idx} className={`p-4 rounded-lg border ${isExpired ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'} shadow-sm flex justify-between items-center`}>
                        <div>
                          <div className="font-bold text-slate-800 mb-1">Earned on Order #{pt.order_id?.toUpperCase()}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(pt.created_at).toLocaleDateString()}
                            {isExpired ? ' (Expired)' : ` • Expires: ${new Date(pt.expires_at).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-lg text-brand-500">+{pt.points_earned}</div>
                          {pt.remaining_points !== pt.points_earned && !isExpired && (
                            <div className="text-xs font-semibold text-slate-500">Remaining: {pt.remaining_points}</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "coupons" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Coupons</h2>
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="text-slate-400 hover:text-[#ff8c00] transition duration-200 md:hidden"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coupons.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-slate-500">
                    <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No coupons available right now.</p>
                  </div>
                ) : (
                  coupons.map((coupon, idx) => (
                    <div key={idx} className="flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
                      {/* Left section - White */}
                      <div className="p-5 flex-1 relative bg-white flex flex-col justify-between">
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-2">{coupon.title}</h3>
                          <div className="inline-block bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded tracking-widest font-mono text-sm mb-4 font-bold shadow-inner">
                            {coupon.code}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500">Min Purchase</span>
                            <span className="font-bold text-slate-800">৳{coupon.min_purchase}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500">Valid From</span>
                            <span className="font-bold text-slate-800">{new Date(coupon.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-500">Valid Until</span>
                            <span className="font-bold text-red-600">{new Date(coupon.expire_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 items-center">
                            {coupon.shop_id && coupon.sellers ? (
                              <>
                                <span className="text-slate-500">Valid for Shop</span>
                                <Link to={`/shop/${coupon.shop_id}`} className="w-8 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden hover:opacity-80 transition flex items-center justify-center">
                                  {coupon.sellers.shop_logo_url ? <img src={coupon.sellers.shop_logo_url} className="w-full h-full object-cover" /> : <span className="font-bold text-slate-400 text-xs">{coupon.sellers.shop_name?.charAt(0)}</span>}
                                </Link>
                              </>
                            ) : (
                              <span className="font-bold text-slate-600 w-full text-center bg-slate-50 py-1 rounded">Valid for: All Store</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Dotted border overlay on blue part */}
                      <div className="absolute right-[128px] top-0 bottom-0 w-0 border-r-2 border-dashed border-white/40 z-20"></div>
                      
                      {/* Right section - Blue */}
                      <div className="w-32 bg-[#0052a5] flex flex-col items-center justify-center relative text-white shadow-inner">
                        {/* Circle cutouts */}
                        <div className="w-8 h-8 bg-[#f4f7fa] rounded-full absolute -left-4 top-1/2 -translate-y-1/2 shadow-inner border-r border-slate-200/50"></div>
                        <div className="text-center px-2 relative z-10">
                          <div className="text-3xl font-black leading-none tracking-tight mb-1">
                            {coupon.discount_type === 'Percentage' ? `${coupon.discount_amount}%` : `৳${coupon.discount_amount}`}
                          </div>
                          <div className="text-sm font-bold opacity-90 uppercase tracking-widest">OFF</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Addresses</h2>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="text-slate-400 hover:text-[#ff8c00] transition duration-200 md:hidden"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded shadow-sm text-sm transition flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="font-bold text-slate-700">No Address Found!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group hover:border-brand-300 transition">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="inline-block px-2.5 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded mb-2">
                        {addr.address_type}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">{addr.contact_person_name}</h4>
                      <p className="text-slate-600 text-xs mt-1">{addr.phone}</p>
                      <p className="text-slate-500 text-xs mt-2 line-clamp-2">
                        {addr.address}, {addr.city}, {addr.state}, {addr.zip_code}, {addr.country}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placeholders for other tabs */}
          {activeTab !== "profile" &&
            activeTab !== "orders" &&
            activeTab !== "inbox" &&
            activeTab !== "support" &&
            activeTab !== "wishlist" &&
            activeTab !== "loyalty" &&
            activeTab !== "address" &&
            activeTab !== "coupons" && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 min-h-[500px] flex flex-col items-center justify-center text-slate-400 mt-6">
                <Package className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-medium text-lg capitalize">
                  {activeTab.replace("-", " ")} coming soon
                </p>
              </div>
            )}
        </div>
      </div>

      {/* Support Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">
                Submit new ticket
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                You will get response.
              </p>
            </div>
            <form onSubmit={handleSubmitTicket} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option>Website problem</option>
                    <option>Partner request</option>
                    <option>Complaint</option>
                    <option>Info inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Describe your issue
                </label>
                <textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  rows={5}
                  required
                ></textarea>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Attachment
                </label>
                <div className="flex flex-wrap gap-3">
                  {ticketAttachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 border border-slate-200 rounded overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {ticketAttachments.length < 3 && (
                    <label className="w-16 h-16 border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center rounded cursor-pointer hover:bg-slate-100 transition">
                      <span className="text-slate-400 text-xl">🖼️</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                        onChange={handleTicketAttachment}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Max 3 images, 500KB each
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-6 py-2 bg-[#ff8c00] hover:bg-[#e67e00] text-white rounded text-sm font-bold transition shadow-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-6 py-2 bg-[#ff8c00] hover:bg-[#e67e00] text-white rounded text-sm font-bold transition shadow-sm disabled:opacity-50"
                >
                  {submittingTicket ? "Submitting..." : "Submit a ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #customer-invoice-print, #customer-invoice-print * { visibility: visible !important; }
          #customer-invoice-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 20px;}
          .no-print { display: none !important; }
        }
      `}</style>

      {selectedOrder && (
        <div
          id="customer-invoice-print"
          className="hidden print:block w-full max-w-[800px] mx-auto bg-white font-sans text-slate-800"
        >
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-2xl font-black mb-6">Order Invoice</h1>
              <div className="text-sm font-bold mb-1">
                Invoice #{selectedOrder.id?.toUpperCase()}
              </div>
              <div className="text-sm font-bold">
                Shop Name : {selectedOrder.sellers?.shop_name || "HolidayMart"}
              </div>
            </div>
            <div className="text-right">
              <div className="flex justify-end items-center mb-6">
                <img src="https://ik.imagekit.io/eg7u6xcn0u/HolidayMart-logo-wide.png" alt="HolidayMart" className="h-8" />
              </div>
              <div className="text-sm font-bold">
                Date :{" "}
                {new Date(selectedOrder.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between mb-8 text-sm">
            <div>
              <h3 className="font-bold text-lg mb-2">Shipping To</h3>
              <div className="font-bold">
                {selectedOrder.shipping_address?.name || "Customer"}
              </div>
              <div className="font-bold">
                {selectedOrder.shipping_address?.phone ||
                  selectedOrder.customer_phone}
              </div>
              <div className="font-bold">
                {selectedOrder.shipping_address?.city || ""}
              </div>
              <div className="font-bold">
                {selectedOrder.shipping_address?.address || "N/A"}
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-lg mb-2">Billing Address</h3>
              <div className="font-bold">
                {selectedOrder.billing_address?.name ||
                  selectedOrder.shipping_address?.name ||
                  "Customer"}
              </div>
              <div className="font-bold">
                {selectedOrder.billing_address?.phone ||
                  selectedOrder.shipping_address?.phone ||
                  selectedOrder.customer_phone}
              </div>
              <div className="font-bold">
                {selectedOrder.billing_address?.city ||
                  selectedOrder.shipping_address?.city ||
                  ""}
              </div>
              <div className="font-bold">
                {selectedOrder.billing_address?.address ||
                  selectedOrder.shipping_address?.address ||
                  "N/A"}
              </div>
            </div>
          </div>

          <table className="w-full text-left text-sm mb-8">
            <thead className="bg-[#0070c0] text-white">
              <tr>
                <th className="py-2 px-3">No.</th>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-3 text-center">Unit Price</th>
                <th className="py-2 px-3 text-center">Qty</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(selectedOrder.items) &&
                selectedOrder.items.map((item: any, idx: number) => {
                  const price = item.price || 0;
                  const qty = item.quantity || 1;
                  return (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-3 px-3">{idx + 1}</td>
                      <td className="py-3 px-3 font-medium">{item.name}</td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        ৳{Number(price).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {qty}
                      </td>
                      <td className="py-3 px-3 text-right text-[#0070c0] font-bold">
                        ৳{(Number(price) * qty).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="flex justify-between items-start mb-16 text-sm">
            <div className="space-y-1">
              <div className="font-bold">Payment Details</div>
              <div className="capitalize">
                {selectedOrder.payment_method?.replace(/_/g, " ") ||
                  "cash on delivery"}
              </div>
              <div className="capitalize">
                {selectedOrder.payment_status || "unpaid"}
              </div>
              <div className="font-bold mt-2">Delivery_info</div>
              <div>{selectedOrder.third_party_courier || "Delivery"}</div>
              <div>Tracking Id : {selectedOrder.tracking_id || ""}</div>
            </div>

            <div className="w-64 space-y-3">
              <div className="flex justify-between font-bold">
                <span>Sub Total</span>
                <span>
                  ৳
                  {(
                    selectedOrder.items?.reduce(
                      (acc: number, item: any) =>
                        acc + (item.price || 0) * (item.quantity || 1),
                      0,
                    ) || 0
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Tax</span>
                <span>৳0.00</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Shipping</span>
                <span>৳{(selectedOrder.shipping_cost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Coupon Discount</span>
                <span>- ৳{(selectedOrder.coupon_discount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Discount On Product</span>
                <span>- ৳0.00</span>
              </div>
              <div className="border-t border-slate-200 my-2 border-dashed"></div>
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>৳{(selectedOrder.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 text-center text-sm font-bold rounded">
            <div>📞 Phone : +8801700000000</div>
            <div>✉ Email : company@example.com</div>
            <div>🌐 Website : www.abc.com</div>
            <div className="mt-1 text-slate-500 text-xs font-normal">
              All Copy Right Reserved © 2026 HolidayMart
            </div>
          </div>
        </div>
      )}
      {/* CANCEL ORDER MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn relative border border-slate-100">
            <button 
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 pt-8 text-center">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Are you sure you want to cancel this order?</h3>
              
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={handleCancelOrder}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition shadow-sm"
                >
                  Yes
                </button>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded transition shadow-sm"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-fadeIn relative border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-center sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800">Add New Address</h2>
            </div>
            
            <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-wrap gap-3 mb-6">
                {['Home', 'Office'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressFormData({ ...addressFormData, address_type: type })}
                    className={`px-4 py-2 border rounded font-bold text-sm transition ${
                      addressFormData.address_type === type
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Contact person name *</label>
                  <input
                    type="text"
                    required
                    value={addressFormData.contact_person_name}
                    onChange={(e) => setAddressFormData({ ...addressFormData, contact_person_name: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={addressFormData.phone}
                    onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressFormData.state}
                    onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Zip code *</label>
                  <input
                    type="text"
                    required
                    value={addressFormData.zip_code}
                    onChange={(e) => setAddressFormData({ ...addressFormData, zip_code: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={addressFormData.country}
                    onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-600 mb-1">Address *</label>
                <textarea
                  required
                  rows={3}
                  value={addressFormData.address}
                  onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-brand-500 resize-none"
                ></textarea>
              </div>

              <div className="mb-4">
                <MapComponent 
                  addressText={`${addressFormData.address}, ${addressFormData.city}, ${addressFormData.state}, ${addressFormData.country}`}
                  onLocationSelect={(lat, lng) => setAddressFormData({ ...addressFormData, latitude: lat, longitude: lng })}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded transition shadow-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded transition shadow-sm"
                >
                  Add informations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Right Sidebar Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end no-print md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">Account Menu</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(`/my-account?tab=${item.id}`);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-6 py-4 text-sm font-semibold flex items-center gap-3 transition border-l-4 ${
                      isActive
                        ? "border-[#ff8c00] bg-brand-50/50 text-[#ff8c00]"
                        : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] ${isActive ? "text-[#ff8c00]" : "text-slate-400"}`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
