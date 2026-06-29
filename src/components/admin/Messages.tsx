import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../ToastContext';
import { MessageSquare, User, Search, Send, Clock } from 'lucide-react';

export default function Messages() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedCustomerPhone]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessages();
      
      // Setup Realtime Subscription
      let filterStr = undefined;
      if (user.role === 'seller') {
        filterStr = `seller_id=eq.${user.id}`;
      } else if (user.role === 'admin') {
        // Admin could see all, but let's say filterStr is undefined to get all
      }
      
      const channel = supabase
        .channel('public:support_messages_vendor')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'support_messages',
            ...(filterStr ? { filter: filterStr } : {})
          },
          (payload) => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('support_messages')
        .select(`
          *,
          sellers(shop_name)
        `)
        .order('created_at', { ascending: true }); // keep ascending for chat layout

      if (user?.role === 'seller') {
        query = query.eq('seller_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMessages(data || []);
      
      // Mark as read for the currently selected customer if we receive new messages
      if (selectedCustomerPhone && data) {
        const unreadMsgs = data.filter(m => m.customer_phone === selectedCustomerPhone && !m.is_read);
        for (const msg of unreadMsgs) {
           await supabase.from('support_messages').update({ is_read: true }).eq('id', msg.id);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by customer
  const groupedMessages = messages.reduce((acc, msg) => {
    const key = msg.customer_phone;
    if (!acc[key]) {
      acc[key] = {
        name: msg.customer_name,
        phone: msg.customer_phone,
        messages: [],
        unread: 0,
        latest: new Date(msg.created_at).getTime()
      };
    }
    acc[key].messages.push(msg);
    if (!msg.is_read && !msg.reply) acc[key].unread += 1;
    acc[key].latest = Math.max(acc[key].latest, new Date(msg.created_at).getTime());
    return acc;
  }, {} as Record<string, any>);

  const customerList = Object.values(groupedMessages).sort((a: any, b: any) => b.latest - a.latest);
  const selectedChat = selectedCustomerPhone ? groupedMessages[selectedCustomerPhone]?.messages || [] : [];
  const selectedCustomerDetails = selectedCustomerPhone ? groupedMessages[selectedCustomerPhone] : null;

  const handleSelectCustomer = async (phone: string) => {
    setSelectedCustomerPhone(phone);
    // Mark all as read
    const customerMsgs = groupedMessages[phone]?.messages || [];
    const unread = customerMsgs.filter((m: any) => !m.is_read);
    for (const msg of unread) {
      await supabase.from('support_messages').update({ is_read: true }).eq('id', msg.id);
    }
    if (unread.length > 0) fetchMessages();
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat.length) return;
    
    setSendingReply(true);
    try {
      // Find the last message to append or set reply
      const lastMsg = selectedChat[selectedChat.length - 1];
      const newReply = lastMsg.reply ? `${lastMsg.reply}\n\n${replyText}` : replyText;

      const { error } = await supabase
        .from('support_messages')
        .update({ 
          reply: newReply,
          is_read: true 
        })
        .eq('id', lastMsg.id);

      if (error) throw error;
      
      setReplyText('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast('Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading messages...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-orange-500" /> Customer Messages
        </h1>
      </div>

      <div className="bg-white flex-1 rounded-lg shadow-sm border border-slate-200 overflow-hidden flex">
        {customerList.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
            <p>No messages found.</p>
          </div>
        ) : (
          <>
            {/* Left Sidebar */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
              <div className="p-4 border-b border-slate-200 bg-white">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search customers..." 
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-md text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {customerList.map((customer: any) => (
                  <div 
                    key={customer.phone}
                    onClick={() => handleSelectCustomer(customer.phone)}
                    className={`p-4 border-b border-slate-200 cursor-pointer transition ${
                      selectedCustomerPhone === customer.phone ? 'bg-orange-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-800 text-sm truncate">{customer.name}</h3>
                          {customer.unread > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {customer.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{customer.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Main Chat */}
            <div className="flex-1 flex flex-col bg-white min-w-0">
              {!selectedCustomerPhone ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50">
                  <p>Select a customer to view messages</p>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-800">{selectedCustomerDetails?.name}</h2>
                        <p className="text-xs text-slate-500">{selectedCustomerDetails?.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/50">
                    {selectedChat.map((msg: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-4">
                        {/* Customer Message (Left) */}
                        <div className="flex justify-start">
                          <div className="max-w-[75%] flex flex-col items-start">
                            <div className="bg-white text-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm text-sm whitespace-pre-wrap">
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Vendor Reply (Right) */}
                        {msg.reply && (
                          <div className="flex justify-end">
                            <div className="max-w-[75%] flex flex-col items-end">
                              <div className="bg-orange-500 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm text-sm whitespace-pre-wrap">
                                {msg.reply}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Replied
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    <form onSubmit={handleReply} className="flex gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply here..."
                          className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:bg-white transition resize-none"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(e);
                            }
                          }}
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!replyText.trim() || sendingReply}
                        className="px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition shrink-0 self-end h-[50px]"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
