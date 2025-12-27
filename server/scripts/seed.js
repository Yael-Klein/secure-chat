import bcrypt from "bcrypt";
import { initDatabase, createUser, getUserByUsername } from "../utils/database.js";
import { config } from "../config.js";

async function seed() {
  try {
    console.log("Starting database seed...");
    await initDatabase();

    // Create test users with hashed passwords
    const users = [
      {
        username: "david",
        password: "password123",
        publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
      },
      {
        username: "yael",
        password: "password123",
        publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
      },
      {
        username: "moshe",
        password: "password123",
        publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      // Check if user already exists
      const existing = await getUserByUsername(userData.username);
      if (existing) {
        console.log(`User ${userData.username} already exists, skipping...`);
        createdUsers.push(existing);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, config.bcryptRounds);
      const user = await createUser({
        username: userData.username,
        passwordHash,
        publicKey: userData.publicKey,
      });
      createdUsers.push(user);
      console.log(`Created user: ${user.username} (${user.id})`);
    }

    // Note: Message creation requires real RSA public keys from the client
    // Users will generate their keys when they register/login
    // Sample messages will be created when users actually send messages through the app
    console.log("\nNote: Sample messages are not created in seed script because:");
    console.log("  - Messages require real RSA public keys from client-generated key pairs");
    console.log("  - Users generate keys when they register/login");
    console.log("  - Messages will be created when users send them through the app");
    console.log("\nTo test messaging:");
    console.log("  1. Login with david/password123");
    console.log("  2. Login with yael/password123 in another browser/tab");
    console.log("  3. Send messages between users");

    console.log("\nDatabase seed completed successfully!");
    console.log(`Created ${createdUsers.length} users`);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
