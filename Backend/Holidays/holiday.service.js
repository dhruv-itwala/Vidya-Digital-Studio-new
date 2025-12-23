import holidayModel from "./holiday.model.js";

export const getAllHolidaysService = async () => {
  return holidayModel.find().sort({ date: 1 });
};

export const createHolidayService = async (data) => {
  return holidayModel.create(data);
};

export const updateHolidayService = async (id, data) => {
  return holidayModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteHolidayService = async (id) => {
  return holidayModel.findByIdAndDelete(id);
};

export const isHolidayService = async (date) => {
  return holidayModel.exists({ date });
};
