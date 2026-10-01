import React, { useState, useMemo } from "react";
import { formatToIST, isTaskOverdue } from "../../utils/date.util";
import { getInitials } from "../../utils/name.util";
import {
  FiSearch,
  FiDownload,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiPauseCircle,
} from "react-icons/fi";
import styles from "./TaskSheet.module.css";

import HoldReasonModal from "./HoldReasonModal";

export default function TaskSheet({
  tasks = [],
  role = "employee",
  users = [],
  onStatusChange,
  onEdit,
  onDelete,
}) {
  const isAdminOrHR = ["admin", "hr", "administrative"].includes(role);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Hold Reason Modal State
  const [holdModal, setHoldModal] = useState({
    isOpen: false,
    task: null,
  });

  // Helper to resolve assigned user object from users list if needed
  const resolveUser = (u) => {
    if (!u) return null;
    if (typeof u === "object" && u.name) return u;
    const uId = typeof u === "object" ? u._id : u;
    const found = users.find((emp) => emp._id === uId);
    return found || { _id: uId, name: "Employee" };
  };

  // Status change with Hold Reason Modal
  const handleStatusSelect = (task, newStatus) => {
    if (!onStatusChange) return;

    if (newStatus === "hold") {
      setHoldModal({
        isOpen: true,
        task,
      });
    } else {
      onStatusChange(task._id, newStatus, "");
    }
  };

  const handleConfirmHold = (reason) => {
    if (holdModal.task) {
      onStatusChange(holdModal.task._id, "hold", reason);
    }
    setHoldModal({ isOpen: false, task: null });
  };

  const handleCancelHold = () => {
    setHoldModal({ isOpen: false, task: null });
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = task.name?.toLowerCase().includes(query);
        const matchDetails = task.details?.toLowerCase().includes(query);
        const matchReason = task.holdReason?.toLowerCase().includes(query);
        const matchAssignee = task.assignedTo?.some((u) => {
          const resolved = resolveUser(u);
          return resolved?.name?.toLowerCase().includes(query);
        });
        if (!matchName && !matchDetails && !matchReason && !matchAssignee) {
          return false;
        }
      }

      // Employee Filter for Admin & HR
      if (isAdminOrHR && selectedEmployee !== "all") {
        const hasEmployee = task.assignedTo?.some((u) => {
          const uId = typeof u === "object" ? u._id : u;
          return uId === selectedEmployee;
        });
        if (!hasEmployee) return false;
      }

      // Status Filter
      if (selectedStatus !== "all" && task.status !== selectedStatus) {
        return false;
      }

      // Priority Filter
      if (selectedPriority !== "all" && task.priority !== selectedPriority) {
        return false;
      }

      // Date Range Filter (by Created Date or Due Date)
      if (startDateFilter) {
        const taskDate = new Date(task.createdAt || task.startDate);
        const filterStart = new Date(startDateFilter);
        filterStart.setHours(0, 0, 0, 0);
        if (taskDate < filterStart) return false;
      }

      if (endDateFilter) {
        const taskDate = new Date(task.endDate || task.createdAt);
        const filterEnd = new Date(endDateFilter);
        filterEnd.setHours(23, 59, 59, 999);
        if (taskDate > filterEnd) return false;
      }

      return true;
    });
  }, [
    tasks,
    searchTerm,
    selectedEmployee,
    selectedStatus,
    selectedPriority,
    startDateFilter,
    endDateFilter,
    isAdminOrHR,
    users,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = filteredTasks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedEmployee("all");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setStartDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
  };

  // CSV Export
  const exportToCSV = () => {
    if (!filteredTasks.length) return;

    const headers = [
      "Task Name",
      "Task Details",
      "Priority",
      "Status",
      "Hold Reason",
      "Assigned To",
      "Assigned Date (IST)",
      "Start Date & Time (IST)",
      "Due Date & Time (IST)",
      "Completed Date & Time (IST)",
    ];

    const rows = filteredTasks.map((task) => {
      const assignees =
        task.assignedTo
          ?.map((u) => {
            const resolved = resolveUser(u);
            return resolved?.name || "User";
          })
          .join("; ") || "-";

      const assignedDate = formatToIST(task.createdAt || task.assignedDate);
      const startDate = formatToIST(task.startDate);
      const dueDate = formatToIST(task.endDate);
      const completedDate =
        task.status === "complete"
          ? formatToIST(task.completedAt || task.updatedAt)
          : "-";
      const holdReason = task.status === "hold" ? task.holdReason || "-" : "-";

      return [
        `"${(task.name || "").replace(/"/g, '""')}"`,
        `"${(task.details || "").replace(/"/g, '""')}"`,
        `"${task.priority || "medium"}"`,
        `"${task.status || "pending"}"`,
        `"${holdReason.replace(/"/g, '""')}"`,
        `"${assignees}"`,
        `"${assignedDate}"`,
        `"${startDate}"`,
        `"${dueDate}"`,
        `"${completedDate}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Task_Sheet_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.taskSheetContainer}>
      {/* ================= CONTROLS BAR ================= */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tasks, details or assignees..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterActions}>
          {isAdminOrHR && (
            <div className={styles.selectWrapper}>
              <FiUser className={styles.filterIcon} />
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.filterSelect}
                title="Filter by Employee"
              >
                <option value="all">All Employees</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.selectWrapper}>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="started">Started</option>
              <option value="hold">On Hold</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className={styles.dateInputs}>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.dateInput}
              title="From Date"
            />
            <span className={styles.dateSep}>to</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.dateInput}
              title="To Date"
            />
          </div>

          {(searchTerm ||
            selectedEmployee !== "all" ||
            selectedStatus !== "all" ||
            selectedPriority !== "all" ||
            startDateFilter ||
            endDateFilter) && (
            <button className={styles.clearBtn} onClick={resetFilters}>
              Reset
            </button>
          )}

          <button
            className={styles.exportBtn}
            onClick={exportToCSV}
            title="Export to CSV"
          >
            <FiDownload />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ================= SUMMARY STATS ================= */}
      <div className={styles.sheetMetaBar}>
        <span className={styles.totalCount}>
          Showing <strong>{filteredTasks.length}</strong> tasks
        </span>
      </div>

      {/* ================= DESKTOP TABLE VIEW ================= */}
      <div className={styles.desktopTableContainer}>
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Task Details</th>
                  <th style={{ width: "13%" }}>Assigned To</th>
                  <th style={{ width: "13%" }}>Assigned Date</th>
                  <th style={{ width: "13%" }}>Start Date & Time</th>
                  <th style={{ width: "14%" }}>Due Date & Time</th>
                  <th style={{ width: "14%" }}>Completed Date & Time</th>
                  <th style={{ width: "8%", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyState}>
                      <div className={styles.emptyContent}>
                        <FiAlertCircle className={styles.emptyIcon} />
                        <p>No tasks found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task) => {
                    const overdue = isTaskOverdue(task.endDate, task.status);
                    const isCompleted = task.status === "complete";
                    const completionTime = isCompleted
                      ? formatToIST(task.completedAt || task.updatedAt)
                      : null;

                    return (
                      <tr key={task._id} className={styles.row}>
                        {/* Task Details */}
                        <td>
                          <div className={styles.taskDetailsCell}>
                            <div className={styles.taskNameRow}>
                              <span className={styles.taskName}>{task.name}</span>
                              <span
                                className={`${styles.priorityBadge} ${
                                  styles[task.priority?.toLowerCase() || "medium"]
                                }`}
                              >
                                {task.priority || "Medium"}
                              </span>
                            </div>
                            {task.details && (
                              <p className={styles.taskDescription}>
                                {task.details}
                              </p>
                            )}
                            {task.status === "hold" && task.holdReason && (
                              <div className={styles.holdReasonBadge}>
                                <FiPauseCircle className={styles.holdIcon} />
                                <span>
                                  <strong>Hold Reason:</strong> {task.holdReason}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td>
                          <div className={styles.assignedGroup}>
                            {task.assignedTo?.map((u, idx) => {
                              const userObj = resolveUser(u);
                              if (!userObj) return null;
                              return (
                                <div
                                  key={userObj._id || idx}
                                  className={styles.userChip}
                                  title={userObj.name || "User"}
                                >
                                  <div className={styles.avatar}>
                                    {userObj.profilePicture?.url ? (
                                      <img
                                        src={userObj.profilePicture.url}
                                        alt={userObj.name}
                                      />
                                    ) : (
                                      getInitials(userObj.name || "U")
                                    )}
                                  </div>
                                  <span className={styles.userName}>
                                    {userObj.name || "User"}
                                  </span>
                                </div>
                              );
                            })}
                            {(!task.assignedTo ||
                              task.assignedTo.length === 0) && (
                              <span className={styles.unassigned}>
                                Unassigned
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assigned Date */}
                        <td>
                          <div className={styles.dateTimeCell}>
                            <FiCalendar className={styles.cellIcon} />
                            <span>
                              {formatToIST(task.createdAt || task.assignedDate)}
                            </span>
                          </div>
                        </td>

                        {/* Start Date & Time */}
                        <td>
                          <div className={styles.dateTimeCell}>
                            <FiCalendar className={styles.cellIcon} />
                            <span>{formatToIST(task.startDate)}</span>
                          </div>
                        </td>

                        {/* Due Date + Time (Deadline) */}
                        <td>
                          <div
                            className={`${styles.dateTimeCell} ${
                              overdue ? styles.overdueCell : ""
                            }`}
                          >
                            <FiClock className={styles.cellIcon} />
                            <span>{formatToIST(task.endDate)}</span>
                            {overdue && (
                              <span className={styles.overdueBadge}>Overdue</span>
                            )}
                          </div>
                        </td>

                        {/* Date & Time Completed */}
                        <td>
                          {isCompleted ? (
                            <div className={styles.completedTimeCell}>
                              <FiCheckCircle className={styles.completedIcon} />
                              <span className={styles.completedTimeText}>
                                {completionTime}
                              </span>
                            </div>
                          ) : (
                            <span className={styles.pendingBadge}>
                              {task.status === "started"
                                ? "In Progress"
                                : task.status === "hold"
                                ? "On Hold"
                                : "Pending"}
                            </span>
                          )}
                        </td>

                        {/* Status & Actions */}
                        <td>
                          <div className={styles.actionCell}>
                            {onStatusChange && (
                              <select
                                className={`${styles.statusSelect} ${
                                  styles["status_" + task.status]
                                }`}
                                value={task.status}
                                onChange={(e) =>
                                  handleStatusSelect(task, e.target.value)
                                }
                              >
                                <option value="pending">Pending</option>
                                <option value="started">Started</option>
                                <option value="hold">On Hold</option>
                                <option value="complete">Complete</option>
                              </select>
                            )}

                            <div className={styles.iconActions}>
                              {onEdit && (
                                <button
                                  className={styles.iconBtn}
                                  onClick={() => onEdit(task)}
                                  title="Edit Task"
                                >
                                  <FiEdit2 />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this task?")) {
                                      onDelete(task._id);
                                    }
                                  }}
                                  title="Delete Task"
                                >
                                  <FiTrash2 />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MOBILE CARDS VIEW ================= */}
      <div className={styles.mobileCardsContainer}>
        {paginatedTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <FiAlertCircle className={styles.emptyIcon} />
            <p>No tasks found matching your criteria.</p>
          </div>
        ) : (
          paginatedTasks.map((task) => {
            const overdue = isTaskOverdue(task.endDate, task.status);
            const isCompleted = task.status === "complete";
            const completionTime = isCompleted
              ? formatToIST(task.completedAt || task.updatedAt)
              : null;

            return (
              <div key={task._id} className={styles.mobileTaskCard}>
                {/* Header */}
                <div className={styles.mobileCardHeader}>
                  <div className={styles.mobileCardTitleRow}>
                    <h4 className={styles.mobileTaskTitle}>{task.name}</h4>
                    <span
                      className={`${styles.priorityBadge} ${
                        styles[task.priority?.toLowerCase() || "medium"]
                      }`}
                    >
                      {task.priority || "Medium"}
                    </span>
                  </div>
                  {task.details && (
                    <p className={styles.mobileTaskDetails}>{task.details}</p>
                  )}
                  {task.status === "hold" && task.holdReason && (
                    <div className={styles.holdReasonBadge}>
                      <FiPauseCircle className={styles.holdIcon} />
                      <span>
                        <strong>Hold Reason:</strong> {task.holdReason}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta Grid */}
                <div className={styles.mobileMetaGrid}>
                  <div className={styles.mobileMetaItem}>
                    <span className={styles.metaLabel}>Assigned To</span>
                    <div className={styles.assignedGroup}>
                      {task.assignedTo?.map((u, idx) => {
                        const userObj = resolveUser(u);
                        if (!userObj) return null;
                        return (
                          <div
                            key={userObj._id || idx}
                            className={styles.userChip}
                          >
                            <div className={styles.avatar}>
                              {userObj.profilePicture?.url ? (
                                <img
                                  src={userObj.profilePicture.url}
                                  alt={userObj.name}
                                />
                              ) : (
                                getInitials(userObj.name || "U")
                              )}
                            </div>
                            <span className={styles.userName}>
                              {userObj.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.mobileMetaItem}>
                    <span className={styles.metaLabel}>Assigned Date</span>
                    <span className={styles.metaVal}>
                      {formatToIST(task.createdAt || task.assignedDate)}
                    </span>
                  </div>

                  <div className={styles.mobileMetaItem}>
                    <span className={styles.metaLabel}>Start Date & Time</span>
                    <span className={styles.metaVal}>
                      {formatToIST(task.startDate)}
                    </span>
                  </div>

                  <div className={styles.mobileMetaItem}>
                    <span className={styles.metaLabel}>Due Date & Time</span>
                    <span
                      className={`${styles.metaVal} ${
                        overdue ? styles.overdueCell : ""
                      }`}
                    >
                      {formatToIST(task.endDate)}
                      {overdue && (
                        <span className={styles.overdueBadge}>Overdue</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.mobileMetaItem}>
                    <span className={styles.metaLabel}>Completed At</span>
                    {isCompleted ? (
                      <span className={styles.completedTimeText}>
                        {completionTime}
                      </span>
                    ) : (
                      <span className={styles.pendingBadge}>
                        {task.status === "started"
                          ? "In Progress"
                          : task.status === "hold"
                          ? "On Hold"
                          : "Pending"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className={styles.mobileCardFooter}>
                  {onStatusChange && (
                    <select
                      className={`${styles.statusSelect} ${
                        styles["status_" + task.status]
                      }`}
                      value={task.status}
                      onChange={(e) =>
                        handleStatusSelect(task, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="started">Started</option>
                      <option value="hold">On Hold</option>
                      <option value="complete">Complete</option>
                    </select>
                  )}

                  <div className={styles.iconActions}>
                    {onEdit && (
                      <button
                        className={styles.iconBtn}
                        onClick={() => onEdit(task)}
                        title="Edit Task"
                      >
                        <FiEdit2 />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this task?")) {
                            onDelete(task._id);
                          }
                        }}
                        title="Delete Task"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      {filteredTasks.length > 0 && (
        <div className={styles.paginationBar}>
          <div className={styles.rowsPerPage}>
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.rowsSelect}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className={styles.pageInfo}>
            {startIndex + 1} -{" "}
            {Math.min(startIndex + itemsPerPage, filteredTasks.length)} of{" "}
            {filteredTasks.length}
          </div>

          <div className={styles.pageButtons}>
            <button
              className={styles.pageBtn}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className={styles.currentPageText}>
              {currentPage} / {totalPages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ================= HOLD REASON MODAL ================= */}
      <HoldReasonModal
        isOpen={holdModal.isOpen}
        task={holdModal.task}
        onConfirm={handleConfirmHold}
        onCancel={handleCancelHold}
      />
    </div>
  );
}
