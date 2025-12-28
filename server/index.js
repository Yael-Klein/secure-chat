// Load environment variables from .env file (if exists)
import "dotenv/config";

import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import {
  initDatabase,
  createUser,
  getUserByUsername,
  getUserById,
  getUsers,
  updateUser,
  createMessage,
  getMessages,
  getMessagesSince,
  addSession,
  removeSession,
} from "./utils/database.js";
// Note: Server-side crypto functions removed - server only stores encrypted messages
// All encryption/decryption happens on the client side
import { authenticateToken } from "./middleware/auth.js";

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || [
      "http://localhost:5173", // Vite default port
      "https://localhost:5173",
      "http://localhost:8080", // Legacy support
      "https://localhost:8080",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - more lenient for polling endpoints
// More lenient rate limit for polling endpoints (must come first)
const pollingLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax * 3, // Triple for polling endpoints
  message: "Too many requests from this IP, please try again later.",
});

// Strict rate limiting for authentication endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply more lenient rate limiting to polling endpoints first
app.use("/api/messages/poll", pollingLimiter);
app.use("/api/users", pollingLimiter);

// General rate limiting for other API routes
const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMax,
  message: "Too many requests from this IP, please try again later.",
});

// Apply general rate limiting to remaining API routes
app.use("/api/", generalLimiter);

// Request logging
app.use((req, res, next) => {
  // Log all API requests for monitoring
  if (req.path.startsWith("/api/")) {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: req.user?.id || "anonymous",
    });
  }
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Register endpoint (with strict rate limiting)
app.post("/api/register", authLimiter, async (req, res) => {
  try {
    const { username, password, publicKey } = req.body;

    // Validation
    if (!username || !password || !publicKey) {
      return res.status(400).json({
        success: false,
        error: "Username, password, and publicKey are required",
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Username must be at least 3 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    // Check if user exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      logger.warn(`Registration attempt with existing username: ${username}`);
      return res.status(400).json({
        success: false,
        error: "Username already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // Create user
    const user = await createUser({
      username,
      passwordHash,
      publicKey,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiry }
    );

    // Store session
    await addSession({
      token,
      userId: user.id,
      username: user.username,
    });

    logger.info(`User registered: ${username} (${user.id})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      error: "Registration failed",
    });
  }
});

// Login endpoint (with strict rate limiting)
app.post("/api/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    // Get user
    const user = await getUserByUsername(username);
    if (!user) {
      logger.warn(`Login attempt with non-existent username: ${username}`);
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      logger.warn(`Invalid password attempt for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiry }
    );

    // Store session
    await addSession({
      token,
      userId: user.id,
      username: user.username,
    });

    logger.info(`User logged in: ${username} (${user.id})`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

// Logout endpoint
app.post("/api/logout", authenticateToken, async (req, res) => {
  try {
    await removeSession(req.token);
    logger.info(`User logged out: ${req.user.username}`);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({ success: false, error: "Logout failed" });
  }
});

// Get all users (for message encryption)
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await getUsers();
    res.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        publicKey: u.publicKey,
      }))
    );
  } catch (error) {
    logger.error(`Get users error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to get users" });
  }
});

// Get user by ID
app.get("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({
      id: user.id,
      username: user.username,
      publicKey: user.publicKey,
    });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to get user" });
  }
});

// Update user's public key (for users who don't have keys yet)
app.put("/api/users/me/public-key", authenticateToken, async (req, res) => {
  try {
    const { publicKey } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: "publicKey is required",
      });
    }

    const user = await updateUser(req.user.id, { publicKey });
    logger.info(`Updated public key for user: ${req.user.username}`);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
      },
    });
  } catch (error) {
    logger.error(`Update public key error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to update public key" });
  }
});

// Send message endpoint
app.post("/api/messages", authenticateToken, async (req, res) => {
  try {
    const { encryptedContent, encryptedKey, iv, recipientId } = req.body;

    if (!encryptedContent || !encryptedKey || !iv) {
      return res.status(400).json({
        success: false,
        error: "encryptedContent, encryptedKey, and iv are required",
      });
    }

    // Get sender info
    const sender = await getUserById(req.user.id);
    if (!sender) {
      return res.status(404).json({
        success: false,
        error: "Sender not found",
      });
    }

    // Store encrypted message (encrypted at rest)
    const message = await createMessage({
      senderId: req.user.id,
      senderUsername: req.user.username,
      recipientId: recipientId || null, // null = broadcast to all
      encryptedContent,
      encryptedKey,
      iv,
    });

    logger.info(`Message sent by ${req.user.username} (${message.id})`);

    res.json({
      success: true,
      messageId: message.id,
    });
  } catch (error) {
    logger.error(`Send message error: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
});

// Get message history
app.get("/api/messages", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await getMessages(limit);
    res.json(messages);
  } catch (error) {
    logger.error(`Get messages error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to get messages" });
  }
});

// Long polling for new messages
app.get("/api/messages/poll", authenticateToken, async (req, res) => {
  try {
    const since = req.query.since || "0";
    const startTime = Date.now();

    // Long polling: wait for new messages or timeout
    const checkForMessages = async () => {
      const messages = await getMessagesSince(since);
      if (messages.length > 0) {
        return messages;
      }

      // Check if timeout reached
      if (Date.now() - startTime >= config.maxPollingTime) {
        return [];
      }

      // Wait a bit and check again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return checkForMessages();
    };

    const newMessages = await checkForMessages();
    res.json(newMessages);
  } catch (error) {
    logger.error(`Poll messages error: ${error.message}`);
    res.status(500).json({ success: false, error: "Failed to poll messages" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    logger.info("Database initialized");

    // Check if HTTPS is enabled
    if (config.httpsEnabled) {
      try {
        // Try to load SSL certificates
        const httpsOptions = {
          key: fs.readFileSync(config.httpsKeyPath),
          cert: fs.readFileSync(config.httpsCertPath),
        };

        https.createServer(httpsOptions, app).listen(config.port, () => {
          logger.info(`🔒 HTTPS Server running on port ${config.port}`);
          logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
          logger.info(`SSL certificates loaded from ${config.httpsKeyPath} and ${config.httpsCertPath}`);
        });
      } catch (error) {
        logger.error(`Failed to load SSL certificates: ${error.message}`);
        logger.warn("Falling back to HTTP. Set HTTPS_ENABLED=false or provide valid certificates.");
        // Fall back to HTTP
        http.createServer(app).listen(config.port, () => {
          logger.info(`⚠️  HTTP Server running on port ${config.port} (HTTPS failed)`);
          logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
        });
      }
    } else {
      // HTTP mode (development)
      http.createServer(app).listen(config.port, () => {
        logger.info(`🌐 HTTP Server running on port ${config.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
        if (process.env.NODE_ENV === "production") {
          logger.warn("⚠️  WARNING: Running in HTTP mode in production! Set HTTPS_ENABLED=true for security.");
        }
      });
    }
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`, {
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();

