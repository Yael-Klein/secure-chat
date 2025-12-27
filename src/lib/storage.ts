// Secure storage using IndexedDB for sensitive data (private keys)
// IndexedDB is more secure than localStorage as it's not accessible via XSS

const DB_NAME = "SecureMsgDB";
const DB_VERSION = 1;
const STORE_NAME = "privateKeys";

interface DBInstance {
  db: IDBDatabase | null;
}

let dbInstance: DBInstance = { db: null };

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance.db) {
    return dbInstance.db;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      dbInstance.db = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "userId" });
        objectStore.createIndex("userId", "userId", { unique: true });
      }
    };
  });
}

// Store private key securely in IndexedDB
export async function storePrivateKey(userId: string, privateKey: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ userId, privateKey, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to store private key"));
    });
  } catch (error) {
    console.error("Failed to store private key:", error);
    throw error;
  }
}

// Retrieve private key from IndexedDB
export async function getPrivateKey(userId: string): Promise<string | null> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<string | null>((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.privateKey : null);
      };
      request.onerror = () => reject(new Error("Failed to retrieve private key"));
    });
  } catch (error) {
    console.error("Failed to retrieve private key:", error);
    return null;
  }
}

// Remove private key from IndexedDB
export async function removePrivateKey(userId: string): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(userId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to remove private key"));
    });
  } catch (error) {
    console.error("Failed to remove private key:", error);
    throw error;
  }
}

// Clear all private keys (for logout)
export async function clearAllPrivateKeys(): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear private keys"));
    });
  } catch (error) {
    console.error("Failed to clear private keys:", error);
    throw error;
  }
}

