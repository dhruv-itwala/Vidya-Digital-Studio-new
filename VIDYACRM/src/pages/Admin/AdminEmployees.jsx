import { useEffect, useState } from "react";
import {
  deleteUserAPI,
  getAllUsersForAdminAPI,
  inactiveUserAPI,
} from "../../api/admin.api";
import EmployeeModal from "./EmployeeModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./AdminEmployees.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import { FaUserEdit } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { FiPlus, FiUser } from "react-icons/fi";

export default function AdminEmployees() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100);
  const [loading, setLoading] = useState(false);

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
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastUser = currentPage * rowsPerPage;
  const currentUsers = users.slice(
    indexOfLastUser - rowsPerPage,
    indexOfLastUser,
  );
  const totalPages = Math.ceil(users.length / rowsPerPage);

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
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className={styles.emptyState}>No employees found.</div>
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
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={u.isActive}
                          disabled={false}
                          onChange={async () => {
                            const action = u.isActive ? "Deactivate" : "Activate";
                            const ok = confirm(`${action} ${u.name}?`);
                            if (!ok) return;

                            await inactiveUserAPI(u._id);
                            toast.success(`${u.name} ${u.isActive ? "deactivated" : "activated"}`);
                            load();
                          }}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>
                    
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          disabled={false}
                          onClick={() => setEditingUser(u)}
                          className={styles.actionEdit}
                          title="Edit Employee"
                        >
                          <FaUserEdit />
                        </button>

                        {(user.role === "admin" || user.role === "hr") && (
                          <button
                            disabled={false}
                            onClick={async () => {
                              if (!confirm(`Delete ${u.name} permanently?`)) return;
                              await deleteUserAPI(u._id);
                              toast.success("User deleted permanently");
                              load();
                            }}
                            className={styles.actionDelete}
                            title="Delete Permanently"
                          >
                            <MdDeleteForever />
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

      {/* ================= MODAL ================= */}
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
    </div>
  );
}
