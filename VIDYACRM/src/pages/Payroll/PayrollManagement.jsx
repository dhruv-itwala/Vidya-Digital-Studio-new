import { useState, useEffect } from "react";
import { generatePayrollsAPI, getPayrollsByMonthAPI, markPayrollPaidAPI, sendPayslipAPI } from "../../api/payroll.api";
import styles from "./Payroll.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import Button from "../../components/UI/Button";

export default function PayrollManagement() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await getPayrollsByMonthAPI(month, year);
      setPayrolls(res.data.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to fetch payrolls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const handleGenerate = async () => {
    if (generating) return;
    try {
      setGenerating(true);
      await generatePayrollsAPI({ month, year });
      toast.success("Payrolls generated successfully");
      await fetchPayrolls();
    } catch (err) {
      toast.error(err?.message || err.response?.data?.message || "Failed to generate payrolls");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    if (actionLoading[id]) return;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "paying" }));
      await markPayrollPaidAPI(id);
      toast.success("Marked as paid");
      await fetchPayrolls();
    } catch (err) {
      toast.error(err?.message || "Failed to mark as paid");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleSendPayslip = async (id) => {
    if (actionLoading[id]) return;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "sending" }));
      const res = await sendPayslipAPI(id);
      toast.success(res.data.message || "Payslip sent successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to send payslip");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Payroll Management</h2>
        <div className={styles.controls}>
          <select className={styles.select} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <input
            type="number"
            className={styles.select}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2000}
            max={2100}
          />
          <Button
            className={styles.primaryBtn}
            loading={generating}
            loadingText="Generating..."
            onClick={handleGenerate}
          >
            Generate Payrolls
          </Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Base Salary</th>
              <th>Absents</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7">
                  <Loader />
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>No payrolls generated for this month.</td>
              </tr>
            ) : (
              payrolls.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.user?.name}</strong><br/>
                    <small>{p.user?.email}</small>
                  </td>
                  <td>₹{p.baseSalary}</td>
                  <td>{p.absentDays}</td>
                  <td style={{ color: "red" }}>-₹{p.deductions}</td>
                  <td style={{ fontWeight: 600, color: "green" }}>₹{p.netPay}</td>
                  <td className={styles[`status_${p.status.toLowerCase()}`]}>{p.status}</td>
                  <td>
                    {p.status === "DRAFT" ? (
                      <button
                        className={styles.actionBtn}
                        disabled={Boolean(actionLoading[p._id])}
                        onClick={() => handleMarkPaid(p._id)}
                      >
                        {actionLoading[p._id] === "paying" ? "Marking..." : "Mark Paid"}
                      </button>
                    ) : (
                      <button
                        className={styles.sendBtn}
                        disabled={Boolean(actionLoading[p._id])}
                        onClick={() => handleSendPayslip(p._id)}
                      >
                        {actionLoading[p._id] === "sending" ? "Sending..." : "Email Payslip"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
