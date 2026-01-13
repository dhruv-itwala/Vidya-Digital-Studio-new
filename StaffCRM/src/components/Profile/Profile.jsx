import Loader from "../Loader/Loader";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";

import styles from "./Profile.module.css";
import { useState } from "react";
import { getMySalaryDeductionAPI } from "../../api/admin.api";
import { useEffect } from "react";

export default function Profile() {
  const { user, loading } = useAuth();
  const [salary, setSalary] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState("");

  function getPayrollCycle() {
    const today = new Date();

    let from, to;

    if (today.getDate() >= 11) {
      // this month 11 → next month 10
      from = new Date(today.getFullYear(), today.getMonth(), 11);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 10);
    } else {
      // last month 11 → this month 10
      from = new Date(today.getFullYear(), today.getMonth() - 1, 11);
      to = new Date(today.getFullYear(), today.getMonth(), 10);
    }

    const fmt = (d) => d.toISOString().slice(0, 10);

    return {
      from: fmt(from),
      to: fmt(to),
    };
  }

  useEffect(() => {
    if (!user || user.role === "admin") return;

    const loadSalary = async () => {
      try {
        setSalaryLoading(true);

        const { from, to } = getPayrollCycle();
        const res = await getMySalaryDeductionAPI(from, to);
        setSalary(res.data);
      } catch (e) {
        setSalaryError(e.message);
      } finally {
        setSalaryLoading(false);
      }
    };

    loadSalary();
  }, [user]);

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
            <span>Employee Id</span>
            <span>{user._id?.toUpperCase()}</span>
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

      {/* SALARY */}
      {/* {user.role !== "admin" && (
        <div className={styles.cardFull}>
          <h3>Salary (Current Cycle)</h3>

          {salaryLoading && <Loader />}
          {salaryError && <p className={styles.error}>{salaryError}</p>}

          {salary && (
            <div className={styles.salaryGrid}>
              <div>
                <span>Monthly Salary</span>
                <strong>₹ {salary.payableSalary + salary.deduction}</strong>
              </div>

              <div>
                <span>Working Days</span>
                <strong>{salary.totalWorkingDays}</strong>
              </div>

              <div>
                <span>Absent Days</span>
                <strong>{salary.absentDays}</strong>
              </div>

              <div>
                <span>Deduction</span>
                <strong className={styles.deduction}>
                  ₹ {salary.deduction}
                </strong>
              </div>

              <div>
                <span>Payable Salary</span>
                <strong className={styles.net}>₹ {salary.payableSalary}</strong>
              </div>
            </div>
          )}
        </div>
      )} */}
    </div>
  );
}
