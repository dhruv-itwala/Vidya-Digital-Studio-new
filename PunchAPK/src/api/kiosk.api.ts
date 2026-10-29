// PunchAPK/src/api/kiosk.api.ts
import * as Crypto from "expo-crypto";
import { getApiClient } from "./client";
import {
  KioskEmployeesResponse,
  KioskEmployeeStatusResponse,
  PunchInResponse,
  PunchOutResponse,
  Employee,
} from "../types";

/**
 * Fetches the active employee directory with today's live attendance status.
 */
export const fetchKioskEmployees = async (search: string = ""): Promise<Employee[]> => {
  const client = await getApiClient();
  const res = await client.get<KioskEmployeesResponse>("/kiosk/employees", {
    params: search ? { search } : {},
  });
  return res.data.data || [];
};

/**
 * Fetches status for a single selected employee.
 */
export const fetchKioskEmployeeStatus = async (
  employeeId: string,
): Promise<KioskEmployeeStatusResponse["data"]> => {
  const client = await getApiClient();
  const res = await client.get<KioskEmployeeStatusResponse>(
    `/kiosk/employees/${employeeId}/status`,
  );
  return res.data.data;
};

/**
 * Submits a kiosk Punch In event with an idempotency key and local timestamp.
 */
export const kioskPunchIn = async (
  employeeId: string,
  customIdempotencyKey?: string,
): Promise<PunchInResponse["data"]> => {
  const client = await getApiClient();
  const idempotencyKey = customIdempotencyKey || Crypto.randomUUID();

  const res = await client.post<PunchInResponse>("/kiosk/punch-in", {
    employeeId,
    idempotencyKey,
    clientTimestamp: new Date().toISOString(),
  });

  return res.data.data;
};

/**
 * Submits a kiosk Punch Out event with an idempotency key and local timestamp.
 */
export const kioskPunchOut = async (
  employeeId: string,
  customIdempotencyKey?: string,
): Promise<PunchOutResponse["data"]> => {
  const client = await getApiClient();
  const idempotencyKey = customIdempotencyKey || Crypto.randomUUID();

  const res = await client.post<PunchOutResponse>("/kiosk/punch-out", {
    employeeId,
    idempotencyKey,
    clientTimestamp: new Date().toISOString(),
  });

  return res.data.data;
};

