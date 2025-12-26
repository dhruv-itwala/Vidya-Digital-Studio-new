import { useEffect, useState } from "react";
import { getAllTasksAPI, updateTaskStatusAPI } from "../../api/task.api";
import styles from "./Task.module.css";
import Loader from "../Loader/Loader";

export default function AllTaskCompleted() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllTasksAPI();
      console.log(res.data);
      const completedTasks = res.data.filter(
        (t) => t.status === "complete" || t.status === "hold"
      );
      res.data.forEach((t) => console.log(t.status));

      setTasks(completedTasks);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateTaskStatusAPI(id, status);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <p className={styles.error}>{error}</p>;
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Completed & Past Tasks</h2>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Task Name</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.empty}>
                No completed tasks found
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task._id}>
                <td className={styles.name}>{task.name}</td>

                <td>
                  <span
                    className={`${styles.priority} ${styles[task.priority]}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </td>

                <td className={styles.assigned}>
                  {task.assignedTo.map((u) => u.name).join(", ")}
                </td>

                <td>
                  {task.endDate
                    ? new Date(task.endDate).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  <select
                    value={task.status}
                    onChange={(e) => changeStatus(task._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="started">Started</option>
                    <option value="hold">Hold</option>
                    <option value="complete">Complete</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
