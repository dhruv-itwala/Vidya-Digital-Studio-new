import toast from "react-hot-toast";
import { useState } from "react";
import styles from "./TaskDashboard.module.css";
import { useAuth } from "../../context/AuthContext";
import { useTasks } from "../../hooks/useTasks";
import { useTaskFilters } from "../../hooks/useTaskFilters";
import { useTaskModal } from "../../hooks/useTaskModal";

import Loader from "../Loader/Loader";
import TaskFilter from "./TaskFilter";
import TaskAnalytics from "./TaskAnalytics";
import TaskKanban from "./TaskKanban";
import TaskCompleted from "./TaskCompleted";
import TaskSheet from "./TaskSheet";
import TaskForm from "./TaskForm";
import HoldReasonModal from "./HoldReasonModal";
import { FiTrello, FiList } from "react-icons/fi";

export default function TaskDashboard({ role }) {
  const { allEmployees, role: authRole } = useAuth();
  const effectiveRole = role || authRole;

  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  } = useTasks(effectiveRole);

  const {
    activeTasks,
    completedTasks,
    filters,
    setStatus,
    setPriority,
    setEmployees,
    resetFilters,
  } = useTaskFilters(tasks, effectiveRole);

  const modal = useTaskModal();

  const [activeView, setActiveView] = useState("sheet"); // "sheet" or "kanban"
  const [showFilters, setShowFilters] = useState(false);
  const [holdModal, setHoldModal] = useState({
    isOpen: false,
    task: null,
  });

  const handleStatusChangeWithHoldModal = (id, newStatus, holdReason = "") => {
    if (newStatus === "hold" && !holdReason) {
      const taskObj = tasks.find((t) => t._id === id);
      setHoldModal({
        isOpen: true,
        task: taskObj || { _id: id },
      });
      return;
    }
    updateStatus(id, newStatus, holdReason);
  };

  const handleConfirmHoldModal = (reason) => {
    if (holdModal.task?._id) {
      updateStatus(holdModal.task._id, "hold", reason);
    }
    setHoldModal({ isOpen: false, task: null });
  };

  const handleCancelHoldModal = () => {
    setHoldModal({ isOpen: false, task: null });
  };

  const handleSubmit = async (data) => {
    const res = modal.task
      ? await updateTask(modal.task._id, data)
      : await createTask(data);

    if (res.success) {
      toast.success(modal.task ? "Task updated" : "Task created");
      modal.close();
    } else {
      toast.error(res.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h2 className={styles.title}>Task Management</h2>
          <span className={styles.subtitle}>
            Manage, track and monitor tasks with deadlines and completion records
          </span>
        </div>

        <div className={styles.headerRight}>
          {/* View Mode Toggle */}
          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${
                activeView === "sheet" ? styles.activeViewBtn : ""
              }`}
              onClick={() => setActiveView("sheet")}
            >
              <FiList />
              <span>Task Sheet</span>
            </button>
            <button
              className={`${styles.viewToggleBtn} ${
                activeView === "kanban" ? styles.activeViewBtn : ""
              }`}
              onClick={() => setActiveView("kanban")}
            >
              <FiTrello />
              <span>Kanban</span>
            </button>
          </div>

          <div className={styles.actions}>
            {activeView === "kanban" && (
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
              </button>
            )}
            <button className={styles.primaryBtn} onClick={modal.openCreate}>
              + Create Task
            </button>
          </div>
        </div>
      </div>

      {/* Analytics always visible or top level */}
      <TaskAnalytics tasks={tasks} />

      {activeView === "sheet" ? (
        <TaskSheet
          tasks={tasks}
          role={effectiveRole}
          users={allEmployees}
          onStatusChange={handleStatusChangeWithHoldModal}
          onEdit={modal.openEdit}
          onDelete={deleteTask}
        />
      ) : (
        <>
          {showFilters && (
            <TaskFilter
              role={effectiveRole}
              users={allEmployees}
              filters={filters}
              setStatus={setStatus}
              setPriority={setPriority}
              setEmployees={setEmployees}
              resetFilters={resetFilters}
            />
          )}

          <TaskKanban
            tasks={activeTasks}
            onStatusChange={handleStatusChangeWithHoldModal}
            onDelete={deleteTask}
            onEdit={modal.openEdit}
          />

          <TaskCompleted
            tasks={completedTasks}
            onStatusChange={handleStatusChangeWithHoldModal}
          />
        </>
      )}

      {modal.isOpen && (
        <div className={styles.modalOverlay} onClick={modal.close}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <TaskForm
              users={allEmployees}
              task={modal.task}
              onCancel={modal.close}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}

      {/* Hold Reason Modal */}
      <HoldReasonModal
        isOpen={holdModal.isOpen}
        task={holdModal.task}
        onConfirm={handleConfirmHoldModal}
        onCancel={handleCancelHoldModal}
      />
    </div>
  );
}
