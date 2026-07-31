import React from "react";
import TaskDashboard from "../../components/Tasks/TaskDashboard";
import { useAuth } from "../../context/AuthContext";

export default function TaskList() {
  const { role } = useAuth();
  
  // Assuming TaskDashboard handles the logic for different roles internally,
  // or we pass the role down so it knows if it's admin/hr/employee
  return (
    <div style={{ paddingBottom: "24px" }}>
      <TaskDashboard role={role === "admin" ? "hr" : role} />
    </div>
  );
}
