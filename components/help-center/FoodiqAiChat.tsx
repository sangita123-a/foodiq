"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { sendAiMessage, type ChatMessage } from "@/services/helpCenterApi";

const QUICK_PROMPTS = [
  "Where is my order?",
  "How do I cancel?",
  "How do I get a refund?",
  "How do I use a coupon?",
  "Recommend a restaurant",
  "Explain membership",
];

type Props = {
  onSessionId?: (id: string) => void;
};

export default function FoodiqAiChat({ onSessionId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm **Foodiq AI**. Ask me about orders, delivery, payments, refunds, coupons, or membership.",
      bot: "Foodiq AI",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("foodiq_ai_session") : null
  );
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await sendAiMessage(text, sessionId || undefined);
      setSessionId(res.session_id);
      localStorage.setItem("foodiq_ai_session", res.session_id);
      onSessionId?.(res.session_id);
      setMessages(res.messages || []);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't process that. Try again or use Live Chat.", bot: "Foodiq AI" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E7EB] bg-gradient-to-r from-[#111827] to-[#1F2937] text-white">
        <div className="w-10 h-10 rounded-xl bg-[#E23744] flex items-center justify-center">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <p className="font-black flex items-center gap-1">
            Foodiq AI <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          </p>
          <p className="text-xs text-white/70">Instant answers · Order tracking · Recommendations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#F8FAFC]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-[#E23744] text-white rounded-br-md"
                  : "bg-white border border-[#E5E7EB] text-[#111827] rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content.replace(/\*\*/g, "")}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 px-4 py-2">
            <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 border-t border-[#E5E7EB] flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280] hover:border-[#E23744] hover:text-[#E23744]"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 p-3 border-t border-[#E5E7EB] bg-white"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Foodiq AI anything…"
          className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E23744]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-[#E23744] text-white p-2.5 rounded-xl disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
