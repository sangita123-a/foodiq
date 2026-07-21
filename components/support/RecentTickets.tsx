"use client";

import { Ticket, ExternalLink } from "lucide-react";

export type TicketType = {
  id: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved";
  date: string;
};

type Props = {
  tickets: TicketType[];
};

export default function RecentTickets({ tickets }: Props) {

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Open": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "In Progress": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Resolved": return "bg-green-500/10 text-green-400 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-text";
    }
  };

  return (
    <div className="bg-section rounded-3xl p-6 md:p-8 border border-border h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">Recent Requests</h2>
        <Ticket className="w-6 h-6 text-[#9CA3AF]" />
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white border border-border hover:border-border transition-colors rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono font-bold text-[#9CA3AF] bg-section px-2 py-0.5 rounded">#{ticket.id}</span>
                <h4 className="text-foreground font-bold truncate">{ticket.subject}</h4>
              </div>
              <p className="text-[#9CA3AF] text-xs font-bold">{ticket.date}</p>
            </div>

            <div className="flex items-center gap-4 self-start md:self-center">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
              <button className="w-10 h-10 rounded-xl bg-section hover:bg-section flex items-center justify-center transition-colors text-gray-text hover:text-foreground group">
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
