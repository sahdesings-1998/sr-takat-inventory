import { useState, useCallback } from "react";
import chatbotApi from "../api/chatbotApi";

const WELCOME_MESSAGE = {
  id: "welcome-1",
  sender: "bot",
  text: "Hello! I am the **SR TAKAT Application AI Assistant**. I can help you with application features, inventory stock queries, customer/supplier balances, production status, product costing, charity calculations, and system workflows.\n\nHow can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export function useChatbot() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (userText) => {
      if (!userText || !userText.trim() || isLoading) return;

      const cleanText = userText.trim();
      const userMsg = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: cleanText,
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
        const response = await chatbotApi.sendMessage(cleanText, historyForBackend);
        const data = response.data || {};

        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: data.reply || "No response received.",
          isRefusal: !!data.isRefusal,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        console.error("[useChatbot] Failed to send message:", err);
        const errMsg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "An error occurred while connecting to the AI Assistant. Please try again.";

        setError(errMsg);

        const errorMsgObj = {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ **Error**: ${errMsg}`,
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
