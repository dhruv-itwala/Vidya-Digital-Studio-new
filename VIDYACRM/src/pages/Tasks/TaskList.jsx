import React from "react";
import TaskDashboard from "../../components/Tasks/TaskDashboard";
import { useAuth } from "../../context/AuthContext";

export default function TaskList() {
  const { role } = useAuth();
  
  return (
    <div style={{ paddingBottom: "24px" }}>
      <TaskDashboard role={role} />
    </div>
  );
}
