import AttendanceEntry from "./AttendanceEntry";
import AttendanceData from "./AttendanceData";

export default function Attendance({ mode = "entry" }) {
  if (mode === "data") return <AttendanceData />;
  return <AttendanceEntry />;
}
