import { useState, useEffect } from "react";
import { getMyPayslipsAPI, sendPayslipAPI } from "../../api/payroll.api";
import styles from "./Payroll.module.css";
import toast from "react-hot-toast";

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);

  const fetchPayslips = async () => {
    try {
      const res = await getMyPayslipsAPI();
      setPayslips(res.data.data);
    } catch (err) {
      toast.error("Failed to load payslips");
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleDownload = async (id) => {
    try {
      const res = await sendPayslipAPI(id);
      toast.success(res.data.message || "Payslip emailed successfully");
    } catch (err) {
      toast.error("Failed to process payslip");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Payslips</h2>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Month / Year</th>
              <th>Base Salary</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>No payslips available.</td>
              </tr>
            ) : (
              payslips.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>
                      {new Date(0, p.month - 1).toLocaleString("default", { month: "long" })} {p.year}
                    </strong>
                  </td>
                  <td>₹{p.baseSalary}</td>
                  <td style={{ color: "red" }}>-₹{p.deductions}</td>
                  <td style={{ fontWeight: 600, color: "green" }}>₹{p.netPay}</td>
                  <td>
                    <button className={styles.sendBtn} onClick={() => handleDownload(p._id)}>
                      Email Me
                    </button>
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
