import { useEffect, useState } from "react";
import styles from "./AuditLogs.module.css";
import { getAuditLogsAPI } from "../../api/auditLog.api";
import Loader from "../Loader/Loader";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiFilter, FiCalendar, FiShield, FiAlertTriangle, FiInfo, FiXCircle, FiCheckCircle, FiRefreshCw, FiChevronLeft, FiChevronRight } from "react-icons/fi";

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
        limit: 50,
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

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "INFO":
        return <span className={`${styles.badge} ${styles.info}`}><FiInfo className={styles.badgeIcon} /> Info</span>;
      case "WARNING":
        return <span className={`${styles.badge} ${styles.warning}`}><FiAlertTriangle className={styles.badgeIcon} /> Warning</span>;
      case "CRITICAL":
        return <span className={`${styles.badge} ${styles.critical}`}><FiXCircle className={styles.badgeIcon} /> Critical</span>;
      case "SECURITY":
        return <span className={`${styles.badge} ${styles.security}`}><FiShield className={styles.badgeIcon} /> Security</span>;
      default:
        return <span className={`${styles.badge} ${styles.info}`}>{severity}</span>;
    }
  };

  const getStatusBadge = (status) => {
    if (status === "FAILED") {
      return <span className={`${styles.statusBadge} ${styles.failed}`}><FiXCircle className={styles.statusIcon} /> Failed</span>;
    }
    return <span className={`${styles.statusBadge} ${styles.success}`}><FiCheckCircle className={styles.statusIcon} /> Success</span>;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="masterContainer">
      <motion.div 
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <FiShield className={styles.headerIcon} />
            </div>
            <div>
              <h2 className={styles.title}>System Audit Logs</h2>
              <p className={styles.subtitle}>Monitor and track user activities across the platform</p>
            </div>
          </div>
        </header>

        <div className={styles.filterToolbar}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              name="search"
              placeholder="Search by action, name..."
              value={filters.search}
              onChange={handleFilterChange}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filtersGroup}>
            <div className={styles.filterItem}>
              <FiFilter className={styles.filterIcon} />
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className={styles.selectInput}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className={styles.filterItem}>
              <FiCalendar className={styles.filterIcon} />
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={styles.dateInput}
                title="Start Date"
              />
            </div>

            <div className={styles.filterItem}>
              <FiCalendar className={styles.filterIcon} />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={styles.dateInput}
                title="End Date"
              />
            </div>

            <div className={styles.actionButtons}>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className={styles.applyBtn} 
                onClick={applyFilters}
              >
                Apply
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className={styles.resetBtn} 
                onClick={resetFilters}
                title="Reset Filters"
              >
                <FiRefreshCw />
              </motion.button>
            </div>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          {loading ? (
            <div className={styles.loaderWrapper}>
              <Loader />
            </div>
          ) : (
            <>
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Time & User</th>
                      <th>Action Details</th>
                      <th>Module / Entity</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <motion.tbody
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    <AnimatePresence>
                      {logs.map((log) => (
                        <motion.tr 
                          key={log._id}
                          variants={rowVariants}
                          className={styles.tableRow}
                          whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                        >
                          <td className={styles.timeUserCell}>
                            <div className={styles.timeText}>{formatDate(log.timestamp)}</div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>{log.userName || log.user?.name || "Unknown"}</span>
                              <span className={styles.userRole}>{log.userRole || "-"}</span>
                            </div>
                          </td>

                          <td className={styles.actionCell}>
                            <div className={styles.actionText}>{log.action}</div>
                            <div className={styles.actionDesc} title={log.description}>
                              {log.description}
                            </div>
                          </td>

                          <td className={styles.moduleCell}>
                            <div className={styles.moduleTag}>{log.module}</div>
                            <div className={styles.entityText}>{log.entityName || "-"}</div>
                          </td>

                          <td className={styles.severityCell}>
                            {getSeverityBadge(log.severity)}
                          </td>

                          <td className={styles.statusCell}>
                            {getStatusBadge(log.status)}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    {logs.length === 0 && (
                      <tr>
                        <td colSpan="5">
                          <div className={styles.emptyState}>
                            <FiShield className={styles.emptyIcon} />
                            <h3>No Audit Logs Found</h3>
                            <p>Try adjusting your filters or search criteria.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </motion.tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className={styles.pagination}>
                  <div className={styles.pageInfo}>
                    Showing <span className={styles.highlight}>{logs.length}</span> logs (Page {pagination.page} of {pagination.pages})
                  </div>
                  <div className={styles.pageControls}>
                    <motion.button 
                      whileHover={{ scale: page > 1 ? 1.05 : 1 }}
                      whileTap={{ scale: page > 1 ? 0.95 : 1 }}
                      className={styles.pageBtn} 
                      onClick={handlePrevPage}
                      disabled={page === 1}
                    >
                      <FiChevronLeft /> Prev
                    </motion.button>
                    <div className={styles.pageIndicator}>
                      {pagination.page} / {pagination.pages}
                    </div>
                    <motion.button 
                      whileHover={{ scale: page < pagination.pages ? 1.05 : 1 }}
                      whileTap={{ scale: page < pagination.pages ? 0.95 : 1 }}
                      className={styles.pageBtn} 
                      onClick={handleNextPage}
                      disabled={page >= pagination.pages}
                    >
                      Next <FiChevronRight />
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
