import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import styles from "./ClientInvoices.module.css";
import { FiFileText, FiDownload, FiDollarSign } from "react-icons/fi";

const ClientInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await clientApi.get("/client-portal/me");
      setInvoices(res.data.data.invoices || []);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Invoices</h1>
        <p className={styles.subtitle}>View your billing history and invoice statuses.</p>
      </div>

      {invoices.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td className={styles.fw500}>{inv.invoiceNumber}</td>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td className={styles.amount}>₹{inv.amount.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[inv.status.toLowerCase()]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.url && (
                      <a href={inv.url} target="_blank" rel="noopener noreferrer" className={styles.downloadBtn}>
                        <FiDownload /> Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiDollarSign /></div>
          <h3>No invoices found</h3>
          <p>Your billing history is currently empty.</p>
        </div>
      )}
    </div>
  );
};

export default ClientInvoices;
