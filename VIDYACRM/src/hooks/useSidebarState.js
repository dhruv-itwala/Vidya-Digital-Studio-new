import { useState, useCallback, useEffect } from "react";

export function useSidebarState() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  }, []);

  const handleMenuClick = useCallback(() => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen((prev) => !prev);
    } else {
      toggleCollapse();
    }
  }, [toggleCollapse]);

  const closeMobileSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Listen for window resize to auto-close mobile drawer if resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    sidebarOpen,
    isCollapsed,
    toggleCollapse,
    handleMenuClick,
    closeMobileSidebar,
  };
}

