import Link from "next/link";
import { Ticket, Clock } from "lucide-react";

type Props = {
  title: string;
  description: string;
  couponCode: string;
  deliveryTime?: string;
};

export default function LiveDealBanner({ title, description, couponCode, deliveryTime }: Props) {
  return (
    <div className="container mx-auto px-4 md:px-8 -mt-4 mb-6 relative z-20">
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-bold uppercase tracking-wider mb-1">Live Deal Active</p>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{title}</h2>
          <p className="text-gray-text text-sm">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {deliveryTime && (
            <div className="flex items-center gap-1.5 bg-section border border-border px-3 py-1.5 rounded-lg text-xs text-gray-text">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{deliveryTime}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-section border border-border px-3 py-1.5 rounded-lg text-xs text-gray-text">
            <Ticket className="w-3.5 h-3.5 text-green-400" />
            <span className="font-mono font-bold">{couponCode}</span>
          </div>
          <Link
            href="/checkout"
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-colors"
          >
            Checkout with Offer
          </Link>
        </div>
      </div>
    </div>
  );
}
