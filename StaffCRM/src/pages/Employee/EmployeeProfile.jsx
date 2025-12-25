import Loader from "../../components/Loader/Loader";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";

import styles from "./EmployeeProfile.module.css";

export default function EmployeeProfile() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return null;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "-";

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.avatar}>{getInitials(user.name)}</div>

        <div className={styles.headerInfo}>
          <h2>{user.name}</h2>
          <p className={styles.role}>{user.designation || "-"}</p>

          {/* <span
            className={`${styles.status} ${
              user.isActive ? styles.active : styles.inactive
            }`}
          >
            {user.isActive ? "Active Employee" : "Inactive"}
          </span> */}
        </div>
      </div>

      {/* DETAILS */}
      <div className={styles.grid}>
        {/* WORK DETAILS */}
        <div className={styles.card}>
          <h3>Work Details</h3>
          <div className={styles.row}>
            <span>Official Email</span>
            <span>{user.email}</span>
          </div>

          <div className={styles.row}>
            <span>Role</span>
            <span>{user.role?.toUpperCase()}</span>
          </div>

          <div className={styles.row}>
            <span>Designation</span>
            <span>{user.designation || "-"}</span>
          </div>

          <div className={styles.row}>
            <span>Joining Date</span>
            <span>{formatDate(user.joiningDate)}</span>
          </div>
        </div>

        {/* PERSONAL DETAILS */}
        <div className={styles.card}>
          <h3>Personal Details</h3>

          <div className={styles.row}>
            <span>Date of Birth</span>
            <span>{formatDate(user.dateOfBirth)}</span>
          </div>
          <div className={styles.row}>
            <span>Personal Email</span>
            <span>{user.personalEmail || "-"}</span>
          </div>
          <div className={styles.row}>
            <span>Contact No</span>
            <span>{user.contactNo || "-"}</span>
          </div>
          <div className={styles.row}>
            <span>Gender</span>
            <span>{user.gender.toUpperCase() || "-"}</span>
          </div>
        </div>

        {/* ADDRESS */}
        <div className={styles.cardFull}>
          <h3>Address</h3>
          <p className={styles.address}>{user.address || "-"}</p>
        </div>
      </div>
    </div>
  );
}
