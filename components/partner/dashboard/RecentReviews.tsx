"use client";

import { Star, MessageSquareReply } from "lucide-react";

export default function RecentReviews() {
  const reviews = [
    { name: "Sneha Gupta", rating: 5, date: "Today", text: "The biryani was absolutely fantastic! Perfectly cooked and delivered hot. Will order again.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Karan Singh", rating: 4, date: "Yesterday", text: "Great taste, but the delivery took a bit longer than expected. Food quality is top notch.", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
  ];

  return (
    <div className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl h-full">
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Recent Reviews
        </h2>
        <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-[#111] p-5 rounded-2xl border border-white/5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{review.name}</h4>
                  <p className="text-gray-500 text-xs">{review.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-yellow-500 font-bold text-xs">{review.rating}.0</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              "{review.text}"
            </p>

            <button className="flex items-center gap-2 text-sm text-primary font-bold hover:text-[#e02633] transition-colors">
              <MessageSquareReply className="w-4 h-4" /> Reply to {review.name.split(' ')[0]}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
