import { useState, useEffect } from "react";
import { getMyTicketsAPI, createTicketAPI } from "../../api/ticket.api";
import styles from "./Tickets.module.css";
import toast from "react-hot-toast";

export default function EmployeeTickets() {
  const [tickets, setTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await getMyTicketsAPI();
      setTickets(res.data.data);
    } catch (err) {
      toast.error("Failed to load tickets");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTicketAPI({ title, description });
      toast.success("Ticket created!");
      setShowModal(false);
      setTitle("");
      setDescription("");
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ticket");
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
        {tickets.length === 0 ? (
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
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.createBtn}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
