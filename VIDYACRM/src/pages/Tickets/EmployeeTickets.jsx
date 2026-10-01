import { useState, useEffect } from "react";
import { getMyTicketsAPI, createTicketAPI } from "../../api/ticket.api";
import styles from "./Tickets.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import Button from "../../components/UI/Button";

export default function EmployeeTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getMyTicketsAPI();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await createTicketAPI({ title, description });
      toast.success("Ticket created!");
      setShowModal(false);
      setTitle("");
      setDescription("");
      await fetchTickets();
    } catch (err) {
      toast.error(err?.message || err.response?.data?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Helpdesk Tickets</h2>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          + New Ticket
        </button>
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
                {t.resolutionNote && (
                  <p style={{ marginTop: 8, color: "#16a34a" }}>
                    <strong>Note:</strong> {t.resolutionNote}
                  </p>
                )}
              </div>
              <div className={`${styles.ticketStatus} ${styles[`status_${t.status.toLowerCase()}`]}`}>
                {t.status.replace("_", " ")}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Create New Ticket</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  disabled={submitting}
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={submitting}
                  loadingText="Submitting..."
                  className={styles.createBtn}
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
