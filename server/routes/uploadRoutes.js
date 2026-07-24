import { Router } from "express";
import * as uploadController from "../controllers/uploadController.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

// Public / Authenticated File Proxy Endpoint (for cross-origin PDF viewing & downloading)
router.get("/proxy", uploadController.proxyFile);

// Protect upload modification routes with auth middleware
router.use(auth);

// Handle single file upload in request field named "file"
router.post("/", upload.single("file"), uploadController.uploadFile);

export default router;
