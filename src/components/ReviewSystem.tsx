import React, { useState } from "react";
import { Star, MessageSquare, ThumbsUp, Tag, PlusCircle, UserCheck } from "lucide-react";
import { USER_REVIEWS } from "../data";

export default function ReviewSystem() {
  const [reviews, setReviews] = useState(USER_REVIEWS);
  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newProduct, setNewProduct] = useState("AMD Ryzen 5 5600G Desktop PC");
  const [success, setSuccess] = useState(false);

  // Form handle
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newComment.trim()) {
      const added = {
        id: "added-" + Date.now(),
        name: newName,
        rating: newRating,
        comment: newComment,
        itemTitle: newProduct
      };
      setReviews([added, ...reviews]);
      setNewName("");
      setNewComment("");
      setNewRating(5);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="w-full bg-slate-100/60 py-6 px-6 font-sans border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* REVIEW FORM PANEL */}
          <div className="bg-white rounded border border-slate-200 p-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5 text-orange-500" />
              Write a Verified Review
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">
              Share your verified buyer experience. Your review will publish instantly.
            </p>

            {success && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs py-2 px-3 rounded-xl mb-4 font-bold text-center">
                Review posted on the feed!
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-3 text-[11px] font-medium text-slate-705">
              <div>
                <label className="block text-slate-650 mb-0.5">Your Full Name</label>
                <input 
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Shakil Rahman"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-650 mb-0.5">Product Purchased</label>
                <select 
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded outline-none text-[11px]"
                >
                  <option value="AMD Ryzen 5 5600G Desktop PC">AMD Ryzen 5 5600G Desktop PC</option>
                  <option value="Kiam 2.8 Liter Cooker">Kiam 2.8 Liter Cooker</option>
                  <option value="Dahua Imou Ranger 2 3MP">Dahua Imou Ranger 2 3MP</option>
                  <option value="The Apple PowerBook Air M2">The Apple PowerBook Air M2</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-655 mb-0.5 text-slate-650">Star Rating</label>
                <div className="flex gap-1 pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="cursor-pointer text-amber-400"
                    >
                      <Star className={`w-5 h-5 ${star <= newRating ? "fill-amber-400 text-amber-450" : "opacity-30 text-amber-200"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-650 mb-0.5">Review Comments</label>
                <textarea 
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tell other customers about packaging, shipping, delivery speed and authenticity."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-orange-500 min-h-[60px]"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white hover:bg-orange-500 font-bold py-2 rounded transition text-center cursor-pointer text-xs"
              >
                Post Buyer Review
              </button>
            </form>
          </div>

          {/* VERIFIED LIVE FEED */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                Live Customer Reviews Feed
              </h3>
              <span className="text-[9px] text-slate-400 font-mono">Real-time update</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded border border-slate-200 p-3 shadow-xs flex flex-col justify-between hover:border-orange-400 transition duration-150">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{r.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Tag className="w-2.5 h-2.5 text-orange-500" />
                          <span className="text-[9px] text-slate-400 truncate max-w-[130px] font-medium">{r.itemTitle}</span>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, idx) => (
                          <Star 
                            key={idx} 
                            className={`w-2.5 h-2.5 ${idx < r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-650 italic mt-1.5 text-slate-600 line-clamp-3">
                      "{r.comment}"
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="bg-emerald-55 text-slate-900 font-bold px-1.5 py-0.5 rounded uppercase">Verified Buyer</span>
                    <button className="flex items-center gap-0.5 hover:text-orange-500 transition cursor-pointer">
                      <ThumbsUp className="w-2.5 h-2.5" /> Help Yes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
