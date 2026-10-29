// Backend/StaffCRM/Attendance/attendance.routes.js
import express from "express";
import * as ctrl from "./attendance.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import {
  requireOfficeWifi,
  verifyOfficeWifi,
  verifyOfficeWifiAsync,
  getClientPublicIp,
  getDynamicOfficeNetwork,
  invalidateOfficeWifiCache,
} from "../middleware/officeWifi.middleware.js";
import OfficeNetwork from "./officeNetwork.model.js";


const attendanceRoutes = express.Router();

/* ================= PUBLIC NETWORK CHECK ================= */
attendanceRoutes.get("/wifi-check", async (req, res) => {
  const result = await verifyOfficeWifiAsync(req);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

attendanceRoutes.get("/my-ip", async (req, res) => {
  const result = await verifyOfficeWifiAsync(req);
  res.status(200).json({
    status: "success",
    message: "Vidya Digital Studio Network Inspector",
    detectedClientIp: result.clientPublicIp,
    isStudioWifi: result.isOfficeWifi,
  });
});

/* ================= PROTECTED ================= */
attendanceRoutes.use(protect);


/* ================= EMPLOYEE ================= */
attendanceRoutes.get("/work-record/today", ctrl.getTodayWorkRecord);
attendanceRoutes.post("/punch-in", requireOfficeWifi, ctrl.punchIn);
attendanceRoutes.post("/punch-out", requireOfficeWifi, ctrl.punchOut);
attendanceRoutes.post("/break-in", ctrl.breakIn);
attendanceRoutes.post("/break-out", ctrl.breakOut);
attendanceRoutes.get("/my", ctrl.myAttendance);
attendanceRoutes.get("/my/date", ctrl.myAttendanceByDate);

/* ================= HR / ADMIN NETWORK CONFIG ================= */
attendanceRoutes.get(
  "/office-network",
  roleCheck("admin", "hr"),
  async (req, res) => {
    const config = await getDynamicOfficeNetwork();
    const detectedIp = getClientPublicIp(req);
    res.status(200).json({
      status: "success",
      data: {
        config,
        detectedClientIp: detectedIp,
      },
    });
  },
);

attendanceRoutes.post(
  "/set-current-ip-as-office",
  roleCheck("admin", "hr"),
  async (req, res) => {
    const currentIp = getClientPublicIp(req);
    const localSubnet = req.body.localSubnet || "192.168.0.";

    const network = await OfficeNetwork.findOneAndUpdate(
      {},
      {
        $set: {
          officePublicIps: [currentIp],
          localSubnet,
          updatedBy: req.user._id,
          updatedByName: req.user.name,
        },
      },
      { upsert: true, new: true },
    );

    invalidateOfficeWifiCache();

    res.status(200).json({
      status: "success",
      message: `Studio Wi-Fi public IP updated to ${currentIp}`,
      data: network,
    });
  },
);

attendanceRoutes.put(
  "/office-network",
  roleCheck("admin", "hr"),
  async (req, res) => {
    const { officePublicIps, localSubnet, networkLabel } = req.body;
    const update = {};
    if (officePublicIps) update.officePublicIps = officePublicIps;
    if (localSubnet) update.localSubnet = localSubnet;
    if (networkLabel) update.networkLabel = networkLabel;
    update.updatedBy = req.user._id;
    update.updatedByName = req.user.name;

    const network = await OfficeNetwork.findOneAndUpdate(
      {},
      { $set: update },
      { upsert: true, new: true },
    );

    invalidateOfficeWifiCache();

    res.status(200).json({
      status: "success",
      message: "Studio Wi-Fi configuration saved",
      data: network,
    });
  },
);

/* ================= HR / ADMIN ================= */
attendanceRoutes.get(
  "/all/date",
  roleCheck("admin", "hr"),
  ctrl.getAllEmployeesAttendanceByDateRange,
);

attendanceRoutes.get(
  "/all",
  roleCheck("admin", "hr"),
  ctrl.getAllEmployeesAttendance,
);

attendanceRoutes.put(
  "/mark",
  roleCheck("admin", "hr"),
  ctrl.markAttendanceStatus,
);

attendanceRoutes.get(
  "/live-status/date",
  roleCheck("admin", "hr"),
  ctrl.getLiveEmployeesStatus,
);

attendanceRoutes.delete(
  "/user/:attendanceId",
  roleCheck("admin", "hr"),
  ctrl.deleteAttendanceById,
);

attendanceRoutes.patch(
  "/hr-override",
  roleCheck("admin", "hr"),
  ctrl.hrOverrideAttendance,
);
attendanceRoutes.get(
  "/work-record/by-date",
  roleCheck("admin", "hr"),
  ctrl.getWorkRecordByDate,
);

/* ================= ADMIN ================= */
attendanceRoutes.get("/day", roleCheck("admin"), ctrl.dayAttendance);

attendanceRoutes.get(
  "/download/pdf",
  roleCheck("admin", "hr"),
  ctrl.downloadAttendancePDF,
);

attendanceRoutes.get(
  "/download/timepdf",
  roleCheck("admin", "hr"),
  ctrl.downloadAttendanceWithPunchPDF,
);

attendanceRoutes.get("/weekly-progress", ctrl.getWeeklyProgress);
attendanceRoutes.get(
  "/weekly-progress/all",
  roleCheck("admin", "hr"),
  ctrl.getAllUsersWeeklyProgress,
);

export default attendanceRoutes;
