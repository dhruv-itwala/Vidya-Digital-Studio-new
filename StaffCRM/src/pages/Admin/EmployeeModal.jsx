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
        <div className={styles.actions}>
          <h2 className={styles.modalTitle}>
            {isEdit ? "Edit Employee" : "Create Employee"}
          </h2>
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.saveBtn}>
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Jethalal Gada"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Work Email</label>
              <input
                type="email"
                value={form.email}
                disabled={isEdit}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="jethalal@vidyadigitalstudio.in"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
                placeholder="Sales Manager"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Personal Email</label>
              <input
                type="email"
                value={form.personalEmail}
                onChange={(e) => handleChange("personalEmail", e.target.value)}
                placeholder="jethalal.gadaelectronics@gmail.com"
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Contact Number</label>
              <input
                type="tel"
                value={form.contactNo}
                onChange={(e) => handleChange("contactNo", e.target.value)}
                placeholder="98765 43210"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Joining Date</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Role</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroupFull}>
              <label>Address</label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Gada Electronics, 123, MG Road, Mumbai, Maharashtra, India"
              />
            </div>
          </div>

          <div className={styles.checkboxContainer}>
            <label>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
              />
              Active
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}
