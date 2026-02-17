import toast from "react-hot-toast";

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
import TaskForm from "./TaskForm";
import { useState } from "react";

export default function TaskDashboard({ role }) {
  const { allEmployees } = useAuth();

  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  } = useTasks(role);

  const {
    activeTasks,
    completedTasks,
    filters,
    setStatus,
    setPriority,
    setEmployees,
    resetFilters,
  } = useTaskFilters(tasks, role);

  const modal = useTaskModal();

  const [showFilters, setShowFilters] = useState(false);
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
        <h2 className={styles.title}>My Tasks</h2>
        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </button>
          <button className={styles.primaryBtn} onClick={modal.openCreate}>
            + Create Task
          </button>
        </div>
      </div>
      {showFilters && (
        <TaskFilter
          role={role}
          users={allEmployees}
          filters={filters}
          setStatus={setStatus}
          setPriority={setPriority}
          setEmployees={setEmployees}
          resetFilters={resetFilters}
        />
      )}

      <TaskAnalytics tasks={tasks} />

      <TaskKanban
        tasks={activeTasks}
        onStatusChange={updateStatus}
        onDelete={deleteTask}
        onEdit={modal.openEdit}
      />

      <TaskCompleted tasks={completedTasks} onStatusChange={updateStatus} />

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
    </div>
  );
}
