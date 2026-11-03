import { test, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import {
  encryptText,
  decryptText,
  encryptCredential,
  decryptCredential,
  decryptCredentials,
  encryptCredentials,
} from "../StaffCRM/utils/encryption.utils.js";
import Client from "../StaffCRM/Clients/Client.model.js";
import User from "../StaffCRM/Users/user.model.js";

describe("AES-256-GCM Password & Credential Encryption", () => {
  test("1.1 Successfully encrypts and decrypts a plain text password", () => {
    const rawPassword = "SuperSecretInstagramPass123!@#";
    const cipherText = encryptText(rawPassword);

    assert.notEqual(cipherText, rawPassword, "Ciphertext should differ from raw password");
    assert.ok(cipherText.startsWith("enc:v1:"), "Ciphertext must have enc:v1: prefix");

    const decrypted = decryptText(cipherText);
    assert.equal(decrypted, rawPassword, "Decrypted password must match original");
  });

  test("1.2 Idempotency: does not double-encrypt already encrypted text", () => {
    const rawPassword = "ClientMetaAdsPassword2026!";
    const encryptedOnce = encryptText(rawPassword);
    const encryptedTwice = encryptText(encryptedOnce);

    assert.equal(encryptedOnce, encryptedTwice, "Encrypting encrypted text should return it as-is");
    assert.equal(decryptText(encryptedTwice), rawPassword);
  });

  test("1.3 Handles empty, null, and undefined values safely", () => {
    assert.equal(encryptText(""), "");
    assert.equal(encryptText(null), null);
    assert.equal(encryptText(undefined), undefined);

    assert.equal(decryptText(""), "");
    assert.equal(decryptText(null), null);
    assert.equal(decryptText(undefined), undefined);
  });

  test("1.4 Legacy plaintext fallback: returns unencrypted text unchanged", () => {
    const legacyPlain = "oldPlaintextPassword123";
    const decrypted = decryptText(legacyPlain);
    assert.equal(decrypted, legacyPlain, "Legacy unencrypted string should be returned without throwing");
  });

  test("1.5 Encrypts and decrypts credential objects and arrays", () => {
    const credentials = [
      {
        platform: "Instagram",
        username: "vidya_digital_studio",
        password: "InstaPassword#999",
        note: "Main agency profile",
      },
      {
        platform: "WordPress CMS",
        username: "admin_vds",
        password: "WpSecurePass@2026!",
        note: "Hosting portal",
      },
    ];

    const encrypted = encryptCredentials(credentials);
    assert.ok(encrypted[0].password.startsWith("enc:v1:"));
    assert.ok(encrypted[1].password.startsWith("enc:v1:"));

    const decrypted = decryptCredentials(encrypted);
    assert.equal(decrypted[0].password, "InstaPassword#999");
    assert.equal(decrypted[1].password, "WpSecurePass@2026!");
    assert.equal(decrypted[0].platform, "Instagram");
  });

  test("1.6 Tampered ciphertext returns safely without crashing", () => {
    const rawPassword = "SensitiveSecret123";
    const validCipher = encryptText(rawPassword);
    const tampered = validCipher.slice(0, -4) + "0000";

    const result = decryptText(tampered);
    assert.ok(typeof result === "string");
  });
});

describe("Client & User Mongoose Schema Encryption Hooks", () => {
  test("2.1 Client credential schema automatically encrypts password via setter", () => {
    const client = new Client({
      clientName: "Test Enterprise Corp",
      credentials: [
        {
          platform: "Shopify Store",
          username: "store_admin",
          password: "MyRawShopifyPassword456!",
        },
      ],
    });

    // In raw internal storage, password must be encrypted
    const rawStored = client.credentials[0].get("password", null, { getters: false });
    assert.ok(rawStored.startsWith("enc:v1:"), "Raw stored credential must be encrypted");
    assert.notEqual(rawStored, "MyRawShopifyPassword456!");

    // With getters enabled, it must return decrypted value
    assert.equal(client.credentials[0].password, "MyRawShopifyPassword456!");
  });

  test("2.2 Client pre-save hook automatically hashes portal password with bcrypt", async () => {
    const client = new Client({
      clientName: "Test Portal Client",
      password: "ClientPortalPlaintextPass789!",
    });

    await new Promise((resolve, reject) => {
      client.schema.s.hooks.execPre("save", client, [() => {}], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    assert.ok(client.password.startsWith("$2a$") || client.password.startsWith("$2b$"));
    const match = await bcrypt.compare("ClientPortalPlaintextPass789!", client.password);
    assert.equal(match, true, "Bcrypt hash must match original plaintext");
  });

  test("2.3 User pre-save hook automatically hashes user password with bcrypt", async () => {
    const user = new User({
      name: "Test Staff Member",
      email: "staff@example.com",
      password: "StaffMemberPlaintextPass123!",
      joiningDate: new Date(),
      dateOfBirth: new Date(1995, 5, 15),
    });

    await new Promise((resolve, reject) => {
      user.schema.s.hooks.execPre("save", user, [() => {}], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    assert.ok(user.password.startsWith("$2a$") || user.password.startsWith("$2b$"));
    const match = await bcrypt.compare("StaffMemberPlaintextPass123!", user.password);
    assert.equal(match, true, "User bcrypt hash must match original plaintext");
  });
});
