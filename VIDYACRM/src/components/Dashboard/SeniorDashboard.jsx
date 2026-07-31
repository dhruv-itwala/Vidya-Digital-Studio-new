import styles from "./SeniorDashboard.module.css";
import useDashboard from "../../hooks/useDashboard";
import Loader from "../Loader/Loader";
import { FiUsers, FiTarget, FiBriefcase, FiCalendar, FiClock } from "react-icons/fi";

const SeniorDashboard = () => {
  const { data, loading } = useDashboard();

  if (loading) return <Loader />;
  if (!data) return <div className={styles.emptyState}>No Data Available</div>;

  const {
    leads,
    clients,
    attendance,
    upcomingMeetings,
  } = data;

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
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

  // Helper for attendance colors
  const getAttendanceStyle = (status) => {
    const s = status.toLowerCase();
    if (s.includes("present") || s.includes("work")) return styles.statusGreen;
    if (s.includes("late") || s.includes("half")) return styles.statusYellow;
    if (s.includes("absent") || s.includes("leave")) return styles.statusRed;
    return styles.statusNeutral;
  };

  return (
    <div className={styles.pageContainer}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>Work Overview</h1>
        <p className={styles.subtitle}>Track your team's leads, clients, and daily operations.</p>
      </div>

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapperOrange}>
            <FiBriefcase />
          </div>
          <div className={styles.kpiContent}>
            <h3>Total Leads</h3>
            <p className={styles.kpiValue}>{leads.totalLeads}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapperGreen}>
            <FiTarget />
          </div>
          <div className={styles.kpiContent}>
            <h3>Converted Leads</h3>
            <p className={styles.kpiValue}>{leads.convertedLeads}</p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapperBlue}>
            <FiUsers />
          </div>
          <div className={styles.kpiContent}>
            <h3>Total Clients</h3>
            <p className={styles.kpiValue}>{clients.totalClients}</p>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* UPCOMING MEETINGS */}
        <div className={styles.meetingsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperNeutral}>
              <FiCalendar />
            </div>
            <h3>Upcoming Meetings</h3>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Proposal</th>
                  <th>Meeting Date</th>
                  <th>Note</th>
                </tr>
              </thead>

              <tbody>
                {upcomingMeetings.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <div className={styles.emptyTable}>No upcoming meetings.</div>
                    </td>
                  </tr>
                ) : (
                  upcomingMeetings.map((lead) => {
                    const tag = getMeetingTag(lead.meetingDate);

                    return (
                      <tr key={lead.leadId}>
                        <td>
                          <span className={styles.clientName}>{lead.clientName}</span>
                        </td>
                        <td>
                          <span
                            className={`${styles.proposalBadge} ${
                              lead.proposal === "Created"
                                ? styles.propCreated
                                : styles.propPending
                            }`}
                          >
                            {lead.proposal || "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.dateGroup}>
                            <span className={styles.dateText}>{formatDate(lead.meetingDate)}</span>
                            {tag === "today" && (
                              <span className={styles.tagToday}>Today</span>
                            )}
                            {tag === "tomorrow" && (
                              <span className={styles.tagTomorrow}>Tomorrow</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={styles.noteText}>{lead.note || "—"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ATTENDANCE */}
        <div className={styles.attendanceCardBox}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperNeutral}>
              <FiClock />
            </div>
            <h3>Today's Attendance</h3>
          </div>

          <div className={styles.attendanceList}>
            {Object.entries(attendance).filter(([, users]) => users.length > 0).length === 0 ? (
              <div className={styles.emptyTable}>No attendance recorded yet.</div>
            ) : (
              Object.entries(attendance)
                .filter(([, users]) => users.length > 0)
                .map(([status, users]) => (
                  <div key={status} className={styles.attendanceGroup}>
                    <div className={styles.attendanceGroupHeader}>
                      <span className={`${styles.statusDot} ${getAttendanceStyle(status)}`} />
                      <h4>{status}</h4>
                      <span className={styles.userCount}>{users.length}</span>
                    </div>

                    <div className={styles.pillsContainer}>
                      {users.map((user) => (
                        <div key={user.id} className={styles.userPill}>
                          {user.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeniorDashboard;
