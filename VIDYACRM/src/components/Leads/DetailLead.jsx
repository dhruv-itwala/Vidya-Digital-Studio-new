import { useEffect, useState } from "react";
import { getLeadByIdAPI } from "../../api/leads.api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { holidayFormatDate } from "../../utils/date.util";
import styles from "./DetailLead.module.css";
import Loader from "../Loader/Loader";
import { FiArrowLeft, FiEdit2, FiMapPin, FiMail, FiPhone, FiUser } from "react-icons/fi";

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

  if (loading) return <Loader />;
  if (!lead) return <div className={styles.emptyState}>No lead found</div>;

  const getStatusClass = (status) => {
    switch (status) {
      case "Raw Lead": return styles.raw;
      case "First Contact Attempt": return styles.contact;
      case "Lead Qualification": return styles.qualification;
      case "Appointment / Meeting Schedule": return styles.meeting;
      case "Presentation / Demo / Consultation": return styles.demo;
      case "Proposal Send": return styles.proposal;
      case "Negotiation": return styles.negotiation;
      case "Verbal Confirmation": return styles.verbal;
      case "Client Won": return styles.won;
      case "Closed Loss": return styles.loss;
      case "Transferred": return styles.transfer;
      default: return "";
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* HEADER SECTION */}
      <div className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div className={styles.titleWrapper}>
            <button
              className={styles.backBtn}
              onClick={() => navigate(`/${role}/leads`)}
              title="Back to Leads"
            >
              <FiArrowLeft />
            </button>
            <div className={styles.titleInfo}>
              <h1 className={styles.businessName}>{lead.clientName}</h1>
              <span className={`${styles.statusBadge} ${getStatusClass(lead.status)}`}>
                {lead.status}
              </span>
            </div>
          </div>
          
          <button
            className={styles.editBtn}
            onClick={() => navigate(`/${role}/leads/${lead._id}/edit`)}
          >
            <FiEdit2 /> Edit Lead
          </button>
        </div>
      </div>

      <div className={styles.mainGrid}>
        
        {/* LEFT COLUMN: BASIC INFO & SERVICES */}
        <div className={styles.leftCol}>
          <div className={styles.bentoCard}>
            <h3 className={styles.cardTitle}>Basic Information</h3>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}><FiUser /></div>
                <div className={styles.infoData}>
                  <span>Owner Name</span>
                  <p>{lead.ownerName || "Not assigned"}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}><FiMail /></div>
                <div className={styles.infoData}>
                  <span>Email Address</span>
                  <p>{lead.email || "—"}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}><FiPhone /></div>
                <div className={styles.infoData}>
                  <span>Phone Number</span>
                  <p>{lead.phone || "—"}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}><FiMapPin /></div>
                <div className={styles.infoData}>
                  <span>Address</span>
                  <p>{lead.address || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.bentoCard}>
            <h3 className={styles.cardTitle}>Services Required</h3>
            <div className={styles.pillsContainer}>
              {lead.services?.length ? (
                lead.services.map((service, i) => (
                  <span key={i} className={styles.servicePill}>
                    {service}
                  </span>
                ))
              ) : (
                <p className={styles.emptyText}>No services added.</p>
              )}
            </div>
          </div>

          {lead.notes && (
            <div className={styles.bentoCard}>
              <h3 className={styles.cardTitle}>General Notes</h3>
              <div className={styles.notesBox}>
                <p>{lead.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TIMELINE */}
        <div className={styles.rightCol}>
          <div className={`${styles.bentoCard} ${styles.timelineCard}`}>
            <h3 className={styles.cardTitle}>Meeting Timeline</h3>
            
            {lead.meetingNotes?.length ? (
              <div className={styles.timeline}>
                {lead.meetingNotes
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((note, index) => (
                    <div key={index} className={styles.timelineItem}>
                      <div className={styles.timelineDot}></div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineDate}>
                          {holidayFormatDate(note.date)}
                        </div>
                        <div className={styles.timelineText}>{note.note}</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className={styles.emptyTimeline}>
                <p>No meeting notes recorded yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
