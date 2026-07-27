import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Trash2,
  Bot,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
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
  const { messages, isLoading, sendMessage, clearChat } = useChatbot();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
    if (!inputText.trim() || isLoading) return;
    const msg = inputText;
    setInputText("");
    sendMessage(msg);
  };

  const handleChipClick = (promptText) => {
    // Strip icon emoji prefix
    const cleanPrompt = promptText.replace(/^[^\w\s]+/, "").trim();
    sendMessage(cleanPrompt);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-[0_8px_25px_rgba(79,70,229,0.4)] hover:shadow-[0_12px_35px_rgba(79,70,229,0.6)] hover:scale-105 transition-all duration-300 cursor-pointer"
          title="SR TAKAT AI Assistant"
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-300" />
          ) : (
            <div className="relative">
              <Sparkles className="h-6 w-6 text-indigo-200 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-indigo-900 animate-pulse" />
            </div>
          )}

          {/* Tooltip on hover */}
          {!isOpen && (
            <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
              AI Assistant
            </span>
          )}
        </button>
      </div>

      {/* CHAT DRAWER MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden animate-fade-in pointer-events-auto">
          {/* Backdrop (mobile click to close) */}
          <div
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-xs sm:bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full sm:w-[440px] h-full sm:h-[620px] sm:max-h-[90vh] sm:m-4 sm:rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="relative p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm tracking-tight">SR TAKAT AI Assistant</h3>
                    {/* <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-semibold border border-indigo-400/20">
                      Groq AI
                    </span> */}
                  </div>
                  <p className="text-[11px] text-gray-300 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" /> Application Knowledge & Data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title="Clear Conversation History"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-bl-none text-xs text-gray-500 font-medium flex items-center gap-2 shadow-xs">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    Analyzing request and generating response...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            {/* {messages.length < 5 && !isLoading && (
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-indigo-500" /> Suggested Prompts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleChipClick(prompt)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-[11px] font-semibold text-gray-700 hover:text-indigo-700 transition-all text-left truncate max-w-full shadow-2xs cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )} */}

            {/* Input Form */}
            <div className="p-3 bg-white border-t border-gray-100">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask anything about products, stock, sales, charity..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={1000}
                  disabled={isLoading}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md shadow-indigo-200"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 px-1">
                <span>Scope: Application & Authorized Data only</span>
                <span>{inputText.length}/1000</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
