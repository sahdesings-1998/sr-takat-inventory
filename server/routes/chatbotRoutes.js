import { Router } from "express";
import * as chatbotController from "../controllers/chatbotController.js";
import auth from "../middleware/auth.js";

const router = Router();

// Public Health Check Endpoint: GET /api/v1/chatbot/health
router.get("/health", chatbotController.getHealth);

// Authenticated Chat Message Endpoint: POST /api/v1/chatbot/message
router.post("/message", auth, chatbotController.handleChatMessage);

export default router;
