// VIDYACRM/src/pages/Finance/ExpenseModal.jsx
import React, { useState } from "react";
import { createExpenseAPI, updateExpenseAPI } from "../../api/finance.api";
import styles from "./ExpensesPage.module.css";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";

export default function ExpenseModal({ isOpen, onClose, expense, onSaved }) {
  const isEdit = Boolean(expense?._id);

  const [form, setForm] = useState({
    name: expense?.name || "",
    category: expense?.category || "Subscription",
    amount: expense?.amount || "",
    frequency: expense?.frequency || "Monthly",
    dueDate: expense?.dueDate ? expense.dueDate.slice(0, 10) : "",
    vendor: expense?.vendor || "",
    department: expense?.department || "All",
    status: expense?.status || "Pending",
    notes: expense?.notes || "",
  });

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.dueDate) {
      return toast.error("Please fill in Name, Amount, and Due Date.");
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (isEdit) {
        await updateExpenseAPI(expense._id, payload);
        toast.success("Expense updated successfully");
      } else {
        await createExpenseAPI(payload);
        toast.success("Expense created successfully");
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEdit ? "Edit Expense / Subscription" : "Add New Expense / Bill"}
          </h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Expense Title <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Adobe Creative Cloud, Studio Rent, Canva Team"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <select
                  className={styles.formSelect}
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  <option value="Subscription">Subscription (Software / Tools)</option>
                  <option value="Bill">Utility Bill (Electricity, WiFi, Rent)</option>
                  <option value="Vendor">Vendor / Freelancer / Creator Payout</option>
                  <option value="Recurring">Other Recurring</option>
                  <option value="One-Time">One-Time Equipment / Misc</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Amount (₹) <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.formInput}
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Frequency</label>
                <select
                  className={styles.formSelect}
                  value={form.frequency}
                  onChange={(e) => handleChange("frequency", e.target.value)}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="One-Time">One-Time</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Due Date <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={form.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vendor / Provider</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Adobe Systems, Landlord, AWS"
                  value={form.vendor}
                  onChange={(e) => handleChange("vendor", e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Department / Subrole</label>
                <select
                  className={styles.formSelect}
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                >
                  <option value="All">All Studio / General</option>
                  <option value="sales">Sales</option>
                  <option value="designing">Designing</option>
                  <option value="development">Development</option>
                  <option value="editing">Editing</option>
                  <option value="management">Management</option>
                  <option value="administrative">Administrative</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes / Remarks</label>
              <textarea
                className={styles.formTextarea}
                rows={2}
                placeholder="Optional notes or subscription details..."
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Expense" : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

