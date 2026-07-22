import { useState, useEffect } from "react";
import styles from "./LeadForm.module.css";
import { createLeadAPI, updateLeadAPI } from "../../api/leads.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const statusOptions = [
  "Raw Lead",
  "First Contact Attempt",
  "Lead Qualification",
  "Appointment / Meeting Schedule",
  "Presentation / Demo / Consultation",
  "Proposal Send",
  "Negotiation",
  "Verbal Confirmation",
  "Client Won",
  "Closed Loss",
];

const proposalOptions = ["Pending", "Created"];

export default function LeadForm({ mode = "create", initialData = null }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    clientName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    services: [],
    notes: "",
    status: "Raw Lead",
    proposal: "Pending",
    meetingNotes: [],
  });

  const [serviceInput, setServiceInput] = useState("");

  /* ================= INIT DATA ================= */
  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        clientName: initialData.clientName || "",
        ownerName: initialData.ownerName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        services: initialData.services || [],
        notes: initialData.notes || "",
        status: initialData.status || "Raw Lead",
        proposal: initialData.proposal || "Pending",
        meetingNotes:
          initialData.meetingNotes?.map((note) => ({
            ...note,
            date: note.date
              ? new Date(note.date).toISOString().split("T")[0]
              : "",
          })) || [],
      });
    }
  }, [initialData, isEdit]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SERVICE LOGIC ================= */
  const addService = () => {
    if (!serviceInput.trim()) return;

    if (form.services.includes(serviceInput.trim())) {
      toast.error("Service already added");
      return;
    }

    setForm({
      ...form,
      services: [...form.services, serviceInput.trim()],
    });

    setServiceInput("");
  };

  const removeService = (service) => {
    setForm({
      ...form,
      services: form.services.filter((s) => s !== service),
    });
  };

  /* ================= MEETING NOTES ================= */
  const addMeetingRow = () => {
    setForm({
      ...form,
      meetingNotes: [...form.meetingNotes, { date: "", note: "" }],
    });
  };

  const updateMeetingRow = (index, field, value) => {
    const updated = [...form.meetingNotes];
    updated[index][field] = value;
    setForm({ ...form, meetingNotes: updated });
  };

  const removeMeetingRow = (index) => {
    const updated = form.meetingNotes.filter((_, i) => i !== index);
    setForm({ ...form, meetingNotes: updated });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.clientName.trim()) {
      return toast.error("Business name is required");
    }

    try {
      setLoading(true);

      if (isEdit) {
        await updateLeadAPI(initialData._id, form);
        toast.success("Lead updated");
      } else {
        await createLeadAPI(form);
        toast.success("Lead created");
      }

      navigate(`/${role}/leads`);
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="masterContainer">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h2 className={styles.heading}>
            {isEdit ? "Edit Lead" : "Create Lead"}
          </h2>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate(`/${role}/leads`)}
              className={styles.cancelBtn}
            >
              Back
            </button>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label>Business Name *</label>
            <input
              type="text"
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Owner Name *</label>
            <input
              type="text"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Phone No</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className={`${styles.inputGroup}`}>
            <label>Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div className={`${styles.inputGroup}`}>
            <label>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} />
          </div>

          <div className={`${styles.inputGroup} `}>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className={`${styles.inputGroup} `}>
            <label>Proposal</label>
            <select
              name="proposal"
              value={form.proposal}
              onChange={handleChange}
            >
              {proposalOptions.map((proposal) => (
                <option key={proposal} value={proposal}>
                  {proposal}
                </option>
              ))}
            </select>
          </div>

          {/* SERVICES */}
          <div className={`${styles.inputGroup}`}>
            <label>Services</label>

            <div
              className={styles.tagInput}
              onClick={() => document.getElementById("serviceInput")?.focus()}
            >
              {form.services.map((service) => (
                <span key={service} className={styles.tag}>
                  {service}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeService(service);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}

              <input
                id="serviceInput"
                type="text"
                value={serviceInput}
                placeholder="Type and press Enter..."
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addService();
                  }
                }}
              />
            </div>
          </div>

          {/* MEETING NOTES TABLE */}
          <div className={`${styles.inputGroup} ${styles.full}`}>
            <div className={styles.notesHeader}>
              <h3>Meeting Notes</h3>
              <button
                type="button"
                onClick={addMeetingRow}
                className={styles.addMeetingBtn}
              >
                + Add Row
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.notesTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Note</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {form.meetingNotes.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="date"
                          value={row.date || ""}
                          onChange={(e) =>
                            updateMeetingRow(index, "date", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) =>
                            updateMeetingRow(index, "note", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => removeMeetingRow(index)}
                          className={styles.removeRow}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
