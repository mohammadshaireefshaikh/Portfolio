import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageSquare, ChevronDown } from "lucide-react";
import ChatMessage from "./ChatMessage";

const STARTER_PROMPTS = [
  "What's his strongest stack?",
  "Show me his Unity work",
  "Is he open to roles?",
  "How do I contact him?",
];

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi, I'm Mohammad's portfolio assistant. Ask me anything about his work — projects, stack, experience, or how to reach him.",
};

// Local dev: leave VITE_API_URL blank → Vite proxy → http://localhost:3001
// Production: set VITE_API_URL=https://your-project.vercel.app/api/chat at build time
const API_URL = import.meta.env.VITE_API_URL || "/api/chat";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];

      setMessages([...nextMessages, { role: "assistant", content: "", streaming: true }]);
      setInput("");
      setLoading(true);

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Try to read structured error from JSON body
          let serverMsg = `HTTP ${res.status}`;
          try {
            const body = await res.json();
            if (body?.error) serverMsg = body.error;
          } catch {
            // Non-JSON body — keep status code
          }
          throw new Error(serverMsg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                fullContent += parsed.delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: fullContent,
                    streaming: true,
                  };
                  return updated;
                });
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }

        // Finalise
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullContent || "I couldn't get a response. Please try again.",
          };
          return updated;
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        const msg = err?.message || "";
        const friendly = /too many/i.test(msg)
          ? "You're sending messages too fast. Wait a moment, then try again."
          : /too long|max .* chars/i.test(msg)
          ? "That message is too long. Try a shorter one."
          : "Something went wrong connecting to the server. Try again or email shaikh.mohammad1099@gmail.com";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: friendly };
          return updated;
        });
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [messages, loading]
  );

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleClose() {
    abortRef.current?.abort();
    setOpen(false);
  }

  const showStarters = messages.length === 1 && !loading;

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-5 z-50 flex flex-col"
            style={{
              width: "min(420px, calc(100vw - 24px))",
              height: "min(580px, calc(100svh - 130px))",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,113,227,0.08)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#0071e3" }}
                >
                  <span className="text-xs font-bold text-white select-none">M</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">
                    Ask about Mohammad
                  </p>
                  <p className="text-[11px] text-[#444] mt-0.5">Portfolio assistant</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center rounded-full text-[#555] hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Starter prompts */}
            <AnimatePresence>
              {showStarters && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-2 flex flex-wrap gap-2 shrink-0"
                >
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-xs px-3 py-1.5 rounded-full text-[#86868b] hover:text-white transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 pb-4 pt-3 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask anything about Mohammad..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#3a3a3a] outline-none min-w-0"
                  style={{ fontFamily: "inherit" }}
                  aria-label="Chat input"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 disabled:opacity-40"
                  style={{
                    background: input.trim() && !loading ? "#0071e3" : "rgba(255,255,255,0.08)",
                  }}
                  aria-label="Send"
                >
                  <Send
                    size={13}
                    color={input.trim() && !loading ? "#fff" : "#555"}
                  />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating button ─────────────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 flex items-center justify-center rounded-full"
        style={{
          background: "#0071e3",
          boxShadow: "0 4px 20px rgba(0,113,227,0.45)",
        }}
        aria-label={open ? "Close chat" : "Chat with Mohammad's assistant"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ChevronDown size={22} color="white" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageSquare size={22} color="white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
