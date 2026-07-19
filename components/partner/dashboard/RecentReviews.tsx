"use client";

import { Star, MessageSquareReply, User } from "lucide-react";

export default function RecentReviews() {
  const reviews = [
    { name: "Sneha Gupta", rating: 5, date: "Today", text: "The biryani was absolutely fantastic! Perfectly cooked and delivered hot. Will order again." },
    { name: "Karan Singh", rating: 4, date: "Yesterday", text: "Great taste, but the delivery took a bit longer than expected. Food quality is top notch." },
  ];

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl h-full">
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
          Recent Reviews
        </h2>
        <button className="text-sm font-bold text-[#6B7280] hover:text-[#111827] transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E5E7EB]">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#6B7280]" aria-label={review.name} />
                </div>
                <div>
                  <h4 className="text-[#111827] font-bold text-sm">{review.name}</h4>
                  <p className="text-[#9CA3AF] text-xs">{review.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-yellow-500 font-bold text-xs">{review.rating}.0</span>
              </div>
            </div>
            
            <p className="text-[#6B7280] text-sm leading-relaxed mb-4">
              "{review.text}"
            </p>

            <button className="flex items-center gap-2 text-sm text-[#E23744] font-bold hover:text-[#C81E34] transition-colors">
              <MessageSquareReply className="w-4 h-4" /> Reply to {review.name.split(' ')[0]}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
