import React from "react";
import TaskDashboard from "../../components/Tasks/TaskDashboard";

const AdminTasks = () => {
  return (
    <div className="masterContainer">
      <TaskDashboard role="admin" />
    </div>
  );
};

export default AdminTasks;
