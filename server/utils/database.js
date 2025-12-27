import fs from "fs/promises";
import { config } from "../config.js";

/**
 * Database utilities for JSON file-based storage
 */

let dbCache = null;

/**
 * Load database from file
 */
async function loadDatabase() {
  try {
    const data = await fs.readFile(config.databasePath, "utf-8");
    dbCache = JSON.parse(data);
    return dbCache;
  } catch (error) {
    // If file doesn't exist, create it
    if (error.code === "ENOENT") {
      dbCache = {
        users: [],
        messages: [],
        sessions: [],
      };
      await saveDatabase();
      return dbCache;
    }
    throw error;
  }
}

/**
 * Save database to file
 */
async function saveDatabase() {
  if (!dbCache) {
    await loadDatabase();
  }
  await fs.writeFile(
    config.databasePath,
    JSON.stringify(dbCache, null, 2),
    "utf-8"
  );
}

/**
 * Initialize database
 */
export async function initDatabase() {
  await loadDatabase();
}

/**
 * Get all users
 */
export async function getUsers() {
  await loadDatabase(); // Always reload to get latest data
  return dbCache.users;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username) {
  await loadDatabase(); // Always reload to get latest data
  return dbCache.users.find((u) => u.username === username);
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  await loadDatabase(); // Always reload to get latest data
  return dbCache.users.find((u) => u.id === userId);
}

/**
 * Create new user
 */
export async function createUser(userData) {
  if (!dbCache) await loadDatabase();
  const user = {
    id: crypto.randomUUID(),
    ...userData,
    createdAt: new Date().toISOString(),
  };
  dbCache.users.push(user);
  await saveDatabase();
  return user;
}

/**
 * Update user
 */
export async function updateUser(userId, updates) {
  if (!dbCache) await loadDatabase();
  const userIndex = dbCache.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error("User not found");
  }
  dbCache.users[userIndex] = { ...dbCache.users[userIndex], ...updates };
  await saveDatabase();
  return dbCache.users[userIndex];
}

/**
 * Get all messages
 */
export async function getMessages(limit = null) {
  await loadDatabase(); // Always reload to get latest data
  const messages = dbCache.messages;
  if (limit) {
    return messages.slice(-limit);
  }
  return messages;
}

/**
 * Get messages since a specific ID
 */
export async function getMessagesSince(messageId) {
  await loadDatabase(); // Always reload to get latest data
  const idNum = parseInt(messageId) || 0;
  return dbCache.messages.filter((m) => parseInt(m.id) > idNum);
}

/**
 * Create new message
 */
export async function createMessage(messageData) {
  if (!dbCache) await loadDatabase();
  const message = {
    id: String(dbCache.messages.length + 1),
    ...messageData,
    timestamp: new Date().toISOString(),
  };
  dbCache.messages.push(message);
  await saveDatabase();
  return message;
}

/**
 * Add session
 */
export async function addSession(sessionData) {
  if (!dbCache) await loadDatabase();
  const session = {
    ...sessionData,
    createdAt: new Date().toISOString(),
  };
  dbCache.sessions.push(session);
  await saveDatabase();
  return session;
}

/**
 * Remove session
 */
export async function removeSession(token) {
  if (!dbCache) await loadDatabase();
  dbCache.sessions = dbCache.sessions.filter((s) => s.token !== token);
  await saveDatabase();
}

/**
 * Get session
 */
export async function getSession(token) {
  await loadDatabase(); // Always reload to get latest data
  return dbCache.sessions.find((s) => s.token === token);
}

