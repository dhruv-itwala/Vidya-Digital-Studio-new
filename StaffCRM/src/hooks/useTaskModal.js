import { useState } from "react";

export const useTaskModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [task, setTask] = useState(null);

  const openCreate = () => {
    setTask(null);
    setIsOpen(true);
  };

  const openEdit = (task) => {
    setTask(task);
    setIsOpen(true);
  };

  const close = () => {
    setTask(null);
    setIsOpen(false);
  };

  return {
    isOpen,
    task,
    openCreate,
    openEdit,
    close,
  };
};
