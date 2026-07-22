import AuditLog from "./AuditLog.model.js";

export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user,
      module,
      action,
      category,
      severity,
      status,
      search,
      startDate,
      endDate,
      role,
    } = req.query;

    const query = {};

    if (user) query.user = user;
    if (module) query.module = module;
    if (action) query.action = action;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (role) query.userRole = role;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort(search ? { score: { $meta: "textScore" } } : { timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name email")
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin can delete old logs to free space
export const deleteOldLogs = async (req, res) => {
  try {
    const { olderThanDays } = req.body;
    
    if (!olderThanDays || isNaN(olderThanDays) || Number(olderThanDays) < 1) {
      return res.status(400).json({ success: false, message: "Invalid days parameter" });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(olderThanDays));

    const result = await AuditLog.deleteMany({ timestamp: { $lt: cutoffDate } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} logs older than ${olderThanDays} days`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get history timeline for a specific entity
export const getEntityHistory = async (req, res) => {
  try {
    const { module, entityId } = req.params;
    const { order = "desc" } = req.query;

    const sortOrder = order === "asc" ? 1 : -1;

    const logs = await AuditLog.find({ module, entityId })
      .sort({ timestamp: sortOrder })
      .populate("user", "name email role")
      .lean();

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
