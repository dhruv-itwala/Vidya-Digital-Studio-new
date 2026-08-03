import cron from "node-cron";
import dayjs from "dayjs";
import ContentTask from "../ContentTask.model.js";
import User from "../../Users/user.model.js";
import { sendNotification } from "../../Notifications/notification.service.js";

// Run every day at 9:00 AM
cron.schedule(
  "0 9 * * *",
  async () => {
    console.log("🕒 Running Content Task Reminder Cron...");

    try {
      const todayStart = dayjs().startOf("day").toDate();
      const todayEnd = dayjs().endOf("day").toDate();
      
      const tomorrowStart = dayjs().add(1, "day").startOf("day").toDate();
      const tomorrowEnd = dayjs().add(1, "day").endOf("day").toDate();

      // Find tasks for today and tomorrow
      const tasks = await ContentTask.find({
        status: { $in: ["pending", "in-progress"] },
        $or: [
          { publishDate: { $gte: todayStart, $lte: todayEnd } },
          { publishDate: { $gte: tomorrowStart, $lte: tomorrowEnd } },
        ],
      }).populate("client", "clientName");

      if (tasks.length === 0) {
        console.log("✅ No upcoming content tasks for today or tomorrow.");
        return;
      }

      for (const task of tasks) {
        const isToday = dayjs(task.publishDate).isSame(dayjs(), "day");
        const dateStr = isToday ? "Today" : "Tomorrow";

        // Find employees that match the assigned roles/designations
        // The task.assignedRoles is an array of strings (e.g. ["Graphic Designer", "Social Media Manager"])
        
        let usersToNotify = [];
        
        if (task.assignedRoles && task.assignedRoles.length > 0) {
           // Find users by exact designation match (case insensitive)
           const regexRoles = task.assignedRoles.map(role => new RegExp(`^${role}$`, "i"));
           usersToNotify = await User.find({
             isActive: true,
             designation: { $in: regexRoles },
           });
        }

        if (usersToNotify.length === 0) {
          console.log(`⚠️ No users found for roles: ${task.assignedRoles.join(", ")} to notify for task ${task.title}`);
          continue;
        }

        const title = `Reminder: ${dateStr} is Posting Day!`;
        const body = `Content Task: ${task.title} for client ${task.client.clientName} is scheduled for ${dateStr}. Please prepare!`;

        // Send notifications
        for (const user of usersToNotify) {
          await sendNotification(user._id, {
            title,
            body,
            url: "/tasks",
          });
        }
      }
      
      console.log(`✅ Content Task Reminder Cron completed successfully.`);
    } catch (error) {
      console.error("❌ Error in Content Task Reminder Cron:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);
