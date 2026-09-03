import { useState, useEffect } from "react";
import { getAllTicketsAPI, updateTicketStatusAPI } from "../../api/ticket.api";
import styles from "./Tickets.module.css";
import toast from "react-hot-toast";

export default function HRTickets() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await getAllTicketsAPI();
      setTickets(res.data.data);
    } catch (err) {
      toast.error("Failed to load tickets");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (id, status) => {
    if (status === "RESOLVED") {
      const t = tickets.find((t) => t._id === id);
      setSelectedTicket(t);
      setResolutionNote(t.resolutionNote || "");
      return;
    }
    
    try {
      await updateTicketStatusAPI(id, { status });
      toast.success("Status updated");
      fetchTickets();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateTicketStatusAPI(selectedTicket._id, { status: "RESOLVED", resolutionNote });
      toast.success("Ticket resolved");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      toast.error("Failed to resolve ticket");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Helpdesk Management</h2>
      </div>

      <div className={styles.ticketList}>
        {tickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          tickets.map((t) => (
            <div key={t._id} className={styles.ticketCard}>
              <div className={styles.ticketInfo}>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <p style={{ marginTop: 8, fontSize: "0.85rem", color: "#64748b" }}>
                  By: {t.createdBy?.name} ({t.createdBy?.email})
                </p>
                {t.resolutionNote && (
                  <p style={{ marginTop: 8, color: "#16a34a" }}>
                    <strong>Note:</strong> {t.resolutionNote}
                  </p>
                )}
              </div>
              
              <select
                value={t.status}
                onChange={(e) => handleStatusChange(t._id, e.target.value)}
                className={`${styles.ticketStatus} ${styles[`status_${t.status.toLowerCase()}`]}`}
                style={{ cursor: "pointer", border: "1px solid #ccc" }}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          ))
        )}
      </div>

      {selectedTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Resolve Ticket</h3>
            <form onSubmit={handleResolveSubmit}>
              <div className={styles.formGroup}>
                <label>Resolution Note (Optional)</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={4}
                  placeholder="Explain how it was resolved..."
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setSelectedTicket(null)}>
                  Cancel
                </button>
                <button type="submit" className={styles.createBtn}>
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
