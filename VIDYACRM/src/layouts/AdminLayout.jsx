import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import TopHeader from "../components/TopHeader/TopHeader";
import { useSidebarState } from "../hooks/useSidebarState";

export default function AdminLayout() {
  const {
    sidebarOpen,
    isCollapsed,
    toggleCollapse,
    handleMenuClick,
    closeMobileSidebar,
  } = useSidebarState();

  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeMobileSidebar}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="app-content">
        <TopHeader
          onMenuClick={handleMenuClick}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="main-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
