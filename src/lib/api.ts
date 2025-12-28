// Real API client for connecting to Node.js backend

// Read API URL from environment variable (from .env file)
// Default to HTTPS if not specified
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:3001/api";

interface User {
  id: string;
  username: string;
  publicKey: string;
  createdAt?: Date;
}

interface EncryptedMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  recipientId?: string | null; // null = broadcast
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  timestamp: string | Date;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Get stored token from localStorage
function getToken(): string | null {
  return localStorage.getItem("secure_msg_token");
}

// Make authenticated API request
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Register a new user
export async function register(
  username: string,
  password: string,
  publicKey: string
): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthResponse>("/register", {
      method: "POST",
      body: JSON.stringify({ username, password, publicKey }),
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

// Login
export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

// Logout
export async function logout(): Promise<{ success: boolean }> {
  try {
    return await apiRequest<{ success: boolean }>("/logout", {
      method: "POST",
    });
  } catch (error) {
    return { success: false };
  }
}

// Get all users (for encrypting messages to all recipients)
export async function getUsers(): Promise<User[]> {
  try {
    return await apiRequest<User[]>("/users");
  } catch (error) {
    console.error("Failed to get users:", error);
    return [];
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    return await apiRequest<User>(`/users/${userId}`);
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

// Send encrypted message (broadcast to all users or to specific recipient)
export async function sendMessage(message: {
  senderId: string;
  senderUsername: string;
  recipientId?: string | null; // null = broadcast
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
}): Promise<{ success: boolean; messageId: string }> {
  try {
    return await apiRequest<{ success: boolean; messageId: string }>("/messages", {
      method: "POST",
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, messageId: "" };
  }
}

// Long polling for new messages (simulates real-time without WebSockets)
export async function pollMessages(
  since?: string
): Promise<EncryptedMessage[]> {
  try {
    const query = since ? `?since=${since}` : "";
    return await apiRequest<EncryptedMessage[]>(`/messages/poll${query}`);
  } catch (error) {
    console.error("Failed to poll messages:", error);
    return [];
  }
}

// Get message history
export async function getMessageHistory(
  limit: number = 50
): Promise<EncryptedMessage[]> {
  try {
    return await apiRequest<EncryptedMessage[]>(`/messages?limit=${limit}`);
  } catch (error) {
    console.error("Failed to get message history:", error);
    return [];
  }
}

// Update user's public key
export async function updatePublicKey(publicKey: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    return await apiRequest<{ success: boolean; user: User }>("/users/me/public-key", {
      method: "PUT",
      body: JSON.stringify({ publicKey }),
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update public key",
    };
  }
}

// Verify token
export async function verifyToken(token: string): Promise<boolean> {
  try {
    // Try to get users endpoint as a token verification
    await apiRequest<User[]>("/users");
    return true;
  } catch (error) {
    return false;
  }
}

