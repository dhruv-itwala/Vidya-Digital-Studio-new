import { useEffect, useState } from "react";
import { getLeadByIdAPI } from "../../api/leads.api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { holidayFormatDate } from "../../utils/date.util";
import styles from "./DetailLead.module.css";

export default function DetailLead() {
  const { role } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await getLeadByIdAPI(id);
        setLead(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (!lead) return <div>No lead found</div>;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* ================= HEADER ================= */}
        <div className={styles.headerCard}>
          <div className={styles.headerInfo}>
            <h1 className={styles.businessName}>{lead.clientName}</h1>
            <span className={styles.statusBadge}>{lead.status}</span>
          </div>
          <button
            className={styles.editBtn}
            onClick={() => navigate(`/${role}/leads/${lead._id}/edit`)}
          >
            Edit
          </button>
        </div>

        {/* ================= BASIC INFO ================= */}
        <div className={styles.card}>
          <h3>Basic Information</h3>
          <div className={styles.infoGrid}>
            <div>
              <span>Owner</span>
              <p>{lead.ownerName || "-"}</p>
            </div>

            <div>
              <span>Email</span>
              <p>{lead.email || "-"}</p>
            </div>

            <div>
              <span>Phone</span>
              <p>{lead.phone || "-"}</p>
            </div>

            <div>
              <span>Address</span>
              <p>{lead.address || "-"}</p>
            </div>
          </div>
        </div>

        {/* ================= SERVICES ================= */}
        <div className={styles.card}>
          <h3>Services</h3>
          <div className={styles.pills}>
            {lead.services?.length ? (
              lead.services.map((service, i) => (
                <span key={i} className={styles.pill}>
                  {service}
                </span>
              ))
            ) : (
              <p>No services added</p>
            )}
          </div>
        </div>

        {/* ================= LEAD NOTES ================= */}
        {lead.notes && (
          <div className={styles.card}>
            <h3>Notes</h3>
            <p className={styles.leadNotes}>{lead.notes}</p>
          </div>
        )}

        {/* ================= MEETING TIMELINE ================= */}
        <div className={styles.card}>
          <h3>Meeting Timeline</h3>

          {lead.meetingNotes?.length ? (
            <div className={styles.timeline}>
              {lead.meetingNotes
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((note, index) => (
                  <div key={index} className={styles.timelineItem}>
                    <div className={styles.timelineDate}>
                      {holidayFormatDate(note.date)}
                    </div>
                    <div className={styles.timelineContent}>{note.note}</div>
                  </div>
                ))}
            </div>
          ) : (
            <p>No meeting notes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
