// PunchAPK/src/types/index.ts

export type AttendanceStatus =
  | "NOT_STARTED"
  | "WORKING"
  | "ON_BREAK"
  | "COMPLETED"
  | "HOLIDAY";

export type KioskAction = "PUNCH_IN" | "PUNCH_OUT" | "BREAK_OUT" | "NONE";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "administrative" | "admin" | "employee" | "hr" | "intern";
  designation?: string;
  requireOfficeWifi?: boolean;
  profilePicture?: {
    url: string;
    public_id?: string;
  };
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

export interface WifiStatus {
  isStudioWifi: boolean;
  localIp: string | null;
  publicIp?: string | null;
  isWifiConnected: boolean;
  message?: string;
}

export interface TodayWorkRecord {
  punchIn?: string | null;
  punchOut?: string | null;
  totalWorkMinutes: number;
  attendanceStatus?: string;
  punches?: Array<{ in: string; out?: string | null }>;
}

export interface Employee {
  id: string;
  name: string;
  role: "administrative" | "admin" | "employee" | "hr" | "intern";
  designation?: string;
  profilePicture: string | null;
  status: AttendanceStatus;
  nextAllowedAction: KioskAction;
  punchIn: string | null;
  punchOut: string | null;
  workedSeconds?: number;
  isLateHalfDay?: boolean;
}

export interface KioskEmployeesResponse {
  success: boolean;
  serverTime: string;
  count: number;
  data: Employee[];
}

export interface KioskEmployeeStatusResponse {
  success: boolean;
  serverTime: string;
  data: Employee & {
    punches?: Array<{ in: string; out: string | null }>;
  };
}

export interface PunchInResponse {
  success: boolean;
  message: string;
  serverTime: string;
  data: {
    employeeId: string;
    name: string;
    punchIn: string;
    status: string;
    isLateHalfDay: boolean;
  };
}

export interface PunchOutResponse {
  success: boolean;
  message: string;
  serverTime: string;
  data: {
    employeeId: string;
    name: string;
    punchIn: string;
    punchOut: string;
    netWorkMinutes: number;
    attendanceStatus: string;
  };
}

export interface KioskConfig {
  apiUrl: string;
  deviceId: string;
  deviceKey: string;
}

export interface BiometricCheckResult {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
}
