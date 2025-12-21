import * as service from "../services/holiday.service.js";

export const getHolidays = async (req, res) => {
  res.json(await service.getAllHolidaysService());
};

export const createHoliday = async (req, res) => {
  res.json(await service.createHolidayService(req.body));
};

export const updateHoliday = async (req, res) => {
  res.json(await service.updateHolidayService(req.params.id, req.body));
};

export const deleteHoliday = async (req, res) => {
  res.json(await service.deleteHolidayService(req.params.id));
};
