// Backend/StaffCRM/AIAssistant/aiAssistant.service.js
import "dotenv/config";
import axios from "axios";
import {
  punchInService,
  punchOutService,
  getUserAttendanceByDateService,
  getAllEmployeesAttendanceService,
} from "../Attendance/attendance.service.js";
import {
  submitReportService,
  updateReportService,
  getMyReportByDateService,
  getAllReportsByDateService,
} from "../Report/report.service.js";
import Task from "../Tasks/task.model.js";
import { createTaskService } from "../Tasks/task.service.js";
import User from "../Users/user.model.js";
import { toISTDateKey } from "../utils/date.utils.js";

const AI_BASE_URL =
  process.env.AI_BASE_URL || "https://itwala-dhruv-delta.hf.space";
const AI_MODEL = process.env.AI_MODEL || "delta";
const AI_TOKEN = process.env.AI_API_KEY || process.env.HF_TOKEN || "";

/**
 * Clean and parse LLM response into JSON
 */
function extractJSON(text) {
  if (!text) return null;
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = match ? match[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Execute an approved CRM action on behalf of req.user
 */
export async function executeCRMAction(user, action, payload = {}) {
  const userId = user._id || user.id;

  switch (action) {
    case "PUNCH_IN": {
      try {
        const record = await punchInService(userId);
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }).format(record.punchIn || new Date());

        return {
          success: true,
          actionExecuted: "PUNCH_IN",
          reply: `You have successfully punched in at ${timeStr}. Have a great shift!`,
          data: record,
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "PUNCH_IN",
          reply: err.message || "Failed to punch in. Please try again or mark manually.",
        };
      }
    }

    case "PUNCH_OUT": {
      try {
        const record = await punchOutService(userId);
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }).format(record.punchOut || new Date());

        return {
          success: true,
          actionExecuted: "PUNCH_OUT",
          reply: `You have successfully punched out at ${timeStr}. Well done on today's work!`,
          data: record,
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "PUNCH_OUT",
          reply: err.message || "Failed to punch out. Please verify your attendance.",
        };
      }
    }

    case "ADD_REPORT": {
      try {
        const rawPoints = payload.workPoints || payload.points || [];
        const workPoints = Array.isArray(rawPoints)
          ? rawPoints.map((p) => String(p).trim()).filter(Boolean)
          : [String(rawPoints).trim()].filter(Boolean);

        if (!workPoints.length) {
          return {
            success: false,
            actionExecuted: "ADD_REPORT",
            reply: "No work report points provided. Please tell me what you worked on.",
          };
        }

        const today = new Date();
        const existingReport = await getMyReportByDateService(userId, today);

        let report;
        if (existingReport) {
          const combinedPoints = Array.from(
            new Set([...(existingReport.workPoints || []), ...workPoints])
          );
          report = await updateReportService(existingReport._id, user, combinedPoints);
        } else {
          report = await submitReportService(userId, workPoints);
        }

        return {
          success: true,
          actionExecuted: "ADD_REPORT",
          reply: `Your work report has been updated with ${workPoints.length} point(s) for today!`,
          data: report,
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "ADD_REPORT",
          reply: err.message || "Failed to submit work report. Please check the reports tab.",
        };
      }
    }

    case "CREATE_TASK": {
      try {
        const taskName = payload.taskName || payload.name;
        if (!taskName || !String(taskName).trim()) {
          return {
            success: false,
            actionExecuted: "CREATE_TASK",
            reply: "Please specify a name or title for the task.",
          };
        }

        let assigneeId = userId;
        let assigneeName = user.name;

        const requestedAssignee = payload.assignedTo || payload.assignee;
        if (
          requestedAssignee &&
          typeof requestedAssignee === "string" &&
          !["self", "me", "myself"].includes(requestedAssignee.toLowerCase().trim())
        ) {
          const targetUser = await User.findOne({
            name: { $regex: requestedAssignee.trim(), $options: "i" },
            isActive: true,
          }).select("_id name");

          if (targetUser) {
            assigneeId = targetUser._id;
            assigneeName = targetUser.name;
          }
        }

        const rawPriority = (payload.priority || "medium").toLowerCase();
        const priority = ["low", "medium", "high"].includes(rawPriority)
          ? rawPriority
          : "medium";

        const taskData = {
          name: String(taskName).trim(),
          details:
            payload.details ||
            `Task created via AI Assistant by ${user.name}`,
          assignedTo: [assigneeId],
          priority,
          startDate: new Date(),
        };

        const createdTask = await createTaskService(user, taskData);

        return {
          success: true,
          actionExecuted: "CREATE_TASK",
          reply: `Task "${createdTask.name}" has been created and assigned to ${assigneeName} (${priority} priority).`,
          voiceText: `Task ${createdTask.name} created and assigned to ${assigneeName}.`,
          data: createdTask,
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "CREATE_TASK",
          reply: err.message || "Failed to create task.",
        };
      }
    }

    case "GET_ATTENDANCE_REPORT": {
      try {
        if (user.role !== "admin" && user.role !== "hr") {
          return {
            success: false,
            actionExecuted: "GET_ATTENDANCE_REPORT",
            reply: "Company-wide attendance reports are accessible only to HR and Admins. You can ask for your own status.",
          };
        }

        const todayStr = toISTDateKey(new Date());
        const allAtt = await getAllEmployeesAttendanceService(todayStr);

        const present = [];
        const absent = [];
        const halfDay = [];
        const onLeave = [];
        const holiday = [];

        allAtt.forEach((emp) => {
          const name = emp.name;
          const st = emp.status;
          if (st === "PRESENT" || st === "WFH") {
            present.push(name);
          } else if (st === "HALF_DAY") {
            halfDay.push(`${name}${emp.isLateHalfDay ? " (Late)" : ""}`);
          } else if (st === "ABSENT") {
            absent.push(name);
          } else if (st === "LEAVE") {
            onLeave.push(name);
          } else if (st === "HOLIDAY") {
            holiday.push(name);
          } else {
            absent.push(name);
          }
        });

        let text = `📊 Today's Attendance Report (${allAtt.length} staff total):\n\n`;
        text += `• Present (${present.length}): ${present.length ? present.join(", ") : "None"}\n`;
        text += `• Absent (${absent.length}): ${absent.length ? absent.join(", ") : "None"}\n`;
        if (halfDay.length) {
          text += `• Half Day (${halfDay.length}): ${halfDay.join(", ")}\n`;
        }
        if (onLeave.length) {
          text += `• Leave (${onLeave.length}): ${onLeave.join(", ")}\n`;
        }

        const voiceReply = `Today's attendance: ${present.length} employees are Present (${present.slice(0, 4).join(", ")}${present.length > 4 ? ` and ${present.length - 4} others` : ""}), and ${absent.length} are Absent (${absent.slice(0, 4).join(", ")}${absent.length > 4 ? ` and ${absent.length - 4} others` : ""}).`;

        return {
          success: true,
          actionExecuted: "GET_ATTENDANCE_REPORT",
          reply: text.trim(),
          voiceText: voiceReply,
          data: { present, absent, halfDay, onLeave, total: allAtt.length },
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "GET_ATTENDANCE_REPORT",
          reply: "Could not compile attendance report at this time.",
        };
      }
    }

    case "GET_ALL_REPORTS": {
      try {
        if (user.role !== "admin" && user.role !== "hr") {
          return {
            success: false,
            actionExecuted: "GET_ALL_REPORTS",
            reply: "Viewing all employee reports is restricted to HR and Admins. You can ask to view your own report.",
          };
        }

        const today = new Date();
        const reports = await getAllReportsByDateService(today);

        if (!reports || reports.length === 0) {
          return {
            success: true,
            actionExecuted: "GET_ALL_REPORTS",
            reply: "No employee work reports have been submitted yet today.",
            voiceText: "No employee work reports have been submitted yet today.",
            data: [],
          };
        }

        let text = `📝 Today's Employee Work Reports (${reports.length} submitted):\n\n`;
        reports.forEach((rep, idx) => {
          const empName = rep.user?.name || "Unknown";
          const points = (rep.workPoints || []).map((p) => `  • ${p}`).join("\n");
          text += `${idx + 1}. ${empName}:\n${points || "  • No points listed"}\n\n`;
        });

        const names = reports.map((r) => r.user?.name).filter(Boolean);
        const voiceReply = `${reports.length} employee(s) have submitted reports today, including ${names.slice(0, 3).join(", ")}.`;

        return {
          success: true,
          actionExecuted: "GET_ALL_REPORTS",
          reply: text.trim(),
          voiceText: voiceReply,
          data: reports,
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "GET_ALL_REPORTS",
          reply: "Could not fetch employee work reports at this moment.",
        };
      }
    }

    case "GET_STATUS": {
      try {
        const today = new Date();
        const record = await getUserAttendanceByDateService(userId, today);

        const status = record?.status || "NOT_MARKED";
        const netMinutes = record?.netWorkMinutes || 0;
        const hours = Math.floor(netMinutes / 60);
        const mins = netMinutes % 60;
        const workTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;

        let reply = `Your attendance status today is ${status}.`;
        if (record?.punchIn) {
          reply += ` You punched in, and have completed about ${workTimeStr} of work time.`;
        }

        return {
          success: true,
          actionExecuted: "GET_STATUS",
          reply,
          voiceText: reply,
          data: record,
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "GET_STATUS",
          reply: "Could not retrieve attendance status at this moment.",
        };
      }
    }

    case "GET_TASKS": {
      try {
        const tasks = await Task.find({
          assignedTo: userId,
          status: { $in: ["pending", "started"] },
        })
          .sort({ priority: -1, createdAt: -1 })
          .limit(5)
          .lean();

        if (!tasks.length) {
          return {
            success: true,
            actionExecuted: "GET_TASKS",
            reply: "You have no pending tasks right now. Great job keeping up!",
            voiceText: "You have no pending tasks right now.",
            data: [],
          };
        }

        const taskNames = tasks.map((t, idx) => `${idx + 1}. ${t.name}`).join(", ");
        return {
          success: true,
          actionExecuted: "GET_TASKS",
          reply: `You have ${tasks.length} active task(s): ${taskNames}.`,
          voiceText: `You have ${tasks.length} active tasks: ${taskNames}.`,
          data: tasks,
        };
      } catch (err) {
        return {
          success: false,
          actionExecuted: "GET_TASKS",
          reply: "Could not fetch your tasks right now.",
        };
      }
    }

    default:
      return {
        success: false,
        actionExecuted: "NONE",
        reply: "I did not recognize that action.",
      };
  }
}

