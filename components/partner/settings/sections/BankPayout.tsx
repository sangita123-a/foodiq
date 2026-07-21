"use client";

import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { SettingsState } from "../types";
import { useState } from "react";
import { motion } from "framer-motion";

interface BankPayoutProps {
  data: SettingsState["bank"];
  onChange: (data: Partial<SettingsState["bank"]>) => void;
}

export default function BankPayout({ data, onChange }: BankPayoutProps) {
  
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground flex items-center gap-2 mb-2">
          <CreditCard className="w-6 h-6 text-primary" /> Bank & Payout Details
        </h2>
        <p className="text-gray-text text-sm mb-6">Manage the bank account where your weekly payouts will be deposited.</p>
      </div>

      {/* Verification Status Banner */}
      <motion.div 
        layout
        className={`p-4 rounded-2xl flex items-start gap-4 border ${isVerified ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}
      >
        {isVerified ? (
          <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
        )}
        <div>
          <h4 className={`font-bold mb-1 ${isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
            {isVerified ? 'Account Verified & Active' : 'Action Required: Verify Account'}
          </h4>
          <p className="text-sm text-gray-text leading-relaxed">
            {isVerified 
              ? 'Your bank account is fully verified. Weekly settlements will be deposited into this account automatically.'
              : 'Please verify your bank account to enable weekly payouts. A small test amount of ₹1.00 will be deposited.'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">Account Holder Name</label>
          <input 
            type="text" 
            value={data.accountName}
            onChange={(e) => onChange({ accountName: e.target.value })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">Bank Name</label>
          <input 
            type="text" 
            value={data.bankName}
            onChange={(e) => onChange({ bankName: e.target.value })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">Account Number</label>
          <input 
            type="password" 
            value={data.accountNumber}
            onChange={(e) => onChange({ accountNumber: e.target.value })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans"
            placeholder="Enter Account Number"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">IFSC Code</label>
          <input 
            type="text" 
            value={data.ifsc}
            onChange={(e) => onChange({ ifsc: e.target.value.toUpperCase() })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm uppercase"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">UPI ID (Optional)</label>
          <input 
            type="text" 
            value={data.upi}
            onChange={(e) => onChange({ upi: e.target.value })}
            placeholder="e.g. foodiq.restaurant@okhdfc"
            className="w-full md:w-1/2 bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        {!isVerified && (
          <button 
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        )}
        <button className="px-6 py-3 bg-section hover:bg-section border border-border text-foreground rounded-xl font-bold transition-colors">
          Update Bank Details
        </button>
      </div>

    </div>
  );
}
