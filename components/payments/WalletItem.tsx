"use client";

import { Wallet, CheckCircle2, Link as LinkIcon } from "lucide-react";

export type WalletType = {
  id: string;
  name: string;
  isConnected: boolean;
};

type Props = {
  wallet: WalletType;
  onToggleConnect: (id: string) => void;
};

export default function WalletItem({ wallet, onToggleConnect }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 shadow-[0_6px_18px_rgba(28,28,28,0.05)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_10px_26px_rgba(28,28,28,0.08)] md:p-6">
      
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
          wallet.isConnected ? 'bg-primary/10 border-primary/20 text-primary' : 'border-border bg-[#F8F9FA] text-muted'
        }`}>
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-foreground">{wallet.name}</h4>
          <p className={`text-xs uppercase tracking-widest mt-0.5 font-bold ${
            wallet.isConnected ? 'text-green-600' : 'text-muted'
          }`}>
            {wallet.isConnected ? 'Connected' : 'Not Connected'}
          </p>
        </div>
      </div>

      <button 
        onClick={() => onToggleConnect(wallet.id)}
        className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${
          wallet.isConnected 
            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10' 
            : 'border border-border bg-[#F8F9FA] text-foreground hover:border-primary/30 hover:bg-white'
        }`}
      >
        {wallet.isConnected ? (
          <>Disconnect</>
        ) : (
          <><LinkIcon className="w-4 h-4" /> Link Account</>
        )}
      </button>

    </div>
  );
}
