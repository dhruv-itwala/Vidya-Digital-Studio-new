import { useEffect, useState } from "react";
import styles from "./Log.module.css";
import { getAllLogsAPI } from "../../api/admin.api";
import Loader from "../Loader/Loader";

export default function Log() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await getAllLogsAPI();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoading(false);
    }
  };

  // 🇮🇳 Convert to IST
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2 className={styles.title}>API Logs</h2>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Response Time</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {console.log(logs)}
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{log.user?.name || "Unknown"}</td>

                <td className={styles.method}>{log.method}</td>

                <td className={styles.endpoint}>{log.endpoint}</td>

                <td
                  className={
                    log.statusCode >= 400 ? styles.error : styles.success
                  }
                >
                  {log.statusCode}
                </td>

                <td>{log.responseTime} ms</td>

                <td>{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
