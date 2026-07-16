"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Review } from "./types";
import { Star, MessageCircle, MoreVertical, Flag, Copy, EyeOff, Award, Send, Trash2, Edit2, User } from "lucide-react";

interface ReviewCardProps {
  review: Review;
  onUpdateReply: (id: string, text: string | null) => void;
  onUpdateStatus: (id: string, field: "isFeatured" | "isHidden", value: boolean) => void;
}

export default function ReviewCard({ review, onUpdateReply, onUpdateStatus }: ReviewCardProps) {
  
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.reply?.text || "");

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onUpdateReply(review.id, replyText);
      setIsReplying(false);
    }
  };

  const handleDeleteReply = () => {
    onUpdateReply(review.id, null);
    setReplyText("");
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-[#171717] rounded-3xl p-6 border shadow-xl relative overflow-hidden transition-colors ${review.isHidden ? 'opacity-50 border-white/5' : review.isFeatured ? 'border-yellow-500/30' : 'border-white/5'}`}
    >
      {review.isFeatured && (
        <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-b border-l border-yellow-500/30 flex items-center gap-1">
          <Award className="w-3 h-3" /> Featured
        </div>
      )}
      
      {review.isHidden && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="bg-black/80 px-4 py-2 rounded-full border border-white/10 text-white text-xs font-bold flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-red-500" /> Review Hidden
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#111] overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
            {review.customerImage ? (
              <img src={review.customerImage} alt={review.customerName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="text-white font-bold">{review.customerName}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{review.date} • {review.orderId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} 
              />
            ))}
          </div>
          
          <button 
            onClick={() => setShowActionMenu(!showActionMenu)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors ml-2"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showActionMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-10 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20"
              >
                <button onClick={() => { onUpdateStatus(review.id, "isFeatured", !review.isFeatured); setShowActionMenu(false); }} className="w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5">
                  <Award className={`w-4 h-4 ${review.isFeatured ? 'text-yellow-500' : 'text-gray-400'}`} /> 
                  {review.isFeatured ? "Unfeature Review" : "Mark as Featured"}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(review.description); setShowActionMenu(false); }} className="w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5">
                  <Copy className="w-4 h-4 text-gray-400" /> Copy Review
                </button>
                <button onClick={() => { onUpdateStatus(review.id, "isHidden", !review.isHidden); setShowActionMenu(false); }} className="w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5">
                  <EyeOff className={`w-4 h-4 ${review.isHidden ? 'text-blue-500' : 'text-gray-400'}`} /> 
                  {review.isHidden ? "Unhide Review" : "Hide Review"}
                </button>
                <button onClick={() => setShowActionMenu(false)} className="w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                  <Flag className="w-4 h-4" /> Report Abuse
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">Ordered: {review.orderedDish}</p>
        {review.title && <h4 className="text-white font-bold mb-1">{review.title}</h4>}
        <p className="text-gray-300 text-sm leading-relaxed">{review.description}</p>
      </div>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto custom-scrollbar pb-2">
          {review.photos.map((photo, idx) => (
            <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0">
              <img src={photo} alt="Review attachment" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>
      )}

      {/* Restaurant Response Area */}
      <div className="mt-4 pt-4 border-t border-white/5">
        {review.reply ? (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary">FQ</span>
                </div>
                <span className="text-white font-bold text-sm">Restaurant Reply</span>
                <span className="text-gray-500 text-xs">• {review.reply.date}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsReplying(true)} className="text-gray-400 hover:text-white transition-colors p-1"><Edit2 className="w-3.5 h-3.5"/></button>
                <button onClick={handleDeleteReply} className="text-gray-400 hover:text-red-400 transition-colors p-1"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
            
            {isReplying ? (
              <div className="mt-3">
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-[#111] text-white text-sm border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setIsReplying(false)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleReplySubmit} className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-[#e02633] transition-colors flex items-center gap-1">Update <Send className="w-3 h-3"/></button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 text-sm italic">"{review.reply.text}"</p>
            )}
          </div>
        ) : (
          <div>
            {isReplying ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to the customer..."
                  className="w-full bg-[#111] text-white text-sm border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => {setIsReplying(false); setReplyText("");}} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleReplySubmit} disabled={!replyText.trim()} className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-[#e02633] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">Send Reply <Send className="w-3 h-3"/></button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setIsReplying(true)}
                className="text-primary hover:text-white text-sm font-bold flex items-center gap-2 transition-colors group"
              >
                <MessageCircle className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> Reply to Review
              </button>
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
}
