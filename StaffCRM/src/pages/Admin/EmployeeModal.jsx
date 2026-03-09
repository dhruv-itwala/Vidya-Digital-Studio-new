import { useState } from "react";
import { createUserAPI, updateUserAPI } from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext";
import styles from "./EmployeeModal.module.css";
import toast from "react-hot-toast";

export default function EmployeeModal({ user, onClose, onSaved }) {
  const { user: loggedInUser } = useAuth();
  const isEdit = Boolean(user._id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    password: "",
    designation: user.designation || "",
    joiningDate: user.joiningDate?.slice(0, 10) || "",
    dateOfBirth: user.dateOfBirth?.slice(0, 10) || "",
    contactNo: user.contactNo || "",
    gender: user.gender || "",
    address: user.address || "",
    personalEmail: user.personalEmail || "",
    role: user.role || "employee",
    salary: user.salary || "",
    isActive: user.isActive ?? true,
  });

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      isEdit
        ? await updateUserAPI(user._id, payload)
        : await createUserAPI(payload);

      onSaved();
      toast.success(`Employee ${isEdit ? "updated" : "created"} successfully`);
    } catch (err) {
      toast.error("Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions =
    loggedInUser.role === "admin"
      ? ["employee", "hr", "intern", "admin"]
      : ["employee", "hr", "intern"];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>
          {isEdit ? "Edit Employee" : "Create Employee"}
        </h2>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {/* Name + Email */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Jethalal Gada"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Phone No:</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                maxLength={10}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Work Email</label>
              <input
                type="email"
                placeholder="jetlalal@vidyadigitalstudio.in"
                value={form.email}
                disabled={isEdit}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Personal Email</label>
              <input
                type="email"
                placeholder="jethalalgada@gmail.com"
                value={form.personalEmail}
                onChange={(e) => handleChange("personalEmail", e.target.value)}
              />
            </div>
          </div>

          {/* Designation + Password */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Designation</label>
              <input
                type="text"
                placeholder="Owner"
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                placeholder={
                  isEdit ? "Leave blank to keep password" : "Create password"
                }
                onChange={(e) => handleChange("password", e.target.value)}
                required={!isEdit}
              />
            </div>
          </div>

          {/* Joining Date + DOB */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Joining Date</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact + Personal Email */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Contact Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.contactNo}
                onChange={(e) => handleChange("contactNo", e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Salary</label>
              <input
                type="number"
                placeholder="50000"
                value={form.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
              />
            </div>
          </div>

          {/* Gender + Role */}
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
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className={styles.formRow}>
            <div className={styles.inputGroupFull}>
              <label>Address</label>
              <textarea
                placeholder="Gokuldham Society,Powder gali East, Mumbai"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>

          {/* Active */}
          <div className={styles.checkboxContainer}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
              />
              <span className={styles.slider}></span>
              <span className={styles.labelText}>Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
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
        </form>
      </div>
    </div>
  );
}
