import forge from "node-forge";

/**
 * Server-side cryptographic utilities
 * Uses node-forge for RSA encryption/decryption
 */

/**
 * Generate RSA key pair
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export async function generateKeyPair() {
  return new Promise((resolve, reject) => {
    try {
      const keypair = forge.pki.rsa.generateKeyPair(2048);
      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
      
      resolve({
        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Convert base64 SPKI (from Web Crypto API) to PEM format
 * @param {string} base64Spki - Base64 encoded SPKI key
 * @returns {string} PEM formatted key
 */
function base64SpkiToPEM(base64Spki) {
  try {
    const der = forge.util.decode64(base64Spki);
    const asn1 = forge.asn1.fromDer(der);
    const publicKey = forge.pki.publicKeyFromAsn1(asn1);
    return forge.pki.publicKeyToPem(publicKey);
  } catch (error) {
    // If direct conversion fails, try wrapping in SPKI structure
    const der = forge.util.decode64(base64Spki);
    // Create SPKI structure manually if needed
    throw new Error(`SPKI conversion failed: ${error.message}`);
  }
}

/**
 * Encrypt data with RSA public key
 * Accepts both PEM and base64 SPKI format (from Web Crypto API)
 * @param {string} data - Data to encrypt
 * @param {string} publicKey - Public key in PEM or base64 SPKI format
 * @returns {string} Base64 encoded encrypted data
 */
export function encryptWithPublicKey(data, publicKey) {
  try {
    let publicKeyObj;
    
    // If it's base64 (no PEM headers), convert from SPKI to PEM
    if (!publicKey.includes("BEGIN")) {
      try {
        // Try to convert base64 SPKI to PEM
        const publicKeyPem = base64SpkiToPEM(publicKey);
        publicKeyObj = forge.pki.publicKeyFromPem(publicKeyPem);
      } catch (error) {
        // If conversion fails, try wrapping in PEM format (might work for some formats)
        try {
          publicKeyObj = forge.pki.publicKeyFromPem(
            `-----BEGIN PUBLIC KEY-----\n${publicKey.match(/.{1,64}/g).join("\n")}\n-----END PUBLIC KEY-----`
          );
        } catch (e) {
          throw new Error(`Failed to parse public key: ${error.message}`);
        }
      }
    } else {
      // Already in PEM format
      publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
    }
    
    const encrypted = publicKeyObj.encrypt(data, "RSA-OAEP", {
      md: forge.md.sha256.create(),
    });
    return forge.util.encode64(encrypted);
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data with RSA private key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} privateKeyPem - Private key in PEM format
 * @returns {string} Decrypted data
 */
export function decryptWithPrivateKey(encryptedData, privateKeyPem) {
  try {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const encrypted = forge.util.decode64(encryptedData);
    const decrypted = privateKey.decrypt(encrypted, "RSA-OAEP", {
      md: forge.md.sha256.create(),
    });
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Generate AES key for symmetric encryption
 * @returns {string} Base64 encoded AES key
 */
export function generateAESKey() {
  const key = forge.random.getBytesSync(32); // 256-bit key
  return forge.util.encode64(key);
}

/**
 * Encrypt message with AES
 * @param {string} message - Message to encrypt
 * @param {string} keyBase64 - AES key in base64
 * @returns {{ciphertext: string, iv: string}} Encrypted message and IV
 */
export function encryptAES(message, keyBase64) {
  try {
    const key = forge.util.decode64(keyBase64);
    const iv = forge.random.getBytesSync(12); // 96-bit IV for GCM
    
    const cipher = forge.cipher.createCipher("AES-GCM", key);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(message));
    cipher.finish();
    
    const encrypted = cipher.output;
    const tag = cipher.mode.tag;
    
    // Combine encrypted data and tag
    const combined = encrypted.getBytes() + tag.getBytes();
    
    return {
      ciphertext: forge.util.encode64(combined),
      iv: forge.util.encode64(iv),
    };
  } catch (error) {
    throw new Error(`AES encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt message with AES
 * @param {string} ciphertextBase64 - Encrypted message in base64
 * @param {string} ivBase64 - IV in base64
 * @param {string} keyBase64 - AES key in base64
 * @returns {string} Decrypted message
 */
export function decryptAES(ciphertextBase64, ivBase64, keyBase64) {
  try {
    const key = forge.util.decode64(keyBase64);
    const iv = forge.util.decode64(ivBase64);
    const encrypted = forge.util.decode64(ciphertextBase64);
    
    // Extract tag (last 16 bytes) and ciphertext
    const tagLength = 16;
    const ciphertext = encrypted.slice(0, -tagLength);
    const tag = encrypted.slice(-tagLength);
    
    const decipher = forge.cipher.createDecipher("AES-GCM", key);
    decipher.start({
      iv: iv,
      tag: tag,
    });
    decipher.update(forge.util.createBuffer(ciphertext));
    const success = decipher.finish();
    
    if (!success) {
      throw new Error("Decryption failed: authentication tag mismatch");
    }
    
    return decipher.output.toString();
  } catch (error) {
    throw new Error(`AES decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt AES key with RSA public key
 * @param {string} aesKeyBase64 - AES key in base64
 * @param {string} publicKeyPem - RSA public key in PEM format
 * @returns {string} Encrypted AES key in base64
 */
export function encryptAESKeyWithRSA(aesKeyBase64, publicKeyPem) {
  return encryptWithPublicKey(aesKeyBase64, publicKeyPem);
}

/**
 * Decrypt AES key with RSA private key
 * @param {string} encryptedAESKeyBase64 - Encrypted AES key in base64
 * @param {string} privateKeyPem - RSA private key in PEM format
 * @returns {string} Decrypted AES key in base64
 */
export function decryptAESKeyWithRSA(encryptedAESKeyBase64, privateKeyPem) {
  return decryptWithPrivateKey(encryptedAESKeyBase64, privateKeyPem);
}

