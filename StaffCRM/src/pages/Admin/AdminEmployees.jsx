import { useEffect, useState } from "react";
import { getAllUsersAPI, deleteUserAPI } from "../../api/admin.api";
import EmployeeModal from "./EmployeeModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./AdminEmployees.module.css";

export default function AdminEmployees() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "hr") {
      load();
    }
  }, [user]);

  const load = async () => {
    const res = await getAllUsersAPI();
    setUsers(res.data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this employee?")) return;
    await deleteUserAPI(id);
    load();
  };

  const indexOfLastUser = currentPage * rowsPerPage;
  const currentUsers = users.slice(
    indexOfLastUser - rowsPerPage,
    indexOfLastUser
  );

  if (!user || (user.role !== "admin" && user.role !== "hr")) {
    return <p>Access denied</p>;
  }

  return (
    <div className="masterContainer" style={{ flexDirection: "column" }}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Employees</h2>
          <button
            className={styles.createBtn}
            onClick={() => setEditingUser({})}
          >
            + Create Employee
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Edit</th>
              {/* <th>Delete</th> */}
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
                    disabled={user.role === "hr" && u.role === "admin"}
                    onClick={() => setEditingUser(u)}
                    className={styles.editBtn}
                  >
                    Edit
                  </button>
                </td>
                {/* <td>
                  <button
                    disabled={user.role === "hr" && u.role === "admin"}
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(u._id)}
                  >
                    Deactivate
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>

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
