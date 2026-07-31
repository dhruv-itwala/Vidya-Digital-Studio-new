import { useState } from "react";
import styles from "../ClientForm.module.css";
import toast from "react-hot-toast";

export default function ClientTransactions({
  form,
  setForm,
  readOnly,
  isCreate,
  addTransaction,
  updateTransaction,
  deleteTransaction,
}) {
  const [loadingId, setLoadingId] = useState(null);

  /* ================= ADD ROW ================= */
  const handleAddRow = () => {
    setForm((prev) => ({
      ...prev,
      transactions: [
        ...(prev.transactions || []),
        {
          amount: "",
          method: "",
          note: "",
          date: "",
          isNew: true,
        },
      ],
    }));
  };

  /* ================= SAVE / UPDATE ================= */
  const handleSave = async (txn, index) => {
    if (!txn.amount) return toast.error("Amount required");

    try {
      setLoadingId(index);

      const cleanData = {
        amount: Number(txn.amount),
        method: txn.method,
        note: txn.note,
        date: txn.date,
      };

      let res;

      if (txn.isNew) {
        res = await addTransaction(form._id, cleanData);
        toast.success("Transaction added");
      } else {
        res = await updateTransaction(form._id, txn._id, cleanData);
        toast.success("Transaction updated");
      }

      if (!res.success) throw new Error(res.message);

      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (txn) => {
    try {
      setLoadingId(txn._id);

      const res = await deleteTransaction(form._id, txn._id);

      if (!res.success) throw new Error(res.message);

      toast.success("Transaction deleted");

      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const transactions = form.transactions || [];

  /* ===== TOTAL PAID ===== */
  const totalPaid = transactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0,
  );

  /* ===== MONTHLY PAID ===== */
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyPaid = transactions
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  /* ===== LAST PAYMENT ===== */
  const lastPayment =
    transactions.length > 0
      ? [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;

  /* ================= EDIT ================= */
  const handleEdit = (index) => {
    const updated = [...form.transactions];
    updated[index].isEditing = true;

    setForm((prev) => ({
      ...prev,
      transactions: updated,
    }));
  };

  /* ================= CANCEL ================= */
  const handleCancel = (index) => {
    const txn = form.transactions[index];

    if (txn.isNew) {
      const updated = form.transactions.filter((_, i) => i !== index);
      setForm((prev) => ({
        ...prev,
        transactions: updated,
      }));
    } else {
      const updated = [...form.transactions];
      updated[index].isEditing = false;

      setForm((prev) => ({
        ...prev,
        transactions: updated,
      }));
    }
  };

  const normalDate = (date) => {
    return new Date(date).toLocaleDateString("en-CA");
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Transactions</h3>

        {!readOnly && !isCreate && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAddRow}
          >
            + Add Transaction
          </button>
        )}
      </div>
      <div className={styles.paymentSummary}>
        <div className={styles.summaryCard}>
          <span>Total Paid</span>
          <strong>₹ {totalPaid.toLocaleString()}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>This Month</span>
          <strong>₹ {monthlyPaid.toLocaleString()}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>Last Payment</span>
          <strong>
            {lastPayment
              ? new Date(lastPayment.date).toLocaleDateString("en-IN")
              : "-"}
          </strong>
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Note</th>
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {form.transactions?.length === 0 && (
              <tr>
                <td colSpan="5" className={styles.empty}>
                  No transactions added
                </td>
              </tr>
            )}

            {form.transactions?.map((txn, index) => {
              const editable = txn.isNew || txn.isEditing;

              return (
                <tr key={txn._id || index}>
                  {/* DATE */}
                  <td>
                    {editable ? (
                      <input
                        type="date"
                        value={txn.date}
                        onChange={(e) => {
                          const updated = [...form.transactions];
                          updated[index].date = e.target.value;

                          setForm((prev) => ({
                            ...prev,
                            transactions: updated,
                          }));
                        }}
                      />
                    ) : (
                      normalDate(txn.date)
                    )}
                  </td>

                  {/* AMOUNT */}
                  <td>
                    {editable ? (
                      <input
                        type="number"
                        value={txn.amount}
                        onChange={(e) => {
                          const updated = [...form.transactions];
                          updated[index].amount = e.target.value;

                          setForm((prev) => ({
                            ...prev,
                            transactions: updated,
                          }));
                        }}
                      />
                    ) : (
                      `₹ ${txn.amount}`
                    )}
                  </td>

                  {/* METHOD */}
                  <td>
                    {editable ? (
                      <input
                        value={txn.method}
                        placeholder="UPI / Cash / Bank"
                        onChange={(e) => {
                          const updated = [...form.transactions];
                          updated[index].method = e.target.value;

                          setForm((prev) => ({
                            ...prev,
                            transactions: updated,
                          }));
                        }}
                      />
                    ) : (
                      txn.method || "-"
                    )}
                  </td>

                  {/* NOTE */}
                  <td>
                    {editable ? (
                      <input
                        value={txn.note}
                        placeholder="Optional note"
                        onChange={(e) => {
                          const updated = [...form.transactions];
                          updated[index].note = e.target.value;

                          setForm((prev) => ({
                            ...prev,
                            transactions: updated,
                          }));
                        }}
                      />
                    ) : (
                      txn.note || "-"
                    )}
                  </td>

                  {/* ACTIONS */}
                  {!readOnly && (
                    <td>
                      {editable ? (
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.primaryBtn}
                            disabled={loadingId === index}
                            onClick={() => handleSave(txn, index)}
                          >
                            {loadingId === index ? "Saving..." : "Save"}
                          </button>

                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleCancel(index)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.secondaryBtn}
                            onClick={() => handleEdit(index)}
                          >
                            Edit
                          </button>

                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(txn)}
                          >
                            {loadingId === txn._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
