import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Bot,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Paperclip,
  Minus,
  FileText,
} from "lucide-react";
import { useChatbot } from "../hooks/useChatbot";
import ChatMessageBubble from "./ChatMessageBubble";

const SUGGESTED_PROMPTS = [
  "📊 Show inventory stock summary",
  "💰 Which customers have unpaid balances?",
  "🏷️ How do I print QR codes and barcodes?",
  "💎 Explain charity calculation formula",
  "🔨 Active manufacturing job cards status",
  "📦 How to create a new product step-by-step?",
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const { messages, isLoading, sendMessage, clearChat } = useChatbot();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || isLoading) return;
    const msg = inputText;
    const attachment = attachedFile;
    setInputText("");
    setAttachedFile(null);
    sendMessage(msg, attachment);
  };

  const handleChipClick = (promptText) => {
    // Strip icon emoji prefix
    const cleanPrompt = promptText.replace(/^[^\w\s]+/, "").trim();
    sendMessage(cleanPrompt);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[9999] print:hidden pointer-events-none flex flex-col items-end">
      {/* FLOATING CHAT WIDGET WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto mb-3 w-[calc(100vw-24px)] max-w-[440px] md:w-[380px] lg:w-[420px] h-[calc(100dvh-100px)] max-h-[600px] md:max-h-[540px] lg:max-h-[600px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-indigo-950/20 border border-gray-200/80 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-500/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm tracking-tight">SR TAKAT AI Assistant</h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-300 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" /> Application Data & Support
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Clear Conversation History"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Minimize Chat"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  title="Close Chat"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/50 overscroll-contain">
              {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2.5 animate-pulse">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="px-3.5 py-2.5 bg-white border border-gray-100 rounded-2xl rounded-bl-none text-xs text-gray-500 font-medium flex items-center gap-2 shadow-xs">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    Analyzing request and generating response...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Quick Prompts (visible when few messages) */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-3.5 py-2 bg-gray-50/90 border-t border-gray-100/80 shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-indigo-500" /> Quick Prompts
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {SUGGESTED_PROMPTS.slice(0, 4).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleChipClick(prompt)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-[11px] font-semibold text-gray-700 hover:text-indigo-700 transition-all text-left whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachment Preview Badge */}
            {attachedFile && (
              <div className="px-3.5 py-1.5 bg-indigo-50/70 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-800 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold truncate">{attachedFile.name}</span>
                  <span className="text-[10px] text-indigo-500">({Math.round(attachedFile.size / 1024)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="p-1 text-indigo-500 hover:text-rose-600 rounded cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input Form Footer */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                />

                {/* Attachment Button */}
                {/* <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 disabled:opacity-50 flex items-center justify-center shrink-0 transition-all cursor-pointer border border-gray-200/60"
                  title="Attach file or reference document"
                >
                  <Paperclip className="h-4.5 w-4.5" />
                </button> */}

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about inventory, stock, sales, charity..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={1000}
                  disabled={isLoading}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-w-0"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !attachedFile) || isLoading}
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md shadow-indigo-200 active:scale-95"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 px-1">
                <span>Scope: Application & Authorized Data</span>
                <span>{inputText.length}/1000</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TRIGGER BUTTON (Bottom Right Anchor) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto relative flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-[0_8px_25px_rgba(79,70,229,0.4)] hover:shadow-[0_12px_35px_rgba(79,70,229,0.6)] transition-all duration-300 cursor-pointer"
        title="SR TAKAT AI Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 text-indigo-200" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-indigo-900 animate-pulse" />
          </div>
        )}

        {/* Hover Tooltip (Desktop) */}
        {!isOpen && (
          <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold whitespace-nowrap opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none hidden sm:inline-block">
            AI Assistant
          </span>
        )}
      </motion.button>
    </div>
  );
}

