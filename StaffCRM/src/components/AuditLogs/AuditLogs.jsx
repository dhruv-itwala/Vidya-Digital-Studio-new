import { useEffect, useState } from "react";
import styles from "./AuditLogs.module.css";
import { getAuditLogsAPI } from "../../api/auditLog.api";
import Loader from "../Loader/Loader";
import toast from "react-hot-toast";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  
  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    role: "",
  });

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchLogs = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await getAuditLogsAPI({
        page: currentPage,
        limit: 50, // default limit
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        role: filters.role || undefined,
      });
      setLogs(res.data.data || []);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching audit logs", err);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    setPage(1);
    fetchLogs(1);
  };

  const resetFilters = () => {
    setFilters({ search: "", startDate: "", endDate: "", role: "" });
    setPage(1);
    // Setting state is async, so we pass empty filters manually to fetchLogs
    getAuditLogsAPI({ page: 1, limit: 50 }).then(res => {
      setLogs(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    }).catch(() => toast.error("Failed to fetch audit logs"));
  };

  const handleNextPage = () => {
    if (page < pagination.pages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  // Convert to IST
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "INFO":
        return styles.severityInfo;
      case "WARNING":
        return styles.severityWarning;
      case "CRITICAL":
        return styles.severityCritical;
      case "SECURITY":
        return styles.severitySecurity;
      default:
        return "";
    }
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <h2 className={styles.title}>Audit Logs</h2>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Search (Names, Action)</label>
            <input
              type="text"
              name="search"
              placeholder="Search..."
              value={filters.search}
              onChange={handleFilterChange}
              className={styles.input}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label>Role</label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className={styles.input}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className={styles.input}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className={styles.input}
            />
          </div>

          <button className={styles.applyBtn} onClick={applyFilters}>
            Apply Filters
          </button>
          
          <button className={styles.resetBtn} onClick={resetFilters}>
            Reset
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Entity</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{formatDate(log.timestamp)}</td>

                      <td>{log.userName || log.user?.name || "Unknown"}</td>
                      
                      <td>{log.userRole || "-"}</td>

                      <td className={styles.action}>{log.action}</td>

                      <td>
                        <span className={styles.module}>{log.module}</span>
                      </td>

                      <td>{log.entityName || "-"}</td>

                      <td className={getSeverityClass(log.severity)}>
                        {log.severity || "INFO"}
                      </td>

                      <td
                        className={
                          log.status === "FAILED" ? styles.error : styles.success
                        }
                      >
                        {log.status || "SUCCESS"}
                      </td>
                      
                      <td className={styles.details} title={log.description}>
                        {log.description}
                      </td>
                    </tr>
                  ))}
                  
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "2rem" }}>
                        No audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} total logs)
                </div>
                <div className={styles.pageControls}>
                  <button 
                    className={styles.pageBtn} 
                    onClick={handlePrevPage}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button 
                    className={styles.pageBtn} 
                    onClick={handleNextPage}
                    disabled={page >= pagination.pages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
