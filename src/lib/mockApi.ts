// Mock API for development - Replace with your actual Node.js backend
// This simulates the backend behavior for testing the frontend

interface User {
  id: string;
  username: string;
  publicKey: string;
  createdAt: Date;
}

interface EncryptedMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  timestamp: Date;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Simulated storage
const users: Map<string, { user: User; passwordHash: string }> = new Map();
const messages: EncryptedMessage[] = [];
let messageIdCounter = 1;

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate mock token
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Register a new user
export async function register(
  username: string,
  password: string,
  publicKey: string
): Promise<AuthResponse> {
  await delay(500);

  if (users.has(username)) {
    return { success: false, error: "Username already exists" };
  }

  if (username.length < 3) {
    return { success: false, error: "Username must be at least 3 characters" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const user: User = {
    id: crypto.randomUUID(),
    username,
    publicKey,
    createdAt: new Date(),
  };

  // In a real backend, password would be hashed with bcrypt/Argon2
  users.set(username, { user, passwordHash: password });

  console.log(`[MOCK API] User registered: ${username}`);

  return {
    success: true,
    token: generateToken(),
    user,
  };
}

// Login
export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  await delay(500);

  const userData = users.get(username);

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  // In a real backend, compare with bcrypt
  if (userData.passwordHash !== password) {
    return { success: false, error: "Invalid password" };
  }

  console.log(`[MOCK API] User logged in: ${username}`);

  return {
    success: true,
    token: generateToken(),
    user: userData.user,
  };
}

// Get all users (for encrypting messages to all recipients)
export async function getUsers(): Promise<User[]> {
  await delay(200);
  return Array.from(users.values()).map((u) => u.user);
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  await delay(100);
  for (const userData of users.values()) {
    if (userData.user.id === userId) {
      return userData.user;
    }
  }
  return null;
}

// Send encrypted message (broadcast to all users)
export async function sendMessage(message: {
  senderId: string;
  senderUsername: string;
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
}): Promise<{ success: boolean; messageId: string }> {
  await delay(300);

  const newMessage: EncryptedMessage = {
    id: String(messageIdCounter++),
    ...message,
    timestamp: new Date(),
  };

  messages.push(newMessage);

  console.log(`[MOCK API] Message sent by ${message.senderUsername}`);

  return { success: true, messageId: newMessage.id };
}

// Long polling for new messages (simulates real-time without WebSockets)
let lastPolledIndex = 0;

export async function pollMessages(
  since?: string
): Promise<EncryptedMessage[]> {
  await delay(1000); // Simulate long polling delay

  const sinceIndex = since ? parseInt(since) : 0;
  const newMessages = messages.filter((m) => parseInt(m.id) > sinceIndex);

  return newMessages;
}

// Get message history
export async function getMessageHistory(
  limit: number = 50
): Promise<EncryptedMessage[]> {
  await delay(300);
  return messages.slice(-limit);
}

// Verify token (mock)
export async function verifyToken(token: string): Promise<boolean> {
  await delay(100);
  return token.length === 64; // Simple mock validation
}

// Add some mock users for testing
export function seedMockData() {
  // These would be added through the register flow in real usage
  console.log("[MOCK API] Mock data seeded");
}
