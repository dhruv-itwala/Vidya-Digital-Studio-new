import { useEffect, useState } from "react";
import {
  getAllTasksAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
} from "../../api/task.api";
import TaskKanban from "../../components/Task/TaskKanban";

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getAllTasksAPI();
    setTasks(res.data);
  };

  const updateStatus = async (id, status) => {
    await updateTaskStatusAPI(id, status);
    load();
  };

  const remove = async (id) => {
    await deleteTaskAPI(id);
    load();
  };

  return (
    <div>
      <h2>All Tasks</h2>
      <TaskKanban
        tasks={tasks}
        onStatusChange={updateStatus}
        onDelete={remove}
      />
    </div>
  );
}
