"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, ImagePlus, Send, Smile, Bot, User } from "lucide-react";
import SupportModal from "@/components/support/SupportModal";
import {
  sendAiMessage,
  sendLiveMessage,
  startLiveChat,
  closeLiveChat,
  fetchAgentStatus,
  fetchLiveChat,
  type LiveMessage,
} from "@/services/helpCenterApi";
import { getSocket } from "@/lib/socket";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { CHAT_ATTACHMENT_SIZES } from "@/lib/performance/assets";

const EMOJIS = ["😀", "😊", "👍", "🙏", "❤️", "🔥", "😮", "😢", "🎉", "🍕"];

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "choose" | "human" | "ai";

export default function LiveChatModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [input, setInput] = useState("");
  const [agentOnline, setAgentOnline] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [aiSession, setAiSession] = useState<string | undefined>();
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchAgentStatus()
      .then((s) => setAgentOnline(s.online))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const visibleUnread = open ? 0 : unread;

  const joinSocket = useCallback((id: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("joinSupport", { chat_id: id });
    socket.off("supportMessage");
    socket.on("supportMessage", (msg: LiveMessage) => {
      setMessages((m) => [...m, msg]);
      if (msg.sender_role !== "customer" && !openRef.current) {
        setUnread((u) => u + 1);
      }
    });
    socket.off("supportTyping");
    socket.on("supportTyping", (payload: { typing?: boolean }) => {
      setAgentTyping(!!payload.typing);
    });
  }, []);

  const beginHuman = async () => {
    setStarting(true);
    try {
      const chat = await startLiveChat("Help & Support live chat");
      setChatId(chat.id);
      setMode("human");
      joinSocket(chat.id);
      try {
        const detail = await fetchLiveChat(chat.id);
        if (detail.messages?.length) setMessages(detail.messages);
        else {
          setMessages([
            {
              id: "welcome",
              message:
                "You're connected to Foodiq Support. An agent will join shortly. How can we help?",
              sender_role: "system",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch {
        setMessages([
          {
            id: "welcome",
            message: "You're connected to Foodiq Support. How can we help?",
            sender_role: "system",
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setStarting(false);
    }
  };

  const beginAi = () => {
    setMode("ai");
    setMessages([
      {
        id: "ai-welcome",
        message: "Hi! I'm Foodiq Assistant. Ask me about orders, refunds, coupons, or delivery.",
        sender_role: "bot",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const sendHuman = async () => {
    if (!chatId || !input.trim()) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const msg = await sendLiveMessage(chatId, { message: text });
      setMessages((m) => [...m, msg]);
      getSocket()?.emit("supportTyping", { chat_id: chatId, typing: false });
    } finally {
      setSending(false);
    }
  };

  const sendAi = async () => {
    if (!input.trim()) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, message: text, sender_role: "customer", created_at: new Date().toISOString() },
    ]);
    setAgentTyping(true);
    try {
      const res = await sendAiMessage(text, aiSession);
      setAiSession(res.session_id);
      setMessages((m) => [
        ...m,
        {
          id: `b-${Date.now()}`,
          message: res.reply,
          sender_role: "bot",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          message: "Sorry, I couldn't respond right now. Try Live Agent instead.",
          sender_role: "system",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setAgentTyping(false);
      setSending(false);
    }
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (!chatId || mode !== "human") return;
    const socket = getSocket();
    socket?.emit("supportTyping", { chat_id: chatId, typing: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("supportTyping", { chat_id: chatId, typing: false });
    }, 1500);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || mode !== "human") return;
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

  const handleClose = async () => {
    if (chatId && mode === "human") {
      try {
        await closeLiveChat(chatId);
      } catch {
        /* ignore */
      }
    }
    setMode("choose");
    setChatId(null);
    setMessages([]);
    setInput("");
    setShowEmoji(false);
    onClose();
  };

  return (
    <SupportModal open={open} onClose={handleClose} title="Live Chat" wide>
      {mode === "choose" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={beginHuman}
            disabled={starting}
            className="rounded-2xl border border-border bg-white p-6 text-left transition-colors hover:border-primary"
          >
            <div className="mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <Circle
                className={`h-2.5 w-2.5 fill-current ${agentOnline ? "text-green-500" : "text-[#9CA3AF]"}`}
              />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Human Support</h3>
            <p className="text-sm text-gray-text">
              {agentOnline ? "Agents online now" : "Agents offline — we'll still take your chat"}
            </p>
          </button>
          <button
            type="button"
            onClick={beginAi}
            className="rounded-2xl border border-border bg-white p-6 text-left transition-colors hover:border-primary"
          >
            <Bot className="mb-3 h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground mb-1">AI Bot</h3>
            <p className="text-sm text-gray-text">Instant answers about orders, refunds & delivery</p>
          </button>
        </div>
      ) : (
        <div className="flex h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              {mode === "ai" ? (
                <Bot className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
              <span className="font-bold text-foreground">
                {mode === "ai" ? "AI Assistant" : "Live Support"}
              </span>
              {visibleUnread > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white">
                  {visibleUnread} new
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-text">
              <Circle
                className={`h-2 w-2 fill-current ${
                  mode === "ai" || agentOnline ? "text-green-500" : "text-[#9CA3AF]"
                }`}
              />
              {mode === "ai" ? "Online" : agentOnline ? "Online" : "Away"}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-section p-4 custom-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender_role === "customer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.sender_role === "customer"
                      ? "bg-primary text-white"
                      : m.sender_role === "agent" || m.sender_role === "bot"
                        ? "bg-[#111827] text-white"
                        : "border border-border bg-white text-gray-text"
                  }`}
                >
                  {m.attachment_url && m.attachment_type === "image" ? (
                    <SafeImage
                      src={m.attachment_url}
                      fallback={FOOD_FALLBACK}
                      alt="Chat attachment"
                      width={280}
                      height={200}
                      sizes={CHAT_ATTACHMENT_SIZES}
                      className="mb-1 max-w-full rounded-lg object-contain"
                    />
                  ) : null}
                  <p>{m.message}</p>
                  <p className="mt-1 text-[10px] opacity-60">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            ))}
            {agentTyping ? (
              <p className="text-xs italic text-[#9CA3AF]">
                {mode === "ai" ? "Assistant is typing…" : "Agent is typing…"}
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="relative border-t border-border p-3">
            {showEmoji ? (
              <div className="absolute bottom-16 left-3 z-10 flex flex-wrap gap-1 rounded-2xl border border-border bg-white p-2 shadow-lg">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="rounded-lg px-2 py-1 text-lg hover:bg-section"
                    onClick={() => {
                      setInput((v) => v + e);
                      setShowEmoji(false);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-gray-text"
                aria-label="Emoji picker"
              >
                <Smile className="h-4 w-4" />
              </button>
              {mode === "human" ? (
                <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-gray-text">
                  <ImagePlus className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </label>
              ) : null}
              <input
                value={input}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (mode === "ai") sendAi();
                    else sendHuman();
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 rounded-xl border border-border bg-section px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={sending || !input.trim()}
                onClick={() => (mode === "ai" ? sendAi() : sendHuman())}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </SupportModal>
  );
}
