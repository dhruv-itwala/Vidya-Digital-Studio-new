import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader/Loader";
import styles from "./ClientInvoices.module.css";
import { FiFileText, FiDownload, FiDollarSign } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { getClientByIdAPI } from "../../api/clients.api";

const ClientInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id: clientId } = useParams();

  useEffect(() => {
    if (clientId) fetchInvoices();
  }, [clientId]);

  const fetchInvoices = async () => {
    try {
      const res = await getClientByIdAPI(clientId);
      setInvoices(res.data.data.invoices || []);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") return <span className={`${styles.badge} ${styles.badgePaid}`}>Paid</span>;
    if (s === "pending") return <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>;
    return <span className={`${styles.badge} ${styles.badgeUnpaid}`}>Unpaid</span>;
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Invoices</h1>
        <p className={styles.subtitle}>View your billing history and download past invoices.</p>
      </div>

      {invoices.length > 0 ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td className={styles.fw500}>{inv.invoiceNumber || "—"}</td>
                  <td>{inv.title}</td>
                  <td className={styles.fw500}>
                    {inv.amount ? `₹${inv.amount.toLocaleString()}` : "—"}
                  </td>
                  <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td>{getStatusBadge(inv.status)}</td>
                  <td>
                    <a href={inv.url} target="_blank" rel="noreferrer" className={styles.downloadBtn}>
                      <FiDownload /> View PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiDollarSign /></div>
          <h3>No invoices generated</h3>
          <p>You don't have any invoices associated with your account yet.</p>
        </div>
      )}
    </div>
  );
};

export default ClientInvoices;
