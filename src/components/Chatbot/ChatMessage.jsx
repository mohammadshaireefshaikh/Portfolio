import { motion } from "framer-motion";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
          style={{ background: "#0071e3" }}
        >
          <span className="text-[10px] font-bold text-white select-none">M</span>
        </div>
      )}

      <div
        className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
        style={
          isUser
            ? {
                background: "#0071e3",
                color: "#fff",
                borderRadius: "18px 18px 4px 18px",
              }
            : {
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e5e7",
                borderRadius: "18px 18px 18px 4px",
              }
        }
      >
        {message.content}
        {message.streaming && message.content === "" && (
          <span className="inline-flex gap-1 items-center h-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "120ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce" style={{ animationDelay: "240ms" }} />
          </span>
        )}
        {message.streaming && message.content !== "" && (
          <span
            className="inline-block w-0.5 h-3.5 rounded-sm ml-0.5 align-middle"
            style={{ background: "#0071e3", animation: "pulse 1s ease-in-out infinite" }}
          />
        )}
      </div>
    </motion.div>
  );
}
