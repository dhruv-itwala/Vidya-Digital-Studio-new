import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";

import styles from "./EmployeeProfile.module.css";

export default function EmployeeProfile() {
  const { user, loading } = useAuth();

  if (!user) return null;
  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.avatar}>{getInitials(user.name)}</div>

        <div className={styles.headerInfo}>
          <h2>{user.name}</h2>
          <p className={styles.role}>{user.role.toUpperCase()}</p>
          <span
            className={`${styles.status} ${
              user.isActive ? styles.active : styles.inactive
            }`}
          >
            {user.isActive ? "Active Employee" : "Inactive"}
          </span>
        </div>
      </div>

      {/* DETAILS */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>Contact Information</h3>

          <div className={styles.row}>
            <span>Email (Official)</span>
            <span>{user.email}</span>
          </div>

          <div className={styles.row}>
            <span>Email (Personal)</span>
            <span>{user.personalEmail || "-"}</span>
          </div>

          <div className={styles.row}>
            <span>Contact No</span>
            <span>{user.contactNo || "-"}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Work Details</h3>

          <div className={styles.row}>
            <span>Joining Date</span>
            <span>
              {user.joiningDate
                ? new Date(user.joiningDate).toLocaleDateString()
                : "-"}
            </span>
          </div>

          <div className={styles.row}>
            <span>Gender</span>
            <span>{user.gender || "-"}</span>
          </div>
        </div>

        <div className={styles.cardFull}>
          <h3>Address</h3>
          <p className={styles.address}>{user.address || "-"}</p>
        </div>
      </div>
    </div>
  );
}
