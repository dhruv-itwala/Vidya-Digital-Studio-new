import React from "react";
import Attendance from "../../components/Attendance/Attendance";
import Tasks from "./Tasks";

const Dashboard = () => {
  return (
    <div className="masterContainer" style={{ flexDirection: "column" }}>
      <Attendance mode="entry" />
      <Tasks />
    </div>
  );
};

export default Dashboard;
