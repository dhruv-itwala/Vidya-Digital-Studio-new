import { useEffect, useState } from "react";
import { getAllUsersAPI } from "../../api/admin.api";
import EmployeeModal from "./EmployeeModal";
import styles from "./Employees.module.css";

export default function AdminEmployees() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getAllUsersAPI();
    setUsers(res.data);
  };

  return (
    <div className={styles.container}>
      <h2>Employees</h2>
      <button onClick={() => setEditingUser({})}>+ Create Employee</button>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Active</th>
            <th>Edit</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isActive ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => setEditingUser(u)}>Edit</button>
              </td>
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
  );
}
