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
import { MdDelete } from "react-icons/md";

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
    <div className="masterContainer" style={{ flexDirection: "column" }}>
      <div className={styles.container}>
        {/* ================= HEADER ================= */}
        <div className={styles.header}>
          <h2>Employees</h2>
          <button
            className={styles.createBtn}
            onClick={() => setEditingUser({})}
          >
            + Create Employee
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th colSpan={3}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role.toUpperCase()}</td>
                  <td className={u.isActive ? styles.active : styles.inactive}>
                    {u.isActive ? "Active" : "Inactive"}
                  </td>
                  <td>
                    <button
                      disabled={
                        (user.role === "hr" && u.role === "admin") ||
                        u._id === user.id
                      }
                      onClick={() => setEditingUser(u)}
                      className={styles.editBtn}
                    >
                      <FaUserEdit />
                    </button>
                  </td>

                  <td>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={u.isActive}
                        disabled={user.role === "hr" && u.role === "admin"}
                        onChange={async () => {
                          const action = u.isActive ? "Deactivate" : "Activate";
                          const ok = confirm(`${action} ${u.name}?`);
                          if (!ok) return;

                          await inactiveUserAPI(u._id);

                          toast.success(
                            `${u.name} ${u.isActive ? "deactivated" : "activated"}`,
                          );

                          load();
                        }}
                      />
                      <span className={styles.slider}></span>
                      <span className={styles.labelText}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </td>

                  {user.role === "admin" && (
                    <td>
                      <button
                        disabled={u.role === "admin"}
                        onClick={async () => {
                          if (!confirm(`Delete ${u.name} permanently?`)) return;
                          await deleteUserAPI(u._id);
                          toast.success("User deleted permanently");
                          load();
                        }}
                        className={styles.deleteBtn}
                      >
                        <MdDelete />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={currentPage === i + 1 ? styles.activePage : ""}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

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
    </div>
  );
}
