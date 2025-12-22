import { useEffect, useState } from "react";
import { getAllUsersAPI } from "../../api/admin.api";
import EmployeeModal from "./EmployeeModal";
import styles from "./AdminEmployees.module.css";

export default function AdminEmployees() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5); // Change this number as needed

  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / rowsPerPage);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getAllUsersAPI();
    setUsers(res.data);
  };

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

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Edit</th>
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
                      className={styles.editBtn}
                      onClick={() => setEditingUser(u)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.pagination}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? styles.activePage : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>

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
