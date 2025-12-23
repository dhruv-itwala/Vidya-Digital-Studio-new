import React, { useEffect, useState } from "react";
import {
  getAllEmployeesAttendanceAPI,
  markAttendanceStatusAPI,
} from "../../api/attendance.api";
import styles from "./HRAttendance.module.css";
import toast from "react-hot-toast";

const HRAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const data = await getAllEmployeesAttendanceAPI(date);
      setEmployees(data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch attendance");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const handleStatusChange = async (employeeId, newStatus) => {
    try {
      await markAttendanceStatusAPI({
        userId: employeeId,
        date,
        status: newStatus,
      });
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === employeeId ? { ...emp, status: newStatus } : emp
        )
      );
      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2>HR Attendance Management</h2>
        <label>
          Select Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>
                    <select
                      value={emp.status}
                      onChange={(e) =>
                        handleStatusChange(emp._id, e.target.value)
                      }
                    >
                      <option value="PRESENT">Present</option>
                      <option value="HALF_DAY">Half Day</option>
                      <option value="WFH">Work From Home</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LEAVE">Leave</option>
                      <option value="HOLIDAY">Holiday</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HRAttendance;
