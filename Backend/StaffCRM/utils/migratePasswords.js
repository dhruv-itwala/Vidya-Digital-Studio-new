import Client from "../Clients/Client.model.js";
import User from "../Users/user.model.js";
import bcrypt from "bcryptjs";
import { encryptText } from "./encryption.utils.js";

/**
 * Self-healing security sweep:
 * Scans MongoDB for any unencrypted passwords and credentials:
 * 1. Checks Client portal login passwords -> hashes with bcrypt if plaintext.
 * 2. Checks Client platform credentials -> encrypts with AES-256-GCM if plaintext.
 * 3. Checks User passwords -> hashes with bcrypt if plaintext.
 * Runs non-blocking on database connection.
 */
export const migratePlaintextPasswords = async () => {
  try {
    let clientsUpdated = 0;
    let credentialsEncrypted = 0;
    let usersUpdated = 0;

    // 1. Audit Clients
    const clients = await Client.find({}).select("+password");

    for (const client of clients) {
      let clientModified = false;

      // Check portal login password
      if (
        client.password &&
        !client.password.startsWith("$2a$") &&
        !client.password.startsWith("$2b$") &&
        !client.password.startsWith("$2y$")
      ) {
        const salt = await bcrypt.genSalt(10);
        client.password = await bcrypt.hash(client.password, salt);
        clientModified = true;
      }

      // Check stored platform credentials
      if (Array.isArray(client.credentials)) {
        for (const cred of client.credentials) {
          if (cred.password && !cred.password.startsWith("enc:v1:")) {
            cred.password = encryptText(cred.password);
            credentialsEncrypted++;
            clientModified = true;
          }
        }
      }

      if (clientModified) {
        await client.save();
        clientsUpdated++;
      }
    }

    // 2. Audit Users
    const users = await User.find({}).select("+password");

    for (const user of users) {
      if (
        user.password &&
        !user.password.startsWith("$2a$") &&
        !user.password.startsWith("$2b$") &&
        !user.password.startsWith("$2y$")
      ) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        usersUpdated++;
      }
    }

    if (clientsUpdated > 0 || credentialsEncrypted > 0 || usersUpdated > 0) {
      console.log(
        `🛡️ [Security Audit] Plaintext encryption sweep completed: Encrypted ${credentialsEncrypted} credentials across ${clientsUpdated} clients, and hashed ${usersUpdated} users.`,
      );
    } else {
      console.log(
        "🛡️ [Security Audit] All database passwords and platform credentials verified encrypted.",
      );
    }
  } catch (error) {
    console.warn("⚠️ [Security Audit] Password sweep deferred:", error.message);
  }
};

