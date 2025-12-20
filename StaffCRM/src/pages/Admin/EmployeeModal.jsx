import { useState } from "react";
import { createUserAPI, updateUserAPI } from "../../api/admin.api";
import styles from "./EmployeeModal.module.css";

export default function EmployeeModal({ user, onClose, onSaved }) {
  const isEdit = !!user._id;

  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    designation: user.designation || "",
    password: "",
    role: user.role || "employee",
    isActive: user.isActive ?? true,
    joiningDate: user.joiningDate ? user.joiningDate.slice(0, 10) : "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    contactNo: user.contactNo || "",
    gender: user.gender || "",
    address: user.address || "",
    personalEmail: user.personalEmail || "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const submit = async () => {
    try {
      if (isEdit) {
        const { password, ...updateData } = form;
        await updateUserAPI(user._id, updateData);
      } else {
        await createUserAPI(form);
      }
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>{isEdit ? "Edit Employee" : "Create Employee"}</h3>

        <div className={styles.tableForm}>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <label htmlFor="email">Work Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            disabled={isEdit}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <label htmlFor="designation">Designation</label>
          <input
            id="designation"
            value={form.designation}
            onChange={(e) => handleChange("designation", e.target.value)}
          />

          {!isEdit && (
            <>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </>
          )}

          <label htmlFor="personalEmail">Personal Email</label>
          <input
            id="personalEmail"
            type="email"
            value={form.personalEmail}
            onChange={(e) => handleChange("personalEmail", e.target.value)}
          />

          <label htmlFor="contactNo">Contact Number</label>
          <input
            id="contactNo"
            type="tel"
            value={form.contactNo}
            onChange={(e) => handleChange("contactNo", e.target.value)}
          />

          <label htmlFor="joiningDate">Joining Date</label>
          <input
            id="joiningDate"
            type="date"
            value={form.joiningDate}
            onChange={(e) => handleChange("joiningDate", e.target.value)}
          />

          <label htmlFor="dateOfBirth">Date of Birth</label>
          <input
            id="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
          />

          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            value={form.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />

          <label className={styles.checkbox}>
            Active
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button onClick={submit}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
