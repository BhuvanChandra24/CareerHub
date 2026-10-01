
import "dotenv/config";

function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getBoolean(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase() === "true"
  );
}

// Default deployed frontend origin.
const defaultClientOrigins = [
  "https://career-hub-sooty-eta.vercel.app",
];

// Read additional origins from environment variables.
const configuredClientOrigins = [
  process.env.CLIENT_ORIGINS || "",
  process.env.CLIENT_ORIGIN || "",
]
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// Combine origins without duplicates.
const clientOrigins = [
  ...new Set([
    ...defaultClientOrigins,
    ...configuredClientOrigins,
  ]),
];

export const config = {
  // Server configuration.
  port: getNumber(process.env.PORT, 5000),

  // MongoDB configuration.
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/careerhub",

  // JWT authentication.
  jwtSecret: process.env.JWT_SECRET || "",

  // CORS allowed frontend origins.
  clientOrigins,

  // File uploads.
  uploadDir: process.env.UPLOAD_DIR || "uploads",

  // Adzuna job provider credentials.
  adzunaAppId: process.env.ADZUNA_APP_ID?.trim() || "",
  adzunaAppKey: process.env.ADZUNA_APP_KEY?.trim() || "",
  adzunaCountry: (
    process.env.ADZUNA_COUNTRY || "in"
  )
    .trim()
    .toLowerCase(),

  // Jooble job provider credentials.
  joobleApiKey: process.env.JOOBLE_API_KEY?.trim() || "",

  // Enable mock jobs only when explicitly configured.
  mockJobsEnabled: getBoolean(
    process.env.MOCK_JOBS_ENABLED
  ),
};

// Validate JWT configuration.
if (!config.jwtSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET must be configured in production."
    );
  }

  console.warn(
    "WARNING: JWT_SECRET is not configured. Add a strong secret to your .env file."
  );
}

if (
  process.env.NODE_ENV === "production" &&
  config.jwtSecret.length < 32
) {
  throw new Error(
    "JWT_SECRET must contain at least 32 characters in production."
  );
}

// Warn if job provider credentials are missing.
if (!config.adzunaAppId && !config.joobleApiKey) {
  console.warn(
    "WARNING: No job provider credentials found. Configure Adzuna or Jooble in .env."
  );
}
