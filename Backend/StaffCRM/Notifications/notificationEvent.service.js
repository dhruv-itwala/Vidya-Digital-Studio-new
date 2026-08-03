// Backend/StaffCRM/Notifications/notificationEvent.service.js
import User from "../Users/user.model.js";
import { sendNotification } from "./notification.service.js";

/**
 * Format IST short date string e.g. "28 Jul"
 */
const formatShortISTDate = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
  });
};

const getAdminAndHrIds = async (excludeUserId = null, eventType = null) => {
  const users = await User.find({
    role: { $in: ["admin", "hr"] },
    isActive: true,
  }).select("_id notificationPreferences");

  return users
    .filter((u) => {
      if (eventType && u.notificationPreferences && u.notificationPreferences[eventType] === false) {
        return false;
      }
      return true;
    })
    .map((u) => u._id.toString())
    .filter((id) => id !== excludeUserId?.toString());
};

/* =========================================================
   LEAVE NOTIFICATIONS
========================================================= */

/**
 * 1. Notify Admin/HR when someone applies for Leave
 */
export const notifyLeaveApplied = async (leave, applicantUserId) => {
  try {
    const applicant = await User.findById(applicantUserId).select("name");
    const applicantName = applicant?.name || "A team member";

    const fromStr = formatShortISTDate(leave.fromDate);
    const toStr = formatShortISTDate(leave.toDate);

    const title = "🗓️ New Leave Request!";
    const body = `${applicantName} applied for ${leave.type} leave (${fromStr} - ${toStr}). Reason: ${leave.reason || "N/A"}`;

    const recipientIds = await getAdminAndHrIds(applicantUserId, "leaves");

    await Promise.all(
      recipientIds.map((id) =>
        sendNotification(id, {
          title,
          body,
          url: "/leaves",
        }).catch((e) =>
          console.error(`Failed to notify admin/hr ${id}:`, e?.message || e)
        )
      )
    );
  } catch (err) {
    console.error("[NotificationEvent] Error in notifyLeaveApplied:", err?.message || err);
  }
};

/**
 * 2. Notify Employee when Leave is Approved
 */
export const notifyLeaveApproved = async (leave) => {
  try {
    const fromStr = formatShortISTDate(leave.fromDate);
    const toStr = formatShortISTDate(leave.toDate);

    const title = "✅ Leave Approved!";
    const body = `Your ${leave.type} leave request (${fromStr} - ${toStr}) has been APPROVED.`;

    await sendNotification(leave.user, {
      title,
      body,
      url: "/leaves",
    });
  } catch (err) {
    console.error("[NotificationEvent] Error in notifyLeaveApproved:", err?.message || err);
  }
};

/**
 * 3. Notify Employee when Leave is Declined
 */
export const notifyLeaveDeclined = async (leave) => {
  try {
    const fromStr = formatShortISTDate(leave.fromDate);
    const toStr = formatShortISTDate(leave.toDate);

    const title = "❌ Leave Declined";
    const body = `Your ${leave.type} leave request (${fromStr} - ${toStr}) has been DECLINED.`;

    await sendNotification(leave.user, {
      title,
      body,
      url: "/leaves",
    });
  } catch (err) {
    console.error("[NotificationEvent] Error in notifyLeaveDeclined:", err?.message || err);
  }
};

/**
 * 4. Notify when Leave is Cancelled
 */
export const notifyLeaveCancelled = async (leave, cancelledByUserId) => {
  try {
    const fromStr = formatShortISTDate(leave.fromDate);
    const toStr = formatShortISTDate(leave.toDate);

    const isCancelledByOwner =
      leave.user.toString() === cancelledByUserId.toString();

    const employee = await User.findById(leave.user).select("name");
    const employeeName = employee?.name || "A team member";

    if (leave.user.toString() === cancelledByUserId.toString()) {
      // Employee cancelled their own leave -> Notify Admin & HR
      const adminHrIds = await getAdminAndHrIds(cancelledByUserId, "leaves");
      await Promise.all(
        adminHrIds.map((id) =>
          sendNotification(id, {
            title: "🚫 Leave Cancelled",
            body: `${employeeName} has CANCELLED their ${leave.type} leave (${fromStr} - ${toStr}).`,
            url: "/leaves",
          }).catch((e) => console.error(e))
        )
      );
    } else {
      // Admin/HR cancelled an employee's approved leave -> Notify Employee
      const title = "⚠️ Leave Cancelled by Admin/HR";
      const body = `Your approved ${leave.type} leave (${fromStr} - ${toStr}) has been CANCELLED.`;

      await sendNotification(leave.user, {
        title,
        body,
        url: "/leaves",
      });
    }
  } catch (err) {
    console.error("[NotificationEvent] Error in notifyLeaveCancelled:", err?.message || err);
  }
};

/* =========================================================
   REPORT NOTIFICATIONS
========================================================= */

/**
 * 5. Notify Admin & HR when an Employee submits Daily Work Report
 */
export const notifyReportSubmittedEvent = async (userId) => {
  try {
    const user = await User.findById(userId).select("name");
    const employeeName = user?.name || "A team member";

    const title = "📝 Daily Report Submitted";
    const body = `${employeeName} has submitted their daily work report.`;

    const adminHrIds = await getAdminAndHrIds(userId, "reports");

    await Promise.all(
      adminHrIds.map((id) =>
        sendNotification(id, {
          title,
          body,
          url: "/reports",
        }).catch((e) => console.error(e))
      )
    );
  } catch (err) {
    console.error("[NotificationEvent] Error in notifyReportSubmittedEvent:", err?.message || err);
  }
};

/* =========================================================
   TASK NOTIFICATIONS
========================================================= */

/**
 * 6. Notify assigned Employees when a Task is created/assigned
 */
export const notifyTaskAssigned = async (task, creatorUserId) => {
  try {
    if (!Array.isArray(task.assignedTo)) return;

    const title = "📋 New Task Assigned!";
    const body = `You have been assigned a new task: "${task.name}" (${task.priority ? task.priority.toUpperCase() : "NORMAL"}).`;

    await Promise.all(
      task.assignedTo.map((userId) => {
        const idStr = userId?._id ? userId._id.toString() : userId.toString();
        if (idStr === creatorUserId?.toString()) return Promise.resolve();

        return sendNotification(idStr, {
          title,
          body,
          url: "/tasks",
        }).catch(() => {});
      })
    );
  } catch (err) {
    console.error("[NotificationEvent] Error in notifyTaskAssigned:", err?.message || err);
  }
};

/**
 * 7. Notify Task Creator when a Task is marked as Completed
 */
export const notifyTaskCompleted = async (task, completedByUserId) => {
  try {
    const creatorId = task?.createdBy?.user;
    if (!creatorId) return;

    // Avoid self notification if creator marked it complete themselves
    if (creatorId.toString() === completedByUserId?.toString()) return;

    const creator = await User.findById(creatorId).select("notificationPreferences");
    if (creator?.notificationPreferences?.tasks === false) return;

    const completer = await User.findById(completedByUserId).select("name");
    const completerName = completer?.name || "A team member";

    const title = "✅ Task Completed!";
    const body = `${completerName} has completed the task: "${task.name}".`;

    await sendNotification(creatorId, {
      title,
      body,
      url: "/tasks",
    });
  } catch (err) {
    console.error("[NotificationEvent] Error in notifyTaskCompleted:", err?.message || err);
  }
};
