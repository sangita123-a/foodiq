"use client";

import { MessageSquare } from "lucide-react";

type Props = {
  instructions: string;
  onChange: (val: string) => void;
};

const commonInstructions = [
  "Less spicy",
  "Call before delivery",
  "Leave at the door",
  "Bring change for ₹500"
];

export default function DeliveryInstructionsSection({ instructions, onChange }: Props) {
  const addInstruction = (text: string) => {
    if (instructions.includes(text)) return;
    const separator = instructions.trim() ? ", " : "";
    onChange(instructions + separator + text);
  };

  return (
    <div className="bg-section rounded-2xl p-6 border border-border mb-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Delivery Instructions
      </h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {commonInstructions.map((inst, idx) => (
          <button 
            key={idx}
            onClick={() => addInstruction(inst)}
            className="bg-section hover:bg-section text-gray-text text-xs px-3 py-1.5 rounded-full border border-border transition-colors"
          >
            + {inst}
          </button>
        ))}
      </div>

      <textarea 
        value={instructions}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Any specific requests for the restaurant or delivery partner?"
        className="w-full bg-white text-foreground border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary transition-colors min-h-[100px] resize-none placeholder-gray-600"
      ></textarea>
    </div>
  );
}
