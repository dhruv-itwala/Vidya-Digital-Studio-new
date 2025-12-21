import React from "react";
import EmployeeTimer from "./EmployeeTimer";
import EmployeeReport from "./EmployeeReport";
import EmployeeTasks from "./EmployeeTasks";

const EmployeeDashboard = () => {
  return (
    <div className="masterContainer" style={{ flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "20px",
          flexWrap: "nowrap",
        }}
      >
        <EmployeeTimer />
        <EmployeeReport />
      </div>
      <EmployeeTasks />
    </div>
  );
};

export default EmployeeDashboard;
