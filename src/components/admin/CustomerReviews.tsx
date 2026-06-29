import React, { useState, useEffect } from 'react';
import { Search, Star, MessageSquare } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../ToastContext';

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'seller'>('admin');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchReviews = async () => {
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
        let query = supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            status,
            reply,
            created_at,
            customers ( first_name, last_name ),
            in_house_products ( name_en, thumbnail_url ),
            sellers ( shop_name ),
            review_replies ( id, comment, created_at, likes, dislikes, customer_id, seller_id, customers(first_name, last_name), sellers(name, shop_name, seller_image_url, shop_logo_url) )
          `)
          .order('created_at', { ascending: false });

        if (isSeller) {
          query = query.eq('seller_id', sellerId);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          setReviews(data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleStatusToggle = async (reviewId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Published' ? 'Hidden' : 'Published';
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', reviewId);
        
      if (error) throw error;
      
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
      addToast(`Review marked as ${newStatus}`, 'success');
    } catch (err) {
      console.error('Error updating review status:', err);
      addToast('Failed to update status', 'error');
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    try {
      const storedUser = localStorage.getItem('user');
      let sellerId = null;
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'seller') {
          sellerId = parsed.id;
        }
      }

      const { data, error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          seller_id: sellerId,
          comment: replyText.trim()
        })
        .select(`
          id, comment, created_at, likes, dislikes, customer_id, seller_id, 
          customers(first_name, last_name), 
          sellers(name, shop_name, seller_image_url, shop_logo_url)
        `)
        .single();
        
      if (error) throw error;
      
      setReviews(reviews.map(r => r.id === reviewId ? { 
        ...r, 
        review_replies: [...(r.review_replies || []), data] 
      } : r));
      
      setReplyText('');
      setActiveReplyId(null);
      addToast('Reply added successfully', 'success');
    } catch (err) {
      console.error('Error adding reply:', err);
      addToast('Failed to add reply', 'error');
    }
  };

  const filteredReviews = reviews.filter(r => {
    const productName = r.in_house_products?.name_en?.toLowerCase() || '';
    const customerName = `${r.customers?.first_name} ${r.customers?.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return productName.includes(search) || customerName.includes(search);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Customer Reviews</h1>
        <div className="relative w-72">
          <input
            type="text"
            placeholder="Search by Product or Customer"
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
            <tr className="bg-slate-50 border-b border-slate-200 text-[13px] text-slate-600">
              <th className="p-4 font-semibold w-16">SL</th>
              <th className="p-4 font-semibold">Product</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold w-24">Rating</th>
              <th className="p-4 font-semibold w-1/4">Review</th>
              <th className="p-4 font-semibold w-32">Date</th>
              {userRole === 'admin' && <th className="p-4 font-semibold">Store</th>}
              <th className="p-4 font-semibold w-24">Status</th>
              {userRole === 'seller' && <th className="p-4 font-semibold w-32">Action</th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td colSpan={userRole === 'admin' ? 8 : 7} className="p-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'admin' ? 8 : 7} className="p-8 text-center text-slate-500">No reviews found.</td>
              </tr>
            ) : (
              filteredReviews.map((review, index) => (
                <React.Fragment key={review.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-500">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {review.in_house_products?.thumbnail_url ? (
                          <img 
                            src={review.in_house_products.thumbnail_url} 
                            alt="product" 
                            className="w-10 h-10 rounded border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded border border-slate-200 bg-slate-100"></div>
                        )}
                        <div className="font-medium text-slate-700 line-clamp-2 max-w-[200px]">
                          {review.in_house_products?.name_en || 'Unknown Product'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {review.customers ? `${review.customers.first_name} ${review.customers.last_name}` : 'Unknown Customer'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded w-fit">
                        <span className="font-bold text-xs">{review.rating}</span>
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {review.comment ? (
                        <p className="line-clamp-2 text-xs">{review.comment}</p>
                      ) : (
                        <p className="text-slate-400 italic text-xs flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> No comment
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(review.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    {userRole === 'admin' && (
                      <td className="p-4 text-slate-600 text-xs font-medium">
                        {review.sellers?.shop_name || 'In-House'}
                      </td>
                    )}
                    <td className="p-4">
                      <button 
                        onClick={() => handleStatusToggle(review.id, review.status)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          review.status === 'Published' ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          review.status === 'Published' ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    {userRole === 'seller' && (
                      <td className="p-4">
                        <button
                          onClick={() => setActiveReplyId(activeReplyId === review.id ? null : review.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 rounded font-bold transition"
                        >
                          Reply
                        </button>
                      </td>
                    )}
                  </tr>

                  {/* Expanded Row for Replies and Reply Input */}
                  {userRole === 'seller' && (review.review_replies?.length > 0 || activeReplyId === review.id) && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="p-6 pl-24 border-b border-slate-200">
                        {review.review_replies?.length > 0 && (
                          <div className="space-y-3 mb-4">
                            {review.review_replies.map((rep: any) => (
                              <div key={rep.id} className="text-[13px] bg-white p-4 rounded shadow-sm border border-slate-200">
                                <div className="flex items-center gap-3 mb-2">
                                  <img 
                                    src={rep.sellers?.shop_logo_url || rep.sellers?.seller_image_url || `https://ui-avatars.com/api/?name=${rep.sellers ? rep.sellers.shop_name : 'User'}`} 
                                    alt="Seller" 
                                    className="w-6 h-6 rounded-full object-cover border border-slate-100" 
                                  />
                                  <span className="font-bold text-slate-700">
                                    {rep.sellers ? rep.sellers.shop_name : rep.customers ? `${rep.customers.first_name} ${rep.customers.last_name}` : 'Unknown'}
                                  </span>
                                  <span className="text-[11px] text-slate-400 ml-auto">
                                    {new Date(rep.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-slate-600 pl-9 leading-relaxed">{rep.comment}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeReplyId === review.id && (
                          <div className="bg-white p-4 border border-slate-200 rounded shadow-sm animate-fadeIn">
                            <h4 className="font-bold text-[13px] text-slate-800 mb-3">Write a Reply</h4>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your reply here..."
                              className="w-full p-3 text-[13px] border border-slate-200 rounded-lg outline-none focus:border-orange-500 mb-3 min-h-[100px]"
                            />
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => { setActiveReplyId(null); setReplyText(''); }}
                                className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReplySubmit(review.id)}
                                className="px-5 py-2.5 text-[13px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm"
                              >
                                Submit Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
