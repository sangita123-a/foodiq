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
    <div className="bg-[#111] border border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl p-4 md:p-6 flex items-center justify-between gap-4">
      
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
          wallet.isConnected ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-gray-400'
        }`}>
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-white font-bold text-lg">{wallet.name}</h4>
          <p className={`text-xs uppercase tracking-widest mt-0.5 font-bold ${
            wallet.isConnected ? 'text-green-400' : 'text-gray-500'
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
            : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
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
