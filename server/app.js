import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// Trivial change to force nodemon reload

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import gemstoneRoutes from "./routes/gemstoneRoutes.js";
import lotRoutes from "./routes/lotRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import movementRoutes from "./routes/movementRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import jobCardRoutes from "./routes/jobCardRoutes.js";
import costingRoutes from "./routes/costingRoutes.js";
import memoRoutes from "./routes/memoRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import purchaseInvoiceRoutes from "./routes/purchaseInvoiceRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import ApiError from "./utils/ApiError.js";

// NOTE: mount additional route files from server/routes/ here as they're
// implemented, e.g.:
// import userRoutes from "./routes/userRoutes.js";
// app.use("/api/v1/users", userRoutes);
// See Section 6 (REST API Endpoints) of SR_TAKAT_Prompt.md for the full list.

const app = express();

// CORS configuration:
// - In production, only allow the configured client URL(s) to send credentials.
// - In development, allow any origin to ease local testing.
const clientUrls = [process.env.CLIENT_URL, process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`]
  .filter(Boolean)
  .concat((process.env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === "production") {
        const allowed =
          !origin ||
          clientUrls.includes(origin) ||
          origin.endsWith(".vercel.app") ||
          origin.endsWith(".vercel.app/");
        return callback(null, allowed);
      }
      // Development: allow any origin (useful for localhost and preview URLs)
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", service: "sr-takat-api" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/settings", settingRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/gemstones", gemstoneRoutes);
app.use("/api/v1/lots", lotRoutes);
app.use("/api/v1/materials", materialRoutes);
app.use("/api/v1/certificates", certificateRoutes);
app.use("/api/v1/movements", movementRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/job-cards", jobCardRoutes);
app.use("/api/v1/costing", costingRoutes);
app.use("/api/v1/memos", memoRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/audit", auditLogRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/incomes", incomeRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/v1/purchase-invoices", purchaseInvoiceRoutes);
app.use("/api/purchase-invoices", purchaseInvoiceRoutes);
app.use("/api/v1/chatbot", chatbotRoutes);
app.use("/api/chatbot", chatbotRoutes);

// 404 handler for unmatched API routes
app.use("/api", (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// centralized error handler — must be registered last
app.use(errorHandler);

export default app;
