import { useState, useCallback, useEffect, useRef } from "react";
import {
  generateAESKey,
  encryptMessage,
  decryptMessage,
  encryptAESKey,
  decryptAESKey,
  importPublicKey,
} from "@/lib/crypto";
import * as api from "@/lib/api";

// Cache for public keys to avoid re-importing them every time
const publicKeyCache = new Map<string, CryptoKey>();

// Get cached public key or import and cache it
async function getCachedPublicKey(userId: string, publicKeyString: string): Promise<CryptoKey> {
  if (publicKeyCache.has(userId)) {
    return publicKeyCache.get(userId)!;
  }
  
  const key = await importPublicKey(publicKeyString);
  publicKeyCache.set(userId, key);
  return key;
}

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
  recipientId?: string | null; // null = broadcast
  encryptedContent: string;
  encryptedKey: string;
  iv: string;
  timestamp: string | Date;
}

export function useMessages(
  userId: string | undefined,
  privateKey: CryptoKey | null,
  recipientId: string | null = null // null = broadcast to all
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
          // Filter messages: if recipientId is set, only show messages between current user and recipient
          if (recipientId) {
            // Show messages FROM recipient TO current user
            const isFromRecipientToMe = msg.senderId === recipientId && msg.recipientId === userId;
            // Show messages FROM current user TO recipient
            const isFromMeToRecipient = msg.senderId === userId && msg.recipientId === recipientId;
            // Show messages FROM current user encrypted for themselves (sent messages)
            const isMySentMessage = msg.senderId === userId && msg.recipientId === userId;
            // Also show broadcast messages from recipient (for backward compatibility)
            const isBroadcastFromRecipient = msg.senderId === recipientId && !msg.recipientId;
            
            if (isFromRecipientToMe || isFromMeToRecipient || isMySentMessage || isBroadcastFromRecipient) {
              decrypted.push(decryptedMsg);
            }
          } else {
            // Broadcast mode: show all messages
            decrypted.push(decryptedMsg);
          }
        }
      }

      // Remove duplicates and sort by timestamp
      const uniqueMessages = Array.from(
        new Map(decrypted.map((msg) => [msg.id, msg])).values()
      ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(uniqueMessages);
      if (encryptedMessages.length > 0) {
        lastMessageId.current =
          encryptedMessages[encryptedMessages.length - 1].id;
      }
    } catch (error) {
      console.error("Failed to load message history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [privateKey, userId, recipientId, decryptSingleMessage]);

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
            // Filter messages: if recipientId is set, only show messages between current user and recipient
            if (recipientId) {
              // Show messages FROM recipient TO current user
              const isFromRecipientToMe = msg.senderId === recipientId && msg.recipientId === userId;
              // Show messages FROM current user TO recipient
              const isFromMeToRecipient = msg.senderId === userId && msg.recipientId === recipientId;
              // Show messages FROM current user encrypted for themselves (sent messages)
              const isMySentMessage = msg.senderId === userId && msg.recipientId === userId;
              // Also show broadcast messages from recipient (for backward compatibility)
              const isBroadcastFromRecipient = msg.senderId === recipientId && !msg.recipientId;
              
              if (isFromRecipientToMe || isFromMeToRecipient || isMySentMessage || isBroadcastFromRecipient) {
                decrypted.push(decryptedMsg);
              }
            } else {
              // Broadcast mode: show all messages
              decrypted.push(decryptedMsg);
            }
          }
        }

        if (decrypted.length > 0) {
          setMessages((prev) => {
            // Combine and remove duplicates, then sort
            const combined = [...prev, ...decrypted];
            const unique = Array.from(
              new Map(combined.map((msg) => [msg.id, msg])).values()
            ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            return unique;
          });
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

      // Start long polling (every 5 seconds)
      const poll = async () => {
        await pollForMessages();
        pollingRef.current = window.setTimeout(poll, 5000);
      };

      pollingRef.current = window.setTimeout(poll, 5000);

      return () => {
        if (pollingRef.current) {
          clearTimeout(pollingRef.current);
        }
      };
    }
  }, [privateKey, userId, recipientId, loadHistory, pollForMessages]);

  // Send encrypted message
  const sendEncryptedMessage = useCallback(
    async (
      content: string,
      senderUsername: string,
      targetRecipientId?: string | null
    ): Promise<{ success: boolean; error?: string }> => {
      if (!userId || !privateKey) {
        return { success: false, error: "Not authenticated" };
      }

      setIsSending(true);
      try {
        const users = await api.getUsers();
        const aesKey = await generateAESKey();
        const { ciphertext, iv } = await encryptMessage(content, aesKey);

        if (targetRecipientId) {
          // Direct message: send two copies - one for recipient, one for sender
          const recipient = users.find((u) => u.id === targetRecipientId);
          const sender = users.find((u) => u.id === userId);
          
          if (!recipient || !sender) {
            return { success: false, error: "User not found" };
          }

          // Encrypt for recipient (using cached public key)
          const recipientPublicKey = await getCachedPublicKey(recipient.id, recipient.publicKey);
          const encryptedKeyForRecipient = await encryptAESKey(aesKey, recipientPublicKey);

          // Send message for recipient
          const result1 = await api.sendMessage({
            senderId: userId,
            senderUsername,
            recipientId: targetRecipientId,
            encryptedContent: ciphertext,
            encryptedKey: encryptedKeyForRecipient,
            iv,
          });

          // Encrypt for sender (so sender can see their own message, using cached public key)
          const senderPublicKey = await getCachedPublicKey(sender.id, sender.publicKey);
          const encryptedKeyForSender = await encryptAESKey(aesKey, senderPublicKey);

          // Send message for sender
          const result2 = await api.sendMessage({
            senderId: userId,
            senderUsername,
            recipientId: userId, // Encrypted for sender
            encryptedContent: ciphertext,
            encryptedKey: encryptedKeyForSender,
            iv,
          });

          return { success: result1.success && result2.success };
        } else {
          // Broadcast: encrypt for ALL users so everyone can decrypt
          const sender = users.find((u) => u.id === userId);
          if (!sender) {
            return { success: false, error: "User not found" };
          }

          // Send message encrypted for each user (broadcast to all, using cached public keys)
          const sendPromises = users.map(async (user) => {
            try {
              const userPublicKey = await getCachedPublicKey(user.id, user.publicKey);
              const encryptedKeyForUser = await encryptAESKey(aesKey, userPublicKey);

              return api.sendMessage({
                senderId: userId,
                senderUsername,
                recipientId: null, // Broadcast
                encryptedContent: ciphertext,
                encryptedKey: encryptedKeyForUser,
                iv,
              });
            } catch (error) {
              console.error(`Failed to encrypt for user ${user.username}:`, error);
              return { success: false, messageId: "" };
            }
          });

          const results = await Promise.all(sendPromises);
          const allSuccess = results.every((r) => r.success);
          
          return { success: allSuccess };
        }
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
