"use client";

import { History, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export type RewardHistoryType = {
  id: string;
  date: string;
  title: string;
  pointsAdded?: number;
  pointsUsed?: number;
};

type Props = {
  history: RewardHistoryType[];
};

export default function RewardHistory({ history }: Props) {
  return (
    <div className="bg-section rounded-3xl p-6 md:p-8 border border-border">
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
        <History className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Reward History</h2>
      </div>

      <div className="flex flex-col gap-4">
        {history.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-border hover:border-border transition-colors">
            
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.pointsAdded ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              }`}>
                {item.pointsAdded ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              
              <div>
                <h4 className="text-white font-bold">{item.title}</h4>
                <p className="text-[#9CA3AF] text-xs font-bold mt-1">{item.date}</p>
              </div>
            </div>

            <div className={`font-black text-lg ${
              item.pointsAdded ? "text-green-400" : "text-red-400"
            }`}>
              {item.pointsAdded ? "+" : "-"}{item.pointsAdded || item.pointsUsed}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
