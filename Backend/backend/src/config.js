
import "dotenv/config";

function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getBoolean(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

const clientOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: getNumber(process.env.PORT, 5000),

  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/careerhub",

  jwtSecret: process.env.JWT_SECRET || "",

  clientOrigins,

  uploadDir: process.env.UPLOAD_DIR || "uploads",

  // Adzuna credentials
  adzunaAppId: process.env.ADZUNA_APP_ID?.trim() || "",
  adzunaAppKey: process.env.ADZUNA_APP_KEY?.trim() || "",
  adzunaCountry: (
    process.env.ADZUNA_COUNTRY || "in"
  ).trim().toLowerCase(),

  // Jooble credentials
  joobleApiKey: process.env.JOOBLE_API_KEY?.trim() || "",

  // Optional: enable only when intentionally requested
  mockJobsEnabled: getBoolean(process.env.MOCK_JOBS_ENABLED),
};

if (!config.jwtSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  console.warn(
    "WARNING: JWT_SECRET is not configured. Add a strong secret to your .env file."
  );
}

if (process.env.NODE_ENV === "production" && config.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters in production.");
}

if (!config.adzunaAppId && !config.joobleApiKey) {
  console.warn(
    "WARNING: No job provider credentials found. Configure Adzuna or Jooble in .env."
  );
}