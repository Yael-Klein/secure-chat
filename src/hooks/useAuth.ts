import { useState, useCallback, useEffect } from "react";
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
} from "@/lib/crypto";
import * as api from "@/lib/api";
import {
  storePrivateKey,
  getPrivateKey,
  removePrivateKey,
  clearAllPrivateKeys,
} from "@/lib/storage";

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

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          // Try to get private key from IndexedDB (secure storage)
          const storedPrivateKey = await getPrivateKey(user.id);
          
          // Fallback: check localStorage for migration (remove after migration)
          const legacyPrivateKey = localStorage.getItem("secure_msg_private_key");
          const privateKeyString = storedPrivateKey || legacyPrivateKey;

          if (privateKeyString) {
            const privateKey = await importPrivateKey(privateKeyString);
            
            // Migrate from localStorage to IndexedDB if needed
            if (legacyPrivateKey && !storedPrivateKey) {
              await storePrivateKey(user.id, legacyPrivateKey);
              localStorage.removeItem("secure_msg_private_key");
            }

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
        } else {
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        localStorage.removeItem("secure_msg_user");
        localStorage.removeItem("secure_msg_token");
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
        
        // Store private key securely in IndexedDB
        await storePrivateKey(response.user.id, privateKeyString);

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

        // Store token first so it's available for authenticated requests
        localStorage.setItem("secure_msg_token", response.token);
        localStorage.setItem(
          "secure_msg_user",
          JSON.stringify(response.user)
        );

        // Check for stored private key in IndexedDB (secure storage)
        let storedPrivateKey = await getPrivateKey(response.user.id);
        
        // Fallback: check localStorage for migration (remove after migration)
        if (!storedPrivateKey) {
          const legacyPrivateKey = localStorage.getItem("secure_msg_private_key");
          if (legacyPrivateKey) {
            storedPrivateKey = legacyPrivateKey;
            // Migrate to IndexedDB
            await storePrivateKey(response.user.id, legacyPrivateKey);
            localStorage.removeItem("secure_msg_private_key");
          }
        }
        
        let privateKey: CryptoKey;
        
        if (!storedPrivateKey) {
          console.log("storedPrivateKey not found - generating new key pair");
          // Generate new key pair for users who don't have one (e.g., seeded users)
          const keyPair = await generateKeyPair();
          const publicKeyString = await exportPublicKey(keyPair.publicKey);
          const privateKeyString = await exportPrivateKey(keyPair.privateKey);
          
          // Update the server with the new public key (token is now in localStorage)
          const updateResponse = await api.updatePublicKey(publicKeyString);
          if (!updateResponse.success || !updateResponse.user) {
            console.error("Failed to update public key on server");
            return {
              success: false,
              error: "Failed to generate keys. Please try again.",
            };
          }
          
          // Update the user object with the new public key
          response.user = updateResponse.user;
          // Update stored user with new public key
          localStorage.setItem(
            "secure_msg_user",
            JSON.stringify(response.user)
          );
          
          // Store the new private key securely in IndexedDB
          await storePrivateKey(response.user.id, privateKeyString);
          privateKey = keyPair.privateKey;
          console.log("Generated and stored new key pair");
        } else {
          console.log("storedPrivateKey found");
          privateKey = await importPrivateKey(storedPrivateKey);
          console.log("privateKey loaded from secure storage");
        }
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
    const userId = authState.user?.id;
    
    localStorage.removeItem("secure_msg_user");
    localStorage.removeItem("secure_msg_token");
    
    // Optionally remove private key from IndexedDB (user choice)
    // For now, we keep it for future logins, but you can uncomment to clear:
    // if (userId) {
    //   removePrivateKey(userId).catch(console.error);
    // }
    
    setAuthState({
      user: null,
      token: null,
      privateKey: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, [authState.user?.id]);

  return {
    ...authState,
    register,
    login,
    logout,
  };
}
