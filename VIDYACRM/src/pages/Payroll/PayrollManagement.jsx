// VIDYACRM/src/pages/Payroll/PayrollManagement.jsx
import React, { useState, useEffect } from "react";
import {
  generatePayrollsAPI,
  getPayrollsByMonthAPI,
  updatePayrollAPI,
  sendPayslipAPI,
} from "../../api/payroll.api";
import styles from "./Payroll.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import Button from "../../components/UI/Button";
import {
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiCheck,
  FiSend,
  FiEdit2,
  FiCheckCircle,
} from "react-icons/fi";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollManagement() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Track inline edited deductions
  const [editedDeductions, setEditedDeductions] = useState({});
  const [savingDeductionId, setSavingDeductionId] = useState(null);

  // Track partial payment editing
  const [editingPartialId, setEditingPartialId] = useState(null);
  const [partialPaidInput, setPartialPaidInput] = useState("");

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await getPayrollsByMonthAPI(month, year);
      const list = res.data.data || [];
      setPayrolls(list);

      // Pre-fill edited deductions
      const dedMap = {};
      list.forEach((p) => {
        dedMap[p._id] = p.deductions || 0;
      });
      setEditedDeductions(dedMap);
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

  // Payout calculation rule: Work month M is paid on 10th of Month M+1
  const workMonthName = MONTH_NAMES[month - 1];
  const nextMonthName = MONTH_NAMES[month % 12];
  const payoutYear = month === 12 ? year + 1 : year;
  const lastDayOfWorkMonth = new Date(year, month, 0).getDate();

  // Save edited deduction
  const handleSaveDeduction = async (id, baseSalary) => {
    const val = Number(editedDeductions[id]) || 0;
    if (val < 0) return toast.error("Deduction cannot be negative");

    try {
      setSavingDeductionId(id);
      await updatePayrollAPI(id, { deductions: val });
      toast.success("Deduction updated");
      await fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update deduction");
    } finally {
      setSavingDeductionId(null);
    }
  };

  // Status dropdown change
  const handleStatusChange = async (payroll, newStatus) => {
    if (newStatus === "partial paid") {
      setEditingPartialId(payroll._id);
      setPartialPaidInput(payroll.paidAmount || Math.round(payroll.netPay / 2));
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [payroll._id]: true }));
      await updatePayrollAPI(payroll._id, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      await fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [payroll._id]: false }));
    }
  };

  // Save partial payment
  const handleSavePartial = async (id, netPay) => {
    const numPaid = Number(partialPaidInput);
    if (isNaN(numPaid) || numPaid <= 0) {
      return toast.error("Please enter a valid partial amount");
    }
    if (numPaid >= netPay) {
      return toast.error("Partial amount must be less than net payable. Choose 'Salary paid' instead.");
    }

    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await updatePayrollAPI(id, {
        status: "partial paid",
        paidAmount: numPaid,
        pendingAmount: Math.max(0, netPay - numPaid),
      });
      toast.success("Partial payment updated");
      setEditingPartialId(null);
      await fetchPayrolls();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save partial payment");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSendPayslip = async (id) => {
    if (actionLoading[id]) return;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "sending" }));
      const res = await sendPayslipAPI(id);
      toast.success(res.data?.message || "Payslip sent successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to send payslip");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Aggregated totals
  const totalBaseSalary = payrolls.reduce((acc, p) => acc + (p.baseSalary || 0), 0);
  const totalDeductions = payrolls.reduce((acc, p) => acc + (p.deductions || 0), 0);
  const totalNetPayable = payrolls.reduce((acc, p) => acc + (p.netPay || 0), 0);
  const totalPaidOut = payrolls.reduce((acc, p) => {
    const s = (p.status || "").toLowerCase();
    if (s === "salary paid" || s === "paid") return acc + (p.netPay || 0);
    if (s === "partial paid") return acc + (p.paidAmount || 0);
    return acc;
  }, 0);
  const totalPendingPayout = Math.max(0, totalNetPayable - totalPaidOut);

  return (
    <div className="masterContainer">
      <div className={styles.pageContainer}>
        {/* ================= HEADER ================= */}
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h2 className={styles.title}>Payroll &amp; Employee Salary</h2>
          </div>

          <div className={styles.controls}>
            <select
              className={styles.select}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="number"
              className={styles.select}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={2100}
              style={{ width: "90px" }}
            />
            <Button
              className={styles.primaryBtn}
              loading={generating}
              loadingText="Generating..."
              onClick={handleGenerate}
            >
              <FiCalendar size={15} />
              <span>Generate Monthly Payrolls</span>
            </Button>
          </div>
        </div>

        {/* ================= SALARY SCHEDULE BANNER ================= */}
        <div className={styles.scheduleBanner}>
          <div className={styles.scheduleInfo}>
            <div className={styles.scheduleIcon}>
              <FiClock />
            </div>
            <div>
              <div className={styles.scheduleTitle}>
                Official Studio Salary Cycle (10th-of-Month Rule)
              </div>
              <div className={styles.scheduleSub}>
                Work Period: <strong>1st {workMonthName} – {lastDayOfWorkMonth}th {workMonthName} {year}</strong>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}>
                Studio Policy: Full Absent = 1 Day Deduction (Salary / 30) &bull; Late Punch-in (&gt;10:30 AM) = Half Day Deduction (Salary / 60)
              </div>
            </div>
          </div>

          <div className={styles.payoutBadge}>
            <FiCheckCircle color="#0f5c44" size={16} />
            <span>Scheduled Payout: 10th {nextMonthName} {payoutYear}</span>
          </div>
        </div>

        {/* ================= SUMMARY STATS STRIP ================= */}
        <div className={styles.summaryStrip}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Base Salary</div>
            <div className={styles.summaryVal}>₹{totalBaseSalary.toLocaleString("en-IN")}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Total Deductions</div>
            <div className={styles.summaryVal} style={{ color: "#dc2626" }}>
              -₹{totalDeductions.toLocaleString("en-IN")}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Net Payable Amount</div>
            <div className={styles.summaryVal} style={{ color: "#0f5c44" }}>
              ₹{totalNetPayable.toLocaleString("en-IN")}
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>Disbursed vs Pending</div>
            <div className={styles.summaryVal} style={{ fontSize: "1.1rem" }}>
              <span style={{ color: "#0f5c44" }}>₹{totalPaidOut.toLocaleString("en-IN")}</span> /{" "}
              <span style={{ color: "#d97706" }}>₹{totalPendingPayout.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* ================= SALARY TABLE ================= */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Work Month &amp; Payout</th>
                <th>Base Salary</th>
                <th>Deducted Amount (Editable)</th>
                <th>Payable Amount</th>
                <th>Salary Status</th>
                <th style={{ textAlign: "right" }}>Pending / Paid Detail</th>
                {/* <th style={{ textAlign: "right" }}>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                    <Loader />
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
                    No payrolls generated for {workMonthName} {year}. Click "Generate Monthly Payrolls" above.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => {
                  const rawStatus = p.status || "Pending";
                  const normalizedStatus =
                    rawStatus === "PAID" || rawStatus === "Salary paid"
                      ? "Salary paid"
                      : rawStatus === "partial paid" || rawStatus === "PARTIALLY_PAID"
                      ? "partial paid"
                      : "Pending";

                  const currentDeduction =
                    editedDeductions[p._id] !== undefined ? editedDeductions[p._id] : p.deductions;
                  const calculatedPayable = Math.max(0, p.baseSalary - (Number(currentDeduction) || 0));
                  const isDeductionModified = Number(currentDeduction) !== Number(p.deductions);

                  let statusSelectClass = styles.status_pending;
                  if (normalizedStatus === "Salary paid") statusSelectClass = styles.status_paid;
                  if (normalizedStatus === "partial paid") statusSelectClass = styles.status_partial_paid;

                  return (
                    <tr key={p._id}>
                      {/* Employee Info */}
                      <td>
                        <div
                          style={{
                            fontWeight: 800,
                            color: "#0f172a",
                            fontSize: "0.95rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{p.user?.name || "Employee"}</span>
                          {p.user?.isTerminated && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                              }}
                              title={
                                p.user?.terminationDate
                                  ? `Terminated on ${new Date(p.user.terminationDate).toLocaleDateString("en-IN")}`
                                  : "Terminated Employee"
                              }
                            >
                              Terminated
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {p.user?.designation || "Staff"} · {p.user?.email}
                          {p.user?.isTerminated && p.user?.terminationDate && (
                            <span style={{ color: "#b91c1c", marginLeft: "4px", fontWeight: 600 }}>
                              · Exit: {new Date(p.user.terminationDate).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Month & Payout Date */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f5c44" }}>
                          {workMonthName} {year}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Payout: 10th {nextMonthName}
                        </div>
                      </td>

                      {/* Base Salary */}
                      <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        ₹{(p.baseSalary || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Deducted Amount (Editable) */}
                      <td>
                        <div className={styles.deductionInputWrap}>
                          <span style={{ color: "#dc2626", fontWeight: 700 }}>-₹</span>
                          <input
                            type="number"
                            min="0"
                            max={p.baseSalary}
                            className={styles.deductionInput}
                            value={currentDeduction}
                            onChange={(e) =>
                              setEditedDeductions((prev) => ({
                                ...prev,
                                [p._id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveDeduction(p._id, p.baseSalary);
                            }}
                          />
                          {isDeductionModified && (
                            <button
                              type="button"
                              className={styles.saveDeductionBtn}
                              onClick={() => handleSaveDeduction(p._id, p.baseSalary)}
                              disabled={savingDeductionId === p._id}
                              title="Save deduction"
                            >
                              <FiCheck size={12} />
                            </button>
                          )}
                        </div>
                        {(p.absentDays > 0 || p.lateDays > 0 || p.leaveDays > 0) && (
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                            {p.absentDays > 0 && (
                              <span style={{ color: "#dc2626" }}>
                                • {p.absentDays} absent {p.absentDays > 1 ? "days" : "day"} (-₹{(p.absentDeductions || Math.round(p.absentDays * (p.baseSalary / 30))).toLocaleString("en-IN")})
                              </span>
                            )}
                            {p.lateDays > 0 && (
                              <span style={{ color: "#d97706" }}>
                                • {p.lateDays} late / half-day{p.lateDays > 1 ? "s" : ""} (-₹{(p.lateDeductions || Math.round(p.lateDays * (p.baseSalary / 60))).toLocaleString("en-IN")})
                              </span>
                            )}
                            {p.leaveDays > 0 && (
                              <span style={{ color: "#059669", fontWeight: 600 }}>
                                • {p.leaveDays} approved leave{p.leaveDays > 1 ? "s" : ""} (paid · ₹0)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Payable Amount */}
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: "#0f5c44",
                            fontSize: "1.05rem",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ₹{calculatedPayable.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td>
                        <select
                          className={`${styles.statusSelect} ${statusSelectClass}`}
                          value={normalizedStatus}
                          disabled={actionLoading[p._id]}
                          onChange={(e) => handleStatusChange(p, e.target.value)}
                        >
                          <option value="Salary paid">Salary paid</option>
                          <option value="Pending">Pending</option>
                          <option value="partial paid">partial paid</option>
                        </select>
                      </td>

                      {/* Pending / Paid Detail */}
                      <td>
                        {normalizedStatus === "Salary paid" && (
                          <span style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 700 }}>
                            Paid in Full (₹{p.netPay?.toLocaleString("en-IN")})
                          </span>
                        )}

                        {normalizedStatus === "Pending" && (
                          <span style={{ fontSize: "0.8rem", color: "#b45309", fontWeight: 700 }}>
                            Pending: ₹{p.netPay?.toLocaleString("en-IN")}
                          </span>
                        )}

                        {normalizedStatus === "partial paid" && (
                          <div>
                            {editingPartialId === p._id ? (
                              <div className={styles.partialBox}>
                                <span>Paid (₹):</span>
                                <input
                                  type="number"
                                  className={styles.partialInput}
                                  value={partialPaidInput}
                                  onChange={(e) => setPartialPaidInput(e.target.value)}
                                  placeholder="0"
                                />
                                <button
                                  type="button"
                                  className={styles.saveDeductionBtn}
                                  onClick={() => handleSavePartial(p._id, p.netPay)}
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <div style={{ fontSize: "0.8rem" }}>
                                <span style={{ color: "#0f5c44", fontWeight: 700 }}>
                                  Paid: ₹{(p.paidAmount || 0).toLocaleString("en-IN")}
                                </span>{" "}
                                ·{" "}
                                <span style={{ color: "#dc2626", fontWeight: 700 }}>
                                  Pending: ₹{(p.pendingAmount ?? (p.netPay - (p.paidAmount || 0))).toLocaleString("en-IN")}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPartialId(p._id);
                                    setPartialPaidInput(p.paidAmount || 0);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#64748b",
                                    marginLeft: "4px",
                                  }}
                                  title="Adjust partial amount"
                                >
                                  <FiEdit2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      {/* <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={styles.sendBtn}
                          disabled={Boolean(actionLoading[p._id])}
                          onClick={() => handleSendPayslip(p._id)}
                          title="Email Payslip PDF to employee"
                        >
                          <FiSend size={11} style={{ marginRight: "4px" }} />
                          <span>{actionLoading[p._id] === "sending" ? "Sending..." : "Payslip"}</span>
                        </button>
                      </td> */}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
