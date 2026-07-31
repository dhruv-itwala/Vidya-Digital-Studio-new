import { useState, useEffect } from "react";
import styles from "./LeadForm.module.css";
import { createLeadAPI, updateLeadAPI } from "../../api/leads.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { FiArrowLeft, FiPlus, FiTrash2, FiSave, FiCheckCircle } from "react-icons/fi";

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
    <div className={styles.pageContainer}>
      <form id="lead-form" className={styles.formCard} onSubmit={handleSubmit}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(`/${role}/leads`)}
              title="Back"
            >
              <FiArrowLeft />
            </button>
            <div className={styles.headerText}>
              <h2 className={styles.heading}>
                {isEdit ? "Edit Lead Profile" : "Create New Lead"}
              </h2>
              <p className={styles.subHeading}>
                {isEdit ? "Update the details below." : "Enter details to create a new pipeline entry."}
              </p>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Saving..." : isEdit ? "Update Lead" : "Save Lead"}
            {!loading && <FiCheckCircle />}
          </button>
        </div>

        {/* FORM GRID */}
        <div className={styles.formBody}>
          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label>Business Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                required
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Owner Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
                required
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className={styles.inputField}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.inputGroup}>
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={styles.selectField}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Proposal Status</label>
              <select name="proposal" value={form.proposal} onChange={handleChange} className={styles.selectField}>
                {proposalOptions.map((proposal) => (
                  <option key={proposal} value={proposal}>{proposal}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.inputGroupFull}>
            <label>Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter full address..."
              className={styles.textareaField}
              rows="2"
            />
          </div>

          <div className={styles.inputGroupFull}>
            <label>General Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add any internal notes here..."
              className={styles.textareaField}
              rows="3"
            />
          </div>

          {/* SERVICES */}
          <div className={styles.inputGroupFull}>
            <label>Required Services</label>
            <div
              className={styles.tagInputWrapper}
              onClick={() => document.getElementById("serviceInput")?.focus()}
            >
              <div className={styles.tagsContainer}>
                {form.services.map((service) => (
                  <span key={service} className={styles.serviceTag}>
                    {service}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeService(service);
                      }}
                      className={styles.removeTagBtn}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  id="serviceInput"
                  type="text"
                  value={serviceInput}
                  placeholder={form.services.length ? "" : "Type a service and press Enter..."}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addService();
                    }
                  }}
                  className={styles.tagInput}
                />
              </div>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* MEETING NOTES TABLE */}
          <div className={styles.inputGroupFull}>
            <div className={styles.sectionHeader}>
              <div>
                <h3>Meeting Timeline</h3>
                <p>Track interactions and meetings over time.</p>
              </div>
              <button
                type="button"
                onClick={addMeetingRow}
                className={styles.addBtn}
              >
                <FiPlus /> Add Note
              </button>
            </div>

            {form.meetingNotes.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{width: "200px"}}>Date</th>
                      <th>Note Details</th>
                      <th style={{width: "80px", textAlign: "center"}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.meetingNotes.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="date"
                            value={row.date || ""}
                            onChange={(e) => updateMeetingRow(index, "date", e.target.value)}
                            className={styles.tableInput}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.note}
                            onChange={(e) => updateMeetingRow(index, "note", e.target.value)}
                            className={styles.tableInput}
                            placeholder="Enter meeting notes..."
                          />
                        </td>
                        <td style={{textAlign: "center"}}>
                          <button
                            type="button"
                            onClick={() => removeMeetingRow(index)}
                            className={styles.deleteRowBtn}
                            title="Remove Note"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyTableState}>
                <p>No meeting notes added yet. Click 'Add Note' to create one.</p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
