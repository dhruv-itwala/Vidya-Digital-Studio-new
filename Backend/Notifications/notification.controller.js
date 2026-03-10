import { getNotificationsService } from "./notification.service.js";

export const getNotificationsController = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await getNotificationsService(page, limit);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
