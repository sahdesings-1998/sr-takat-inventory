import { useState, useCallback, useEffect } from "react";
import chatbotApi from "../api/chatbotApi";

const STORAGE_KEY = "sr_takat_chat_history";

const WELCOME_MESSAGE = {
  id: "welcome-1",
  sender: "bot",
  text: "Hello! I am the **SR TAKAT Application AI Assistant**. I can help you with application features, inventory stock queries, customer/supplier balances, production status, product costing, charity calculations, and system workflows.\n\nHow can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const getInitialMessages = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("[useChatbot] Failed to load chat history from sessionStorage:", e);
  }
  return [WELCOME_MESSAGE];
};

export function useChatbot() {
  const [messages, setMessages] = useState(getInitialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error("[useChatbot] Failed to save chat history to sessionStorage:", e);
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userText, attachment = null) => {
      if ((!userText || !userText.trim()) && !attachment) return;
      if (isLoading) return;

      const cleanText = userText ? userText.trim() : "";
      const textWithAttachment = attachment
        ? `${cleanText}\n\n📎 *[Attached file: ${attachment.name}]*`.trim()
        : cleanText;

      const userMsg = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: textWithAttachment,
        attachmentName: attachment?.name || null,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      // Build recent history for backend
      const historyForBackend = messages
        .filter((m) => m.id !== "welcome-1")
        .slice(-6)
        .map((m) => ({ sender: m.sender, text: m.text }));

      try {
        const response = await chatbotApi.sendMessage(textWithAttachment, historyForBackend);
        const actualReply = response?.message || response?.data?.reply || response?.data?.message || "No response received.";

        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: actualReply,
          isRefusal: Boolean(response?.isRefusal || response?.data?.isRefusal),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        console.error("[useChatbot] Failed to send message:", err);
        const rawErr =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "";

        let userFriendlyErr = "I am currently experiencing a temporary service delay. Please ask your question again.";
        if (rawErr && typeof rawErr === "string" && !rawErr.toLowerCase().includes("model") && !rawErr.toLowerCase().includes("groq")) {
          userFriendlyErr = rawErr;
        }

        setError(userFriendlyErr);

        const errorMsgObj = {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ ${userFriendlyErr}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, errorMsgObj]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("[useChatbot] Failed to clear sessionStorage:", e);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}

export default useChatbot;

