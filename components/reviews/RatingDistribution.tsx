"use client";

type Distribution = Record<number, number>;

type Props = {
  averageRating?: number;
  totalReviews?: number;
  distribution?: Distribution;
  className?: string;
};

export default function RatingDistribution({
  averageRating = 0,
  totalReviews = 0,
  distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  className = "",
}: Props) {
  const stars = [5, 4, 3, 2, 1] as const;

  return (
    <div className={`rounded-2xl border border-[#E5E7EB] bg-white p-5 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-4xl font-black text-[#111827]">{Number(averageRating).toFixed(1)}</p>
          <p className="text-xs text-[#9CA3AF]">{totalReviews} review{totalReviews === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="space-y-2">
        {stars.map((star) => {
          const count = distribution[star] || 0;
          const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8 font-bold text-[#6B7280]">{star}★</span>
              <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E23744] rounded-full transition-all"
                  style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-[#9CA3AF]">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
