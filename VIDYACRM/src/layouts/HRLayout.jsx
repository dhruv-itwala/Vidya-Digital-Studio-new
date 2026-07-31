import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import TopHeader from "../components/TopHeader/TopHeader";

export default function HRLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-content">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
