// PunchAPK/src/api/auth.api.ts
import axios from "axios";
import { getKioskConfig } from "../services/storage.service";
import { UserProfile } from "../types";

export interface LoginResponse {
  success?: boolean;
  status?: string;
  message?: string;
  token: string;
  user?: UserProfile & { id?: string };
  data?: {
    user: UserProfile & { id?: string };
  };
}

export const loginEmployee = async (
  emailOrPhone: string,
  pass: string,
): Promise<{ token: string; user: UserProfile }> => {
  const config = await getKioskConfig();

  const res = await axios.post<LoginResponse>(
    `${config.apiUrl}/users/login`,
    {
      email: emailOrPhone.trim().toLowerCase(),
      password: pass,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    },
  );

  const token = res.data?.token;
  const userObj = res.data?.user || res.data?.data?.user;

  if (!token || !userObj) {
    throw new Error("Invalid response received from authentication server.");
  }

  const user: UserProfile = {
    _id: userObj._id || userObj.id || "",
    name: userObj.name || "",
    email: userObj.email || "",
    role: userObj.role || "employee",
    designation: userObj.designation,
    requireOfficeWifi: userObj.requireOfficeWifi,
    profilePicture: userObj.profilePicture,
  };

  return {
    token,
    user,
  };
};

export const fetchCurrentProfile = async (
  token: string,
): Promise<UserProfile> => {
  const config = await getKioskConfig();

  const res = await axios.get(
    `${config.apiUrl}/users/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  const userObj = res.data?.user || res.data?.data?.user || res.data?.data;
  if (!userObj) {
    throw new Error("Failed to retrieve user profile from server.");
  }

  return {
    _id: userObj._id || userObj.id || "",
    name: userObj.name || "",
    email: userObj.email || "",
    role: userObj.role || "employee",
    designation: userObj.designation,
    requireOfficeWifi: userObj.requireOfficeWifi,
    profilePicture: userObj.profilePicture,
  };
};

export const getAllEmployeesForAdmin = async (
  token: string,
): Promise<UserProfile[]> => {
  const config = await getKioskConfig();

  const res = await axios.get<{ success: boolean; users: UserProfile[] }>(
    `${config.apiUrl}/users/admin/all`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  return res.data.users || [];
};

export const toggleEmployeeWifiRestriction = async (
  token: string,
  userId: string,
  requireOfficeWifi: boolean,
): Promise<{ success: boolean; message: string; user: UserProfile }> => {
  const config = await getKioskConfig();

  const res = await axios.patch(
    `${config.apiUrl}/users/${userId}/wifi-restriction`,
    { requireOfficeWifi },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  return res.data;
};