/**
 * Process a natural language query with Qwen / Delta
 */
export async function processAIChat(user, message, conversationHistory = []) {
  const istDate = toISTDateKey(new Date());
  const istTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date());

  const isManagement = user.role === "admin" || user.role === "hr";

  const systemPrompt = `You are Vidya AI, the intelligent voice and chat assistant for Vidya Digital Studio CRM.
Current Context:
- Employee Name: ${user.name}
- Role: ${user.role} (Management / Admin rights: ${isManagement})
- Current Date (IST): ${istDate}
- Current Time (IST): ${istTime}

Your job is to understand what the user wants to do and return a strict JSON response.
Supported actions:
- "PUNCH_IN": user wants to punch in for attendance. REQUIRES CONFIRMATION.
- "PUNCH_OUT": user wants to punch out or finish their shift. REQUIRES CONFIRMATION.
- "ADD_REPORT": user says they completed work, want to add a work report, or submit tasks done. You MUST extract concise work points as an array in payload.workPoints. REQUIRES CONFIRMATION.
- "CREATE_TASK": user wants to add or create a task (e.g. "Add task: Design summer poster", "Create task for Priya to fix bug"). You MUST extract taskName, optional details, optional assignedTo (employee name or "self"), and priority ("low"|"medium"|"high"). REQUIRES CONFIRMATION.
- "GET_ATTENDANCE_REPORT": user asks for today's overall attendance report (e.g. "give attendance report for today", "who is present and absent today", "attendance summary"). NO confirmation needed.
- "GET_ALL_REPORTS": user asks to see or read all employee reports for today (e.g. "show all reports for today", "see all reports"). NO confirmation needed.
- "GET_STATUS": user asks for their own punch status, working hours, or attendance. NO confirmation needed.
- "GET_TASKS": user asks what tasks are assigned to them. NO confirmation needed.
- "GENERAL_CHAT": any other greeting, help request, or inquiry.

CONFIRMATION RULE:
Actions like "PUNCH_IN", "PUNCH_OUT", "ADD_REPORT", and "CREATE_TASK" MUST have requiresConfirmation: true, with a clear confirmationPrompt asking the user to confirm.
Read-only actions ("GET_ATTENDANCE_REPORT", "GET_ALL_REPORTS", "GET_STATUS", "GET_TASKS", "GENERAL_CHAT") MUST have requiresConfirmation: false.

You must respond ONLY with a valid JSON object in this format (no conversational filler before or after the JSON):
{
  "reply": "natural voice response for the user to hear aloud",
  "action": "PUNCH_IN" | "PUNCH_OUT" | "ADD_REPORT" | "CREATE_TASK" | "GET_ATTENDANCE_REPORT" | "GET_ALL_REPORTS" | "GET_STATUS" | "GET_TASKS" | "GENERAL_CHAT",
  "requiresConfirmation": boolean,
  "confirmationPrompt": "brief confirmation question if requiresConfirmation is true, else null",
  "payload": {
    "workPoints": ["Point 1", "Point 2"],
    "taskName": "string",
    "details": "string",
    "assignedTo": "string",
    "priority": "low" | "medium" | "high"
  }
}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-4).map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text || msg.content || "",
    })),
    { role: "user", content: message },
  ];

  const requestHeaders = { "Content-Type": "application/json" };
  if (AI_TOKEN) {
    requestHeaders["Authorization"] = `Bearer ${AI_TOKEN}`;
  }

  try {
    const response = await axios.post(
      `${AI_BASE_URL}/v1/chat/completions`,
      {
        model: AI_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 512,
      },
      {
        timeout: 15000,
        headers: requestHeaders,
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content || "";
    const parsed = extractJSON(rawContent);

    if (parsed && parsed.reply) {
      return {
        reply: parsed.reply,
        action: parsed.action || "GENERAL_CHAT",
        requiresConfirmation: Boolean(parsed.requiresConfirmation),
        confirmationPrompt: parsed.confirmationPrompt || null,
        payload: parsed.payload || {},
      };
    }

    return {
      reply: rawContent || "I heard your request. How can I assist you further?",
      action: "GENERAL_CHAT",
      requiresConfirmation: false,
      confirmationPrompt: null,
      payload: {},
    };
  } catch (err) {
    console.error("[AIAssistant] Model endpoint call failed:", {
      url: `${AI_BASE_URL}/v1/chat/completions`,
      status: err.response?.status,
      statusText: err.response?.statusText,
      errorMsg: err.message,
    });

    // Smart local keyword fallback
    const lower = message.toLowerCase().trim();

    if (
      lower.includes("attendance report") ||
      lower.includes("who is present") ||
      lower.includes("who is absent") ||
      lower.includes("attendance summary")
    ) {
      return executeCRMAction(user, "GET_ATTENDANCE_REPORT");
    }

    if (
      lower.includes("all reports") ||
      lower.includes("all employee reports") ||
      lower.includes("see all reports")
    ) {
      return executeCRMAction(user, "GET_ALL_REPORTS");
    }

    if (lower.includes("add task") || lower.includes("create task")) {
      const cleanTaskName = message
        .replace(/add task|create task|create a task|task/gi, "")
        .replace(/[:\-]/g, "")
        .trim();
      const taskName = cleanTaskName || "New Task";
      return {
        reply: `I've prepared a new task: "${taskName}". Would you like me to create it?`,
        action: "CREATE_TASK",
        requiresConfirmation: true,
        confirmationPrompt: `Create task "${taskName}"?`,
        payload: { taskName, priority: "medium", assignedTo: "self" },
      };
    }

    if (lower.includes("punch in") || lower.includes("punchin")) {
      return {
        reply: "Ready to punch you in for today. Would you like to confirm?",
        action: "PUNCH_IN",
        requiresConfirmation: true,
        confirmationPrompt: "Confirm punch-in now?",
        payload: {},
      };
    }

    if (lower.includes("punch out") || lower.includes("punchout")) {
      return {
        reply: "Ready to punch you out for today. Would you like to confirm?",
        action: "PUNCH_OUT",
        requiresConfirmation: true,
        confirmationPrompt: "Confirm punch-out now?",
        payload: {},
      };
    }

    if (lower.includes("report") || lower.includes("work")) {
      const clean = message.replace(/add report|report|submit|today/gi, "").trim();
      const points = clean ? [clean] : ["Completed daily duties"];
      return {
        reply: `I drafted your report point: "${points[0]}". Shall I submit it?`,
        action: "ADD_REPORT",
        requiresConfirmation: true,
        confirmationPrompt: "Submit this work report point?",
        payload: { workPoints: points },
      };
    }

    if (lower.includes("status") || lower.includes("attendance")) {
      return executeCRMAction(user, "GET_STATUS");
    }

    if (lower.includes("task")) {
      return executeCRMAction(user, "GET_TASKS");
    }

    return {
      reply: "I am having trouble connecting to my AI server right now, but you can still use the quick commands for punch, reports, or tasks.",
      action: "GENERAL_CHAT",
      requiresConfirmation: false,
      confirmationPrompt: null,
      payload: {},
    };
  }
}
