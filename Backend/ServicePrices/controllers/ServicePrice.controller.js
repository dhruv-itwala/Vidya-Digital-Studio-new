// controllers/ServicePrice.controller.js
import {
  getAllServicePrices,
  getServicesByCategory,
} from "../services/ServicePrice.service.js";

export const fetchAllServicePrices = async (req, res) => {
  try {
    const data = await getAllServicePrices();
    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching service prices",
      error: error.message,
    });
  }
};

export const fetchServicePricesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const data = await getServicesByCategory(category);

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: "No services found for this category",
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching service prices",
      error: error.message,
    });
  }
};
