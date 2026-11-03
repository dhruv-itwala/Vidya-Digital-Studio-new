import { useEffect, useState } from "react";
import {
  deleteUserAPI,
  getAllUsersForAdminAPI,
  inactiveUserAPI,
  toggleUserWifiRestrictionAPI,
} from "../../api/admin.api";
import EmployeeModal from "./EmployeeModal";
import TerminateEmployeeModal from "./TerminateEmployeeModal";
import TerminationDetailsModal from "./TerminationDetailsModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./AdminEmployees.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import InlineLoader from "../../components/UI/InlineLoader";
import { FaUserEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { FiPlus, FiUser, FiUserX, FiSlash, FiFileText } from "react-icons/fi";

export default function AdminEmployees() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [terminatingUser, setTerminatingUser] = useState(null);
  const [viewingTerminationUser, setViewingTerminationUser] = useState(null);
  const [subroleFilter, setSubroleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [togglingWifiId, setTogglingWifiId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "hr") {
      load();
    }
  }, [user]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllUsersForAdminAPI();
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (subroleFilter === "all") return true;
    return (u.subrole || "management").toLowerCase() === subroleFilter.toLowerCase();
  });

  const indexOfLastUser = currentPage * rowsPerPage;
  const currentUsers = filteredUsers.slice(
    indexOfLastUser - rowsPerPage,
    indexOfLastUser,
  );
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "hr") {
      toast.error("You do not have permission to view employees");
    }
  }, [user]);

  if (loading) return <Loader />;

  return (
    <div className={styles.pageContainer}>
      
      {/* ================= HEADER ================= */}
      <div className={styles.headerArea}>
        <div className={styles.titleBlock}>
          <h2 className={styles.pageTitle}>Employees</h2>
          <span className={styles.badge}>{users.length} Total Employees</span>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => setEditingUser({})}
        >
          <FiPlus className={styles.btnIcon} /> Add Employee
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className={styles.tableCard}>
        {/* Department Filter Bar */}
        <div className={styles.filterBar}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
            Department / Subrole:
          </label>
          <select
            className={styles.filterSelect}
            value={subroleFilter}
            onChange={(e) => {
              setSubroleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Departments ({users.length})</option>
            <option value="sales">Sales</option>
            <option value="designing">Designing</option>
            <option value="development">Development</option>
            <option value="editing">Editing</option>
            <option value="management">Management</option>
            <option value="administrative">Administrative</option>
          </select>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Department</th>
                <th>Office Wi-Fi</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className={styles.emptyState}>No employees found for this department.</div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className={styles.userCell}>
                        {u.profilePicture?.url ? (
                          <img
                            src={u.profilePicture.url}
                            alt={u.name}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            <FiUser />
                          </div>
                        )}
                        <span className={styles.businessName}>{u.name}</span>
                      </div>
                    </td>
                    
                    <td>
                      <span className={styles.dateText}>{u.email}</span>
                    </td>
                    
                    <td>
                      <span className={`${styles.rolePill} ${styles['role_' + u.role?.toLowerCase()]}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td>
                      <span className={`${styles.subrolePill} ${styles['subrole_' + (u.subrole || 'management').toLowerCase()]}`}>
                        {(u.subrole || "management").toUpperCase()}
                      </span>
                    </td>

                    <td>
                      <div className={styles.wifiCell}>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={u.requireOfficeWifi ?? false}
                            disabled={togglingWifiId === u._id || deletingId === u._id}
                            onChange={async () => {
                              const nextVal = !(u.requireOfficeWifi ?? false);
                              const modeName = nextVal
                                ? "Office Wi-Fi Required"
                                : "Anywhere (WFH / On-site)";
                              try {
                                setTogglingWifiId(u._id);
                                setUsers((prev) =>
                                  prev.map((item) =>
                                    item._id === u._id
                                      ? { ...item, requireOfficeWifi: nextVal }
                                      : item,
                                  ),
                                );
                                await toggleUserWifiRestrictionAPI(u._id, nextVal);
                                toast.success(`${u.name}: set to ${modeName}`);
                              } catch (err) {
                                setUsers((prev) =>
                                  prev.map((item) =>
                                    item._id === u._id
                                      ? { ...item, requireOfficeWifi: !nextVal }
                                      : item,
                                  ),
                                );
                                toast.error(
                                  err?.response?.data?.message ||
                                    err?.message ||
                                    "Failed to update Wi-Fi restriction",
                                );
                              } finally {
                                setTogglingWifiId(null);
                              }
                            }}
                          />
                          <span className={styles.slider}></span>
                        </label>
                        <span
                          className={`${styles.wifiPill} ${
                            u.requireOfficeWifi
                              ? styles.wifiOffice
                              : styles.wifiRemote
                          }`}
                        >
                          {u.requireOfficeWifi ? "Office Only" : "WFH / Anywhere"}
                        </span>
                      </div>
                    </td>
                    
                    <td>
                      <div className={styles.statusCell}>
                        {u.isTerminated ? (
                          <button
                            type="button"
                            className={styles.terminatedBadge}
                            onClick={() => setViewingTerminationUser(u)}
                            title="Click to view termination details"
                          >
                            <FiSlash size={11} />
                            <span>Terminated</span>
                          </button>
                        ) : (
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={u.isActive}
                              disabled={togglingId === u._id || deletingId === u._id}
                              onChange={async () => {
                                const action = u.isActive ? "Deactivate" : "Activate";
                                const ok = confirm(`${action} ${u.name}?`);
                                if (!ok) return;

                                try {
                                  setTogglingId(u._id);
                                  await inactiveUserAPI(u._id);
                                  toast.success(`${u.name} ${u.isActive ? "deactivated" : "activated"}`);
                                  await load();
                                } catch (err) {
                                  toast.error(err?.response?.data?.message || err?.message || `Failed to ${action.toLowerCase()} user`);
                                } finally {
                                  setTogglingId(null);
                                }
                              }}
                            />
                            <span className={styles.slider}></span>
                          </label>
                        )}
                      </div>
                    </td>
                    
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          disabled={togglingId === u._id || deletingId === u._id}
                          onClick={() => setEditingUser(u)}
                          className={styles.actionEdit}
                          title="Edit Employee"
                        >
                          <FaUserEdit />
                        </button>

                        {u.isTerminated ? (
                          <button
                            type="button"
                            onClick={() => setViewingTerminationUser(u)}
                            className={styles.actionInfo}
                            title="View Termination Record"
                          >
                            <FiFileText />
                          </button>
                        ) : (
                          (user.role === "admin" || user.role === "hr") && (
                            <button
                              type="button"
                              disabled={
                                togglingId === u._id ||
                                deletingId === u._id ||
                                (user.role === "hr" && u.role === "admin") ||
                                user._id === u._id
                              }
                              onClick={() => setTerminatingUser(u)}
                              className={styles.actionTerminate}
                              title={`Terminate ${u.name}`}
                            >
                              <FiUserX />
                            </button>
                          )
                        )}

                        {(user.role === "admin" || user.role === "hr") && (
                          <button
                            disabled={togglingId === u._id || deletingId === u._id}
                            onClick={async () => {
                              if (!confirm(`Delete ${u.name} permanently?`)) return;
                              try {
                                setDeletingId(u._id);
                                await deleteUserAPI(u._id);
                                toast.success("User deleted permanently");
                                await load();
                              } catch (err) {
                                toast.error(err?.response?.data?.message || err?.message || "Failed to delete user");
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            className={styles.actionDelete}
                            title="Delete Permanently"
                          >
                            {deletingId === u._id ? <InlineLoader size={14} /> : <MdDeleteForever />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={styles.pageBtn}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePage : ""}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}
      {editingUser && (
        <EmployeeModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            load();
          }}
        />
      )}

      {terminatingUser && (
        <TerminateEmployeeModal
          employee={terminatingUser}
          onClose={() => setTerminatingUser(null)}
          onSuccess={() => {
            setTerminatingUser(null);
            load();
          }}
        />
      )}

      {viewingTerminationUser && (
        <TerminationDetailsModal
          employee={viewingTerminationUser}
          onClose={() => setViewingTerminationUser(null)}
          onReactivated={() => {
            setViewingTerminationUser(null);
            load();
          }}
        />
      )}
    </div>
  );
}
