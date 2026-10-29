// PunchAPK/src/api/auth.api.ts
import axios from "axios";
import { getKioskConfig } from "../services/storage.service";
import { UserProfile } from "../types";

export interface LoginResponse {
  status: string;
  token: string;
  data: {
    user: UserProfile;
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

  if (!res.data.token || !res.data.data?.user) {
    throw new Error("Invalid response received from authentication server.");
  }

  return {
    token: res.data.token,
    user: res.data.data.user,
  };
};

export const fetchCurrentProfile = async (
  token: string,
): Promise<UserProfile> => {
  const config = await getKioskConfig();

  const res = await axios.get<{ status: string; data: UserProfile }>(
    `${config.apiUrl}/users/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  return res.data.data;
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

