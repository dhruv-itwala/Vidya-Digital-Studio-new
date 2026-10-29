// PunchAPK/src/api/attendance.api.ts
import axios from "axios";
import { getKioskConfig } from "../services/storage.service";
import { TodayWorkRecord } from "../types";

export const getTodayAttendance = async (
  token: string,
  clientLocalIp?: string | null,
): Promise<TodayWorkRecord | null> => {
  const config = await getKioskConfig();

  const res = await axios.get<{ success: boolean; data: TodayWorkRecord | null }>(
    `${config.apiUrl}/attendance/work-record/today`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-client-local-ip": clientLocalIp || "",
      },
      timeout: 10000,
    },
  );

  return res.data?.data || null;
};

export const submitPunchIn = async (
  token: string,
  clientLocalIp?: string | null,
): Promise<{ success: boolean; data: any; message?: string }> => {
  const config = await getKioskConfig();

  const res = await axios.post(
    `${config.apiUrl}/attendance/punch-in`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-client-local-ip": clientLocalIp || "",
      },
      timeout: 15000,
    },
  );

  return res.data;
};

export const submitPunchOut = async (
  token: string,
  clientLocalIp?: string | null,
): Promise<{ success: boolean; data: any; message?: string }> => {
  const config = await getKioskConfig();

  const res = await axios.post(
    `${config.apiUrl}/attendance/punch-out`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-client-local-ip": clientLocalIp || "",
      },
      timeout: 15000,
    },
  );

  return res.data;
};

export interface OfficeNetworkResponse {
  status: string;
  data: {
    config: {
      officePublicIps: string[];
      localSubnet: string;
      networkLabel: string;
      updatedByName?: string;
      updatedAt?: string;
    } | null;
    detectedClientIp: string;
  };
}

export const getOfficeNetworkConfig = async (
  token: string,
): Promise<OfficeNetworkResponse["data"]> => {
  const config = await getKioskConfig();

  const res = await axios.get<OfficeNetworkResponse>(
    `${config.apiUrl}/attendance/office-network`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  return res.data.data;
};

export const setCurrentIpAsOffice = async (
  token: string,
  localSubnet = "192.168.0.",
): Promise<{ status: string; message: string; data: any }> => {
  const config = await getKioskConfig();

  const res = await axios.post(
    `${config.apiUrl}/attendance/set-current-ip-as-office`,
    { localSubnet },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  return res.data;
};

export const updateOfficeNetworkConfig = async (
  token: string,
  payload: {
    officePublicIps?: string[];
    localSubnet?: string;
    networkLabel?: string;
  },
): Promise<{ status: string; message: string; data: any }> => {
  const config = await getKioskConfig();

  const res = await axios.put(
    `${config.apiUrl}/attendance/office-network`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    },
  );

  return res.data;
};


