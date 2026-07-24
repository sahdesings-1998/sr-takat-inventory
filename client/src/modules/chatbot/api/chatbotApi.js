import apiClient from "@/services/apiClient";

export const chatbotApi = {
  sendMessage: (message, history = []) =>
    apiClient.post("/chatbot/message", { message, history }).then((res) => res.data),
};

export default chatbotApi;
