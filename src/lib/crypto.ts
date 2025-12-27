// Cryptographic utilities for secure messaging
// Uses Web Crypto API for all cryptographic operations

// Generate RSA key pair for asymmetric encryption
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export public key to base64 string for transmission
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

// Import public key from base64 string
export async function importPublicKey(keyData: string): Promise<CryptoKey> {
  const binaryKey = base64ToArrayBuffer(keyData);
  return await crypto.subtle.importKey(
    "spki",
    binaryKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Export private key to base64 (for local storage)
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

// Import private key from base64
export async function importPrivateKey(keyData: string): Promise<CryptoKey> {
  const binaryKey = base64ToArrayBuffer(keyData);
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

// Generate AES key for symmetric encryption
export async function generateAESKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export AES key to raw bytes
export async function exportAESKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey("raw", key);
}

// Import AES key from raw bytes
export async function importAESKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt message with AES-GCM
export async function encryptMessage(
  message: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

// Decrypt message with AES-GCM
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const encrypted = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Encrypt AES key with RSA public key
export async function encryptAESKey(
  aesKey: CryptoKey,
  publicKey: CryptoKey
): Promise<string> {
  const rawKey = await exportAESKey(aesKey);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    rawKey
  );
  return arrayBufferToBase64(encrypted);
}

// Decrypt AES key with RSA private key
export async function decryptAESKey(
  encryptedKey: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  const encrypted = base64ToArrayBuffer(encryptedKey);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encrypted
  );
  return await importAESKey(decrypted);
}

// Hash password with PBKDF2 (for key derivation, not storage)
export async function hashPassword(
  password: string,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  return await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// Generate a fingerprint of a public key for verification
export async function getKeyFingerprint(publicKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(publicKey);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":")
    .toUpperCase();
}
