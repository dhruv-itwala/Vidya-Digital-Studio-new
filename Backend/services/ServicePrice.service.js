// services/ServicePrice.service.js
import ServicePriceModel from "../models/ServicePrice.model.js";

export const getAllServicePrices = async () => {
  return await ServicePriceModel.find({});
};

export const getServicesByCategory = async (category) => {
  return await ServicePriceModel.find({ category });
};
