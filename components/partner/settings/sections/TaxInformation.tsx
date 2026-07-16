"use client";

import { FileText, ShieldAlert } from "lucide-react";
import { SettingsState } from "../types";

interface TaxInformationProps {
  data: SettingsState["tax"];
  onChange: (data: Partial<SettingsState["tax"]>) => void;
}

export default function TaxInformation({ data, onChange }: TaxInformationProps) {
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-primary" /> Tax Information
        </h2>
        <p className="text-gray-400 text-sm mb-6">Manage your business registration and taxation details for legal compliance.</p>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-primary font-bold mb-1">Legal Compliance Required</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            Ensure your GST and PAN details are accurate. Incorrect information may lead to payout holds or legal penalties. These details will be printed on customer invoices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">GST Number</label>
          <input 
            type="text" 
            value={data.gst}
            onChange={(e) => onChange({ gst: e.target.value.toUpperCase() })}
            placeholder="e.g. 22AAAAA0000A1Z5"
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm uppercase"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PAN Number</label>
          <input 
            type="text" 
            value={data.pan}
            onChange={(e) => onChange({ pan: e.target.value.toUpperCase() })}
            placeholder="e.g. ABCDE1234F"
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm uppercase"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">FSSAI / Business Registration Number</label>
          <input 
            type="text" 
            value={data.regNumber}
            onChange={(e) => onChange({ regNumber: e.target.value })}
            className="w-full md:w-1/2 bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
      </div>

    </div>
  );
}
