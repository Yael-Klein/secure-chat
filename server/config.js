// Server configuration
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if certificates exist
const defaultKeyPath = path.join(__dirname, "certs", "key.pem");
const defaultCertPath = path.join(__dirname, "certs", "cert.pem");
const keyPath = process.env.HTTPS_KEY_PATH || defaultKeyPath;
const certPath = process.env.HTTPS_CERT_PATH || defaultCertPath;

const certsExist = fs.existsSync(keyPath) && fs.existsSync(certPath);

export const config = {
  port: process.env.PORT || 3001,
  // JWT Secret - must be set in production via environment variable
  jwtSecret: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production environment");
    }
    // Only allow default in development
    console.warn("⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!");
    return "your-secret-key-change-in-production";
  })(),
  jwtExpiry: "7d",
  bcryptRounds: 10,
  databasePath: "./database.json",
  maxPollingTime: 30000, // 30 seconds for long polling
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 1000, // requests per window (increased for polling)
  logLevel: process.env.LOG_LEVEL || "info",
  // HTTPS/TLS configuration
  // Only enable HTTPS if explicitly set to "true" (don't auto-enable)
  httpsEnabled: process.env.HTTPS_ENABLED === "true",
  httpsKeyPath: keyPath,
  httpsCertPath: certPath,
};

