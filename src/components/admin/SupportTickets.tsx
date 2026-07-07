import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { LifeBuoy, Search, Eye, X } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function SupportTickets() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const session = localStorage.getItem('user');
    if (session) {
      setUser(JSON.parse(session));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    setReplyText('');
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          customers(first_name, last_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (user.role === 'seller') {
        query = query.eq('seller_id', user.id);
      } else {
        // Admin sees all tickets for now, or just admin tickets
        // query = query.is('seller_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const formattedReply = selectedTicket.reply
        ? `${selectedTicket.reply}\n\nAdmin: ${replyText.trim()}`
        : `Admin: ${replyText.trim()}`;

      const { error } = await supabase
        .from('support_tickets')
        .update({ reply: formattedReply })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      
      // Delete notifications related to this ticket
      await supabase
        .from('notifications')
        .delete()
        .like('message', `%${selectedTicket.subject}%`);
      
      showToast('Reply sent successfully', 'success');
      setReplyText('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      showToast('Failed to send reply', 'error');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'Closed' })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      
      // Delete notifications related to this ticket
      await supabase
        .from('notifications')
        .delete()
        .like('message', `%${selectedTicket.subject}%`);
      
      showToast('Ticket closed successfully', 'success');
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      showToast('Failed to close ticket', 'error');
    }
  };

  if (loading) return <div className="p-6">Loading tickets...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-brand-500" />
          Support Tickets
        </h2>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by subject..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 w-64"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No support tickets found</td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-800">{ticket.subject}</td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800">{ticket.customers ? `${ticket.customers.first_name} ${ticket.customers.last_name}`.trim() : 'Unknown'}</div>
                      <div className="text-[11px] text-slate-500">{ticket.customers?.phone || ''}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ticket.type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        ticket.priority === 'Urgent' ? 'bg-red-100 text-red-600' : 
                        ticket.priority === 'High' ? 'bg-brand-100 text-brand-600' :
                        ticket.priority === 'Medium' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${ticket.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {ticket.status || 'Open'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Ticket Details
              </h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Info</h4>
                  <p className="text-sm font-bold text-slate-800">{selectedTicket.customers ? `${selectedTicket.customers.first_name} ${selectedTicket.customers.last_name}`.trim() : ''}</p>
                  <p className="text-sm text-slate-600">{selectedTicket.customers?.email}</p>
                  <p className="text-sm text-slate-600">{selectedTicket.customers?.phone}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Info</h4>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Type:</span> {selectedTicket.type}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Priority:</span> {selectedTicket.priority}</p>
                  <p className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Date:</span> {new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</h4>
                <p className="text-sm font-bold text-slate-800 p-3 bg-slate-50 rounded border border-slate-100">
                  {selectedTicket.subject}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-slate-700 p-4 bg-slate-50 rounded border border-slate-100 whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedTicket.attachments.map((url: string, idx: number) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded border border-slate-200 overflow-hidden hover:opacity-90 transition">
                        <img src={url} alt={`Attachment ${idx}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedTicket.reply ? (
                <div className="mt-6">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Conversation History</h4>
                  <p className="text-sm text-slate-800 p-4 bg-brand-50 rounded border border-brand-100 whitespace-pre-wrap font-medium">
                    {selectedTicket.reply}
                  </p>
                </div>
              ) : selectedTicket.status === 'Closed' ? (
                <div className="mt-6">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Conversation History</h4>
                  <p className="text-sm text-slate-800 p-4 bg-brand-50 rounded border border-brand-100 whitespace-pre-wrap font-medium">
                    No reply was sent.
                  </p>
                </div>
              ) : null}
              {selectedTicket.status !== 'Closed' && (
                <div className="mt-6">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Send New Reply</h4>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full text-sm p-3 border border-slate-200 rounded outline-none focus:border-blue-500 mb-2"
                    placeholder="Type your reply here..."
                    rows={4}
                  ></textarea>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-bold transition"
              >
                Close
              </button>
              {selectedTicket.status !== 'Closed' && (
                <>
                  <button 
                    onClick={handleCloseTicket}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold transition"
                  >
                    Close Ticket
                  </button>
                  <button 
                    onClick={handleReply}
                    className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded text-sm font-bold transition"
                  >
                    Send
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
