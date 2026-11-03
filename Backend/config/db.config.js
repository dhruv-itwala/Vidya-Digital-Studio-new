import mongoose from "mongoose";
import dns from "dns";
import { migratePlaintextPasswords } from "../StaffCRM/utils/migratePasswords.js";

// Force Cloudflare + Google DNS (Fixes Windows MongoDB DNS bug)
dns.setServers(["1.1.1.1", "8.8.8.8"]);

export const connectDB = async () => {
  try {
    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASS;
    const cluster = process.env.MONGO_CLUSTER;
    const dbName = process.env.MONGO_DB || "";

    const URI = `mongodb+srv://${user}:${pass}@${cluster}/${dbName}`;

    await mongoose.connect(URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected Successfully");

    // Automatically check and encrypt any legacy plaintext passwords or platform credentials
    migratePlaintextPasswords().catch((err) => {
      console.warn("⚠️ Plaintext password encryption notice:", err.message);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};
