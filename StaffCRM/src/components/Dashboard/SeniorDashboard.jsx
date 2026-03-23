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
    recentPayments,
    upcomingMeetings,
  } = data;

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getMeetingTag = (date) => {
    const today = new Date();
    const meeting = new Date(date);

    const diff =
      new Date(meeting.setHours(0, 0, 0, 0)) -
      new Date(today.setHours(0, 0, 0, 0));

    const diffDays = diff / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    return null;
  };

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

          {/* <div className={styles.card}>
            <span className={styles.icon}>💰</span>
            <div className={styles.cardContent}>
              <h3>Revenue</h3>
              <p>₹{revenue.totalRevenue.toLocaleString()}</p>
            </div>
          </div> */}
        </div>

        {/* ATTENDANCE */}
        <div className={styles.section}>
          <h2>Today's Attendance</h2>

          <div className={styles.attendanceCards}>
            {Object.entries(attendance)
              .filter(([, users]) => users.length > 0)
              .map(([status, users]) => (
                <div key={status} className={styles.attendanceCard}>
                  <h4>
                    {status} <span>({users.length})</span>
                  </h4>

                  <div className={styles.pills}>
                    {users.map((user) => (
                      <span key={user.id} className={styles.pill}>
                        {user.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
        {/* UPCOMING MEETINGS */}
        <div className={styles.section}>
          <h2>Upcoming Meetings</h2>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Note</th>
                  <th>Proposal</th>
                  <th>Meeting Date</th>
                </tr>
              </thead>

              <tbody>
                {upcomingMeetings.map((lead) => {
                  const tag = getMeetingTag(lead.meetingDate);

                  return (
                    <tr key={lead.leadId}>
                      <td>{lead.clientName}</td>

                      <td>{lead.note}</td>

                      <td>
                        <span
                          className={
                            lead.proposal === "Created"
                              ? styles.greenPill
                              : styles.redPill
                          }
                        >
                          {lead.proposal || "-"}
                        </span>
                      </td>

                      <td>
                        {formatDate(lead.meetingDate)}

                        {tag === "today" && (
                          <span className={styles.todayBadge}>Today</span>
                        )}

                        {tag === "tomorrow" && (
                          <span className={styles.tomorrowBadge}>Tomorrow</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT PAYMENTS */}
        {/* <div className={styles.section}>
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
                    <td>{formatDate(payment.date)}</td>
                    <td>{payment.method || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default SeniorDashboard;
