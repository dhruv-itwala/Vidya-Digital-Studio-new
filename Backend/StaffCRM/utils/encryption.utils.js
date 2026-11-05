import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:v1:";

let cachedKey = null;
let lastSecret = null;

/**
 * Derives a deterministic 32-byte key for AES-256-GCM encryption.
 * Prefers CREDENTIALS_ENCRYPTION_KEY, falls back to SHA-256(JWT_SECRET).
 * Caches derived key buffer in memory to eliminate repeated hashing overhead.
 */
export const getEncryptionKey = () => {
  const secret =
    process.env.CREDENTIALS_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "vidya_digital_studio_credentials_salt_fallback_2026";
  if (cachedKey && lastSecret === secret) return cachedKey;
  lastSecret = secret;
  cachedKey = crypto.createHash("sha256").update(String(secret)).digest();
  return cachedKey;
};

/**
 * Encrypts plaintext using AES-256-GCM.
 * Format: enc:v1:<iv_hex>:<authTag_hex>:<cipher_hex>
 * Idempotent: returns as-is if already encrypted.
 */
export const encryptText = (plainText) => {
  if (plainText === null || plainText === undefined || plainText === "") {
    return plainText;
  }
  const str = String(plainText);
  if (str.startsWith(PREFIX)) {
    return str; // Already encrypted
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(str, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err.message);
    return str;
  }
};

/**
 * Decrypts AES-256-GCM ciphertext in format: enc:v1:<iv_hex>:<authTag_hex>:<cipher_hex>
 * Gracefully returns original string if not encrypted (legacy plaintext fallback).
 */
export const decryptText = (cipherText) => {
  if (cipherText === null || cipherText === undefined || cipherText === "") {
    return cipherText;
  }
  const str = String(cipherText);
  if (!str.startsWith(PREFIX)) {
    return str; // Legacy unencrypted plaintext fallback
  }

  try {
    const parts = str.split(":");
    // Expected format: ['enc', 'v1', ivHex, authTagHex, cipherHex]
    if (parts.length !== 5) {
      return str;
    }

    const iv = Buffer.from(parts[2], "hex");
    const authTag = Buffer.from(parts[3], "hex");
    const encryptedHex = parts[4];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err.message);
    return str;
  }
};

/**
 * Encrypts the password field of a single credential object.
 */
export const encryptCredential = (cred) => {
  if (!cred || typeof cred !== "object") return cred;
  const copy = cred.toObject ? cred.toObject() : { ...cred };
  if (copy.password !== undefined) {
    copy.password = encryptText(copy.password);
  }
  return copy;
};

/**
 * Decrypts the password field of a single credential object.
 */
export const decryptCredential = (cred) => {
  if (!cred || typeof cred !== "object") return cred;
  const copy = cred.toObject ? cred.toObject() : { ...cred };
  if (copy.password !== undefined) {
    copy.password = decryptText(copy.password);
  }
  return copy;
};

/**
 * Decrypts an array of credentials or a single credential object.
 */
export const decryptCredentials = (credentials) => {
  if (!credentials) return [];
  if (Array.isArray(credentials)) {
    return credentials.map(decryptCredential);
  }
  return decryptCredential(credentials);
};

/**
 * Encrypts an array of credentials or a single credential object.
 */
export const encryptCredentials = (credentials) => {
  if (!credentials) return [];
  if (Array.isArray(credentials)) {
    return credentials.map(encryptCredential);
  }
  return encryptCredential(credentials);
};

