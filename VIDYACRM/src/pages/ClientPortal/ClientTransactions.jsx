import React, { useEffect, useState } from "react";
import Loader from "../../components/Loader/Loader";
import styles from "./ClientTransactions.module.css";
import { FiActivity, FiArrowUpRight } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { getClientByIdAPI } from "../../api/clients.api";

const ClientTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id: clientId } = useParams();

  useEffect(() => {
    if (clientId) fetchTransactions();
  }, [clientId]);

  const fetchTransactions = async () => {
    try {
      const res = await getClientByIdAPI(clientId);
      setTransactions(res.data.data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.subtitle}>A history of all your payments and financial activities.</p>
      </div>

      {transactions.length > 0 ? (
        <div className={styles.timelineContainer}>
          {transactions.map((txn, idx) => (
            <div key={idx} className={styles.timelineItem}>
              <div className={styles.timelineIcon}>
                <FiArrowUpRight />
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <h4 className={styles.amount}>
                    {txn.amount ? `₹${txn.amount.toLocaleString()}` : "—"}
                  </h4>
                  <span className={styles.date}>
                    {new Date(txn.date).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.timelineDetails}>
                  <span className={styles.methodBadge}>{txn.method || "Unknown"}</span>
                  {txn.note && <p className={styles.note}>{txn.note}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiActivity /></div>
          <h3>No transactions found</h3>
          <p>You don't have any recorded transactions yet.</p>
        </div>
      )}
    </div>
  );
};

export default ClientTransactions;
