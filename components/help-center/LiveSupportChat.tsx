"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, ImagePlus, Paperclip, Send, User } from "lucide-react";
import {
  sendLiveMessage,
  startLiveChat,
  closeLiveChat,
  fetchAgentStatus,
  type LiveMessage,
} from "@/services/helpCenterApi";
import { getSocket } from "@/lib/socket";
import { useAuthToken } from "@/hooks/useAuthToken";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import {
  ATTACHMENT_PREVIEW_SIZES,
  CHAT_ATTACHMENT_SIZES,
  THUMBNAIL_IMAGE_SIZES,
} from "@/lib/performance/assets";

export default function LiveSupportChat() {
  const hasToken = useAuthToken();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [input, setInput] = useState("");
  const [agentOnline, setAgentOnline] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAgentStatus().then((s) => setAgentOnline(s.online)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  const joinSocket = useCallback((id: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("joinSupport", { chat_id: id });
    socket.off("supportMessage");
    socket.on("supportMessage", (msg: LiveMessage) => {
      setMessages((m) => [...m, msg]);
    });
    socket.off("supportTyping");
    socket.on("supportTyping", (payload: { typing?: boolean }) => {
      setAgentTyping(!!payload.typing);
    });
  }, []);

  const beginChat = async () => {
    if (!hasToken) return;
    setStarting(true);
    try {
      const chat = await startLiveChat("Help Center live support");
      setChatId(chat.id);
      joinSocket(chat.id);
      setMessages([
        {
          id: "welcome",
          message: "You're connected to Foodiq Support. An agent will join shortly. How can we help?",
          sender_role: "system",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    if (!chatId || (!input.trim() && !sending)) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const msg = await sendLiveMessage(chatId, { message: text });
      setMessages((m) => [...m, msg]);
      const socket = getSocket();
      socket?.emit("supportTyping", { chat_id: chatId, typing: false });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (!chatId) return;
    const socket = getSocket();
    socket?.emit("supportTyping", { chat_id: chatId, typing: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("supportTyping", { chat_id: chatId, typing: false });
    }, 1500);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const msg = await sendLiveMessage(chatId, {
        attachment_url: dataUrl,
        attachment_type: file.type.startsWith("image/") ? "image" : "file",
        message: file.name,
      });
      setMessages((m) => [...m, msg]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (!hasToken) {
    return (
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 text-center">
        <p className="text-[#6B7280] mb-4">Sign in to start a live chat with our support team.</p>
        <a href="/login" className="inline-block bg-[#E23744] text-white font-black px-6 py-3 rounded-xl">
          Sign In
        </a>
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Circle className={`w-3 h-3 fill-current ${agentOnline ? "text-emerald-500" : "text-[#9CA3AF]"}`} />
          <span className="text-sm font-bold text-[#6B7280]">
            {agentOnline ? "Agents online" : "Agents offline — we'll respond via ticket"}
          </span>
        </div>
        <h3 className="text-xl font-black text-[#111827] mb-2">Live Support Chat</h3>
        <p className="text-sm text-[#6B7280] mb-6">Chat with a real agent. Share screenshots and get real-time help.</p>
        <button
          type="button"
          onClick={beginChat}
          disabled={starting}
          className="bg-[#111827] text-white font-black px-8 py-3 rounded-xl disabled:opacity-60"
        >
          {starting ? "Connecting…" : "Start Live Chat"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-[#E23744]" />
          <span className="font-black text-[#111827]">Live Support</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className={`w-2.5 h-2.5 fill-current ${agentOnline ? "text-emerald-500" : "text-[#9CA3AF]"}`} />
          <button
            type="button"
            onClick={() => closeLiveChat(chatId).then(() => setChatId(null))}
            className="text-xs font-bold text-[#6B7280] hover:text-[#E23744]"
          >
            End chat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#F8FAFC]">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_role === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.sender_role === "customer"
                  ? "bg-[#E23744] text-white"
                  : m.sender_role === "agent"
                    ? "bg-[#111827] text-white"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              {m.attachment_url && m.attachment_type === "image" ? (
                <SafeImage
                  src={m.attachment_url}
                  fallback={FOOD_FALLBACK}
                  alt="Chat attachment image"
                  width={320}
                  height={240}
                  sizes={CHAT_ATTACHMENT_SIZES}
                  className="mb-1 max-w-full rounded-lg object-contain"
                />
              ) : null}
              <p>{m.message}</p>
            </div>
          </div>
        ))}
        {agentTyping && (
          <p className="text-xs text-[#9CA3AF] italic">Agent is typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 p-3 border-t border-[#E5E7EB]">
        <label className="cursor-pointer p-2 text-[#6B7280] hover:text-[#E23744]">
          <ImagePlus className="w-5 h-5" />
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <label className="cursor-pointer p-2 text-[#6B7280] hover:text-[#E23744]">
          <Paperclip className="w-5 h-5" />
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
        <input
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Type a message…"
          className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm"
        />
        <button type="button" onClick={send} disabled={sending} className="bg-[#E23744] text-white p-2 rounded-xl">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
