import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import trackerRoutes from "./routes/trackerRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import { stripeWebhook } from "./controllers/billingController.js";

const app = express();
fs.mkdirSync(config.uploadDir, { recursive: true });
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  }),
);
// Stripe requires the unparsed request body to verify webhook signatures.
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
const allowedResumeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
function fileFilter(_req, file, cb) {
  if (!allowedResumeTypes.has(file.mimetype))
    return cb(new Error("Upload a PDF, DOC, or DOCX file."));
  cb(null, true);
}
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
const applicationUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadDir),
    filename: (_req, file, cb) => {
      const safe = path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(
        null,
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${safe}`,
      );
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
app.locals.resumeUpload = resumeUpload;
app.locals.applicationUpload = applicationUpload;
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "CareerHub API" }),
);
app.get("/api/health/jobs", (_req, res) =>
  res.json({
    service: "CareerHub Job Providers",
    configured: Boolean(
      (config.adzunaAppId && config.adzunaAppKey) || config.joobleApiKey,
    ),
    providers: {
      adzuna: Boolean(config.adzunaAppId && config.adzunaAppKey),
      jooble: Boolean(config.joobleApiKey),
    },
    adzunaCountry: config.adzunaCountry,
  }),
);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/billing", billingRoutes);
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    return res
      .status(tooLarge ? 413 : 400)
      .json({
        message: tooLarge ? "File must be 5 MB or smaller." : err.message,
      });
  }
  console.error("API error:", err.message || err);
  const status = err.status || 500;
  res
    .status(status)
    .json({
      message:
        status === 500 ? "An unexpected server error occurred." : err.message,
    });
});
try {
  await mongoose.connect(config.mongoUri);
  console.log("MongoDB connected");
  app.listen(config.port, () =>
    console.log(`CareerHub API listening on http://localhost:${config.port}`),
  );
} catch (error) {
  console.error("Unable to connect to MongoDB:", error.message);
  process.exit(1);
}
