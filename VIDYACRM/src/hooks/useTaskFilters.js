import { useMemo, useState } from "react";

export const useTaskFilters = (tasks, role) => {
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [employees, setEmployees] = useState([]);

  const employeeSet = useMemo(() => new Set(employees), [employees]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;

      if (role === "admin" && employeeSet.size) {
        if (!t.assignedTo?.some((u) => employeeSet.has(u._id))) return false;
      }

      return true;
    });
  }, [tasks, status, priority, role, employeeSet]);

  const activeTasks = useMemo(
    () => filteredTasks.filter((t) => t.status !== "complete"),
    [filteredTasks],
  );

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === "complete"),
    [filteredTasks],
  );

  const resetFilters = () => {
    setStatus("all");
    setPriority("all");
    setEmployees([]);
  };

  return {
    activeTasks,
    completedTasks,
    filters: { status, priority, employees },
    setStatus,
    setPriority,
    setEmployees,
    resetFilters,
  };
};
