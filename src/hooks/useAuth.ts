import { useState, useCallback, useEffect } from "react";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
} from "@/lib/crypto";
import * as api from "@/lib/mockApi";

interface User {
  id: string;
  username: string;
  publicKey: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  privateKey: CryptoKey | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    privateKey: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedUser = localStorage.getItem("secure_msg_user");
        const storedToken = localStorage.getItem("secure_msg_token");
        const storedPrivateKey = localStorage.getItem("secure_msg_private_key");

        if (storedUser && storedToken && storedPrivateKey) {
          const user = JSON.parse(storedUser);
          const privateKey = await importPrivateKey(storedPrivateKey);

          setAuthState({
            user,
            token: storedToken,
            privateKey,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        localStorage.removeItem("secure_msg_user");
        localStorage.removeItem("secure_msg_token");
        localStorage.removeItem("secure_msg_private_key");
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, []);

  const register = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Generate RSA key pair
        const keyPair = await generateKeyPair();
        const publicKeyString = await exportPublicKey(keyPair.publicKey);
        const privateKeyString = await exportPrivateKey(keyPair.privateKey);

        // Register with backend
        const response = await api.register(
          username,
          password,
          publicKeyString
        );

        if (!response.success || !response.user || !response.token) {
          return { success: false, error: response.error };
        }

        // Store session
        localStorage.setItem(
          "secure_msg_user",
          JSON.stringify(response.user)
        );
        localStorage.setItem("secure_msg_token", response.token);
        localStorage.setItem("secure_msg_private_key", privateKeyString);

        setAuthState({
          user: response.user,
          token: response.token,
          privateKey: keyPair.privateKey,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        console.error("Registration failed:", error);
        return { success: false, error: "Registration failed" };
      }
    },
    []
  );

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await api.login(username, password);

        if (!response.success || !response.user || !response.token) {
          return { success: false, error: response.error };
        }

        // Check for stored private key
        const storedPrivateKey = localStorage.getItem("secure_msg_private_key");
        if (!storedPrivateKey) {
          return {
            success: false,
            error: "Private key not found. Please register again.",
          };
        }

        const privateKey = await importPrivateKey(storedPrivateKey);

        // Store session
        localStorage.setItem(
          "secure_msg_user",
          JSON.stringify(response.user)
        );
        localStorage.setItem("secure_msg_token", response.token);

        setAuthState({
          user: response.user,
          token: response.token,
          privateKey,
          isAuthenticated: true,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        console.error("Login failed:", error);
        return { success: false, error: "Login failed" };
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("secure_msg_user");
    localStorage.removeItem("secure_msg_token");
    // Note: We keep the private key for future logins
    setAuthState({
      user: null,
      token: null,
      privateKey: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return {
    ...authState,
    register,
    login,
    logout,
  };
}
