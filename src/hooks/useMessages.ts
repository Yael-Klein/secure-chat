import { useState, useCallback, useEffect, useRef } from "react";
import {
  generateAESKey,
  encryptMessage,
  decryptMessage,
  encryptAESKey,
  decryptAESKey,
  importPublicKey,
} from "@/lib/crypto";
import * as api from "@/lib/mockApi";

interface DecryptedMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
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

export function useMessages(
  userId: string | undefined,
  privateKey: CryptoKey | null
) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const lastMessageId = useRef<string>("0");
  const pollingRef = useRef<number | null>(null);

  // Decrypt a single message
  const decryptSingleMessage = useCallback(
    async (
      msg: EncryptedMessage,
      privKey: CryptoKey
    ): Promise<DecryptedMessage | null> => {
      try {
        const aesKey = await decryptAESKey(msg.encryptedKey, privKey);
        const content = await decryptMessage(
          msg.encryptedContent,
          msg.iv,
          aesKey
        );

        return {
          id: msg.id,
          senderId: msg.senderId,
          senderUsername: msg.senderUsername,
          content,
          timestamp: new Date(msg.timestamp),
          isOwn: msg.senderId === userId,
        };
      } catch (error) {
        console.error("Failed to decrypt message:", error);
        return null;
      }
    },
    [userId]
  );

  // Load message history
  const loadHistory = useCallback(async () => {
    if (!privateKey || !userId) return;

    setIsLoading(true);
    try {
      const encryptedMessages = await api.getMessageHistory(50);
      const decrypted: DecryptedMessage[] = [];

      for (const msg of encryptedMessages) {
        const decryptedMsg = await decryptSingleMessage(msg, privateKey);
        if (decryptedMsg) {
          decrypted.push(decryptedMsg);
        }
      }

      setMessages(decrypted);
      if (encryptedMessages.length > 0) {
        lastMessageId.current =
          encryptedMessages[encryptedMessages.length - 1].id;
      }
    } catch (error) {
      console.error("Failed to load message history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [privateKey, userId, decryptSingleMessage]);

  // Poll for new messages
  const pollForMessages = useCallback(async () => {
    if (!privateKey || !userId) return;

    try {
      const newMessages = await api.pollMessages(lastMessageId.current);

      if (newMessages.length > 0) {
        const decrypted: DecryptedMessage[] = [];

        for (const msg of newMessages) {
          const decryptedMsg = await decryptSingleMessage(msg, privateKey);
          if (decryptedMsg) {
            decrypted.push(decryptedMsg);
          }
        }

        if (decrypted.length > 0) {
          setMessages((prev) => [...prev, ...decrypted]);
          lastMessageId.current = newMessages[newMessages.length - 1].id;
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, [privateKey, userId, decryptSingleMessage]);

  // Start polling when authenticated
  useEffect(() => {
    if (privateKey && userId) {
      loadHistory();

      // Start long polling
      const poll = async () => {
        await pollForMessages();
        pollingRef.current = window.setTimeout(poll, 2000);
      };

      pollingRef.current = window.setTimeout(poll, 2000);

      return () => {
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
        }
      };
    }
  }, [privateKey, userId, loadHistory, pollForMessages]);

  // Send encrypted message
  const sendEncryptedMessage = useCallback(
    async (
      content: string,
      senderUsername: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!userId || !privateKey) {
        return { success: false, error: "Not authenticated" };
      }

      setIsSending(true);
      try {
        // Get all users to encrypt for (in a real app, you'd encrypt per-recipient)
        const users = await api.getUsers();

        // For demo, we encrypt with a shared key approach
        // In production, you'd encrypt the AES key for each recipient's public key
        const aesKey = await generateAESKey();
        const { ciphertext, iv } = await encryptMessage(content, aesKey);

        // For demo, encrypt AES key with sender's own public key
        // In production: encrypt for each recipient
        const currentUser = users.find((u) => u.id === userId);
        if (!currentUser) {
          return { success: false, error: "User not found" };
        }

        const recipientPublicKey = await importPublicKey(currentUser.publicKey);
        const encryptedKey = await encryptAESKey(aesKey, recipientPublicKey);

        const result = await api.sendMessage({
          senderId: userId,
          senderUsername,
          encryptedContent: ciphertext,
          encryptedKey,
          iv,
        });

        return { success: result.success };
      } catch (error) {
        console.error("Failed to send message:", error);
        return { success: false, error: "Failed to send message" };
      } finally {
        setIsSending(false);
      }
    },
    [userId, privateKey]
  );

  return {
    messages,
    isLoading,
    isSending,
    sendMessage: sendEncryptedMessage,
    refresh: loadHistory,
  };
}
