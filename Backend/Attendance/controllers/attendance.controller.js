import * as service from "../services/attendance.service.js";

export const punchIn = async (req, res) => {
  try {
    res.json(await service.punchInService(req.user.id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const punchOut = async (req, res) => {
  try {
    res.json(await service.punchOutService(req.user.id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const breakIn = async (req, res) => {
  try {
    res.json(await service.breakInService(req.user.id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const breakOut = async (req, res) => {
  try {
    res.json(await service.breakOutService(req.user.id));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const myAttendance = async (req, res) => {
  try {
    const { from, to } = req.query;

    const data = await service.getMyAttendanceService(req.user.id, from, to);

    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const dayAttendance = async (req, res) => {
  res.json(await service.getDayAttendanceService(req.query.date));
};

export const markAttendanceStatus = async (req, res) => {
  try {
    const { userId, date, status } = req.body;
    const attendance = await service.markAttendanceStatusService(
      userId,
      date,
      status
    );
    res.json({ message: "Attendance updated", attendance });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/* ================= HR: GET ALL EMPLOYEES ATTENDANCE ================= */
export const getAllEmployeesAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) throw new Error("Date is required");

    const data = await service.getAllEmployeesAttendanceService(date);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// ================= GET USER ATTENDANCE BY DATE =================
export const getUserAttendanceByDate = async (req, res) => {
  try {
    const userId = req.user.id; // <-- From auth middleware
    const { date } = req.query;
    if (!date) throw new Error("date is required");

    const attendance = await service.getUserAttendanceByDateService(
      userId,
      date
    );
    res.json(attendance);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
