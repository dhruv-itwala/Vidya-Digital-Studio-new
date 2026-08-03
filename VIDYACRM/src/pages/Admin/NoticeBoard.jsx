import React, { useEffect, useState } from "react";
import styles from "./NoticeBoard.module.css";
import { getAnnouncementsAPI, createAnnouncementAPI, deleteAnnouncementAPI } from "../../api/announcement.api";
import toast from "react-hot-toast";
import { FiTrash2, FiPlus } from "react-icons/fi";

const NoticeBoard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    expiresAt: "",
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await getAnnouncementsAPI();
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error("Title and message required");

    try {
      setIsSubmitting(true);
      await createAnnouncementAPI(form);
      toast.success("Announcement posted!");
      setForm({ title: "", message: "", type: "info", expiresAt: "" });
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to post announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncementAPI(id);
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to delete announcement");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notice Board</h1>
        <p className={styles.subtitle}>Broadcast messages to all employees on their dashboard.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.formCard}>
          <h3><FiPlus /> New Announcement</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Title</label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                placeholder="e.g. Office Party Tomorrow!" 
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Message</label>
              <textarea 
                name="message" 
                value={form.message} 
                onChange={handleChange} 
                placeholder="Write your announcement..."
                rows="4"
                required
              />
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="party">Party / Event</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Expires At (Optional)</label>
                <input 
                  type="date" 
                  name="expiresAt" 
                  value={form.expiresAt} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? "Posting..." : "Post Announcement"}
            </button>
          </form>
        </div>

        <div className={styles.listCard}>
          <h3>Active Announcements</h3>
          {loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : announcements.length === 0 ? (
            <p className={styles.empty}>No active announcements.</p>
          ) : (
            <div className={styles.announcementList}>
              {announcements.map(ann => (
                <div key={ann._id} className={`${styles.annItem} ${styles[ann.type]}`}>
                  <div className={styles.annContent}>
                    <h4>{ann.title}</h4>
                    <p>{ann.message}</p>
                    <span>Posted {new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => handleDelete(ann._id)} className={styles.deleteBtn}>
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;
