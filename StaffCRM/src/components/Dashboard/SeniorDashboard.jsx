import styles from "./SeniorDashboard.module.css";
import useDashboard from "../../hooks/useDashboard";
import Loader from "../Loader/Loader";

const SeniorDashboard = () => {
  const { data, loading } = useDashboard();

  if (loading) return <Loader />;
  if (!data) return <div>No Data</div>;

  const {
    leads,
    clients,
    revenue,
    attendance,
    recentLeadActivity,
    recentPayments,
  } = data;

  return (
    <div className="masterContainer">
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Dashboard</h1>

        {/* KPI CARDS */}
        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.icon}>📊</span>
            <div className={styles.cardContent}>
              <h3>Total Leads</h3>
              <p>{leads.totalLeads}</p>
            </div>
          </div>

          <div className={styles.card}>
            <span className={styles.icon}>🎯</span>
            <div className={styles.cardContent}>
              <h3>Converted</h3>
              <p>{leads.convertedLeads}</p>
            </div>
          </div>

          <div className={styles.card}>
            <span className={styles.icon}>👥</span>
            <div className={styles.cardContent}>
              <h3>Total Clients</h3>
              <p>{clients.totalClients}</p>
            </div>
          </div>

          <div className={styles.card}>
            <span className={styles.icon}>💰</span>
            <div className={styles.cardContent}>
              <h3>Revenue</h3>
              <p>₹{revenue.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ATTENDANCE */}
        <div className={styles.section}>
          <h2>Today's Attendance</h2>

          {Object.entries(attendance).map(([status, users]) => {
            const userList = Array.isArray(users) ? users : [];

            return (
              <div key={status} className={styles.attendanceRow}>
                <h4>{status}</h4>

                <div className={styles.pills}>
                  {userList.length === 0 && (
                    <span className={styles.empty}>None</span>
                  )}

                  {userList.map((user) => (
                    <span key={user.id} className={styles.pill}>
                      {user.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* RECENT LEADS */}
        <div className={styles.section}>
          <h2>Recent Lead Activity</h2>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Updated</th>
                </tr>
              </thead>

              <tbody>
                {recentLeadActivity.map((lead) => (
                  <tr key={lead._id}>
                    <td>{lead.clientName}</td>
                    <td>{lead.status}</td>
                    <td>{lead.createdBy?.name || "-"}</td>
                    <td>{new Date(lead.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT PAYMENTS */}
        <div className={styles.section}>
          <h2>Recent Payments</h2>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                </tr>
              </thead>

              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.clientName}</td>
                    <td>₹{payment.amount}</td>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td>{payment.method || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeniorDashboard;
