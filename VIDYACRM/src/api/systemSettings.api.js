import axiosInstance from "./axios";

export const getSystemSettingsAPI = async () => {
  const res = await axiosInstance.get("/settings");
  return res.data;
};

export const updateSystemSettingsAPI = async (data) => {
  const res = await axiosInstance.put("/settings", data);
  return res.data;
};
