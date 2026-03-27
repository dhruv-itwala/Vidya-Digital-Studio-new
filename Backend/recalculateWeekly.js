import "dotenv/config";
import User from "./StaffCRM/Users/user.model.js";
import { getWeeklyProgressService } from "./StaffCRM/Attendance/attendance.service.js";
import { connectDB } from "./config/db.config.js";

const run = async () => {
  try {
    // DB
    connectDB();
    console.log("✅ DB Connected");

    const users = await User.find({ isActive: true }).select("_id");

    console.log(`🔄 Recalculating for ${users.length} users...\n`);

    for (const user of users) {
      try {
        await getWeeklyProgressService(user._id);
        console.log(`✔ Done: ${user._id}`);
      } catch (err) {
        console.error(`❌ Failed for ${user._id}`, err.message);
      }
    }

    console.log("\n🎉 Recalculation completed");
    process.exit(0);
  } catch (err) {
    console.error("🔥 Script failed:", err);
    process.exit(1);
  }
};

run();
