import React, { useEffect, useState } from "react";
import clientApi from "../../api/clientAxios";
import styles from "./ClientTransactions.module.css";
import { FiActivity, FiArrowUpRight } from "react-icons/fi";

const ClientTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await clientApi.get("/client-portal/me");
      setTransactions(res.data.data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.subtitle}>Recent payment activity on your account.</p>
      </div>

      {transactions.length > 0 ? (
        <div className={styles.timeline}>
          {transactions.map((tx) => (
            <div key={tx._id} className={styles.timelineItem}>
              <div className={styles.timelineIcon}>
                <FiArrowUpRight />
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineHeader}>
                  <h4 className={styles.txType}>{tx.paymentMethod} Payment</h4>
                  <span className={styles.txAmount}>₹{tx.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.timelineMeta}>
                  <span className={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</span>
                  {tx.reference && <span className={styles.txRef}>Ref: {tx.reference}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiActivity /></div>
          <h3>No transactions recorded</h3>
          <p>Any payments made will appear in this timeline.</p>
        </div>
      )}
    </div>
  );
};

export default ClientTransactions;
