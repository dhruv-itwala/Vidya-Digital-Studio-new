import { useState, useEffect } from "react";
import { getAllTicketsAPI, updateTicketStatusAPI } from "../../api/ticket.api";
import styles from "./Tickets.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import Button from "../../components/UI/Button";

export default function HRTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getAllTicketsAPI();
      setTickets(res.data.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
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
      await fetchTickets();
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (resolving) return;
    try {
      setResolving(true);
      await updateTicketStatusAPI(selectedTicket._id, { status: "RESOLVED", resolutionNote });
      toast.success("Ticket resolved");
      setSelectedTicket(null);
      await fetchTickets();
    } catch (err) {
      toast.error(err?.message || "Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Helpdesk Management</h2>
      </div>

      <div className={styles.ticketList}>
        {loading ? (
          <Loader />
        ) : tickets.length === 0 ? (
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
                <button
                  type="button"
                  disabled={resolving}
                  className={styles.cancelBtn}
                  onClick={() => setSelectedTicket(null)}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={resolving}
                  loadingText="Resolving..."
                  className={styles.createBtn}
                >
                  Mark Resolved
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
