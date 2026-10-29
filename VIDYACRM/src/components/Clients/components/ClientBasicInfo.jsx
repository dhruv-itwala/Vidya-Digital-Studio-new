import { useEffect } from "react";
import styles from "../ClientForm.module.css";
import { FiUser, FiCheckCircle } from "react-icons/fi";
import { validateFile } from "../../../utils/fileValidator";
import InlineLoader from "../../UI/InlineLoader";
import toast from "react-hot-toast";

export default function ClientBasicInfo({
  form,
  setForm,
  readOnly,
  photoPreview,
  setPhotoPreview,
  isEdit = false,
  onUpdate = null,
  updating = false,
}) {
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSaveBasic = () => {
    if (!form.clientName?.trim()) {
      toast.error("Business/Client name is required");
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Invalid email format");
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      toast.error("Phone must be 10 digits");
      return;
    }

    if (onUpdate) {
      const basicData = {
        clientName: form.clientName.trim(),
        ownerName: form.ownerName?.trim() || "",
        email: form.email?.trim() || "",
        phone: form.phone?.trim() || "",
        address: form.address || "",
        onboardingDate: form.onboardingDate || "",
        notes: form.notes || "",
      };
      if (form.profilePhoto instanceof File) {
        basicData.profilePhoto = form.profilePhoto;
      }
      onUpdate(basicData);
    }
  };

  /* ================= CLEAN OBJECT URL ================= */
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  return (
    <>
      <h3 className={styles.sectionTitle}>Basic Information</h3>

      {/* Profile Photo */}
      <div className={styles.inputGroupFull}>
        <label>Profile Photo</label>
        <div className={styles.photoUploadRow}>
          <div className={styles.previewWrapper}>
            {(photoPreview || form.profilePhoto?.url) ? (
              <img
                src={photoPreview || form.profilePhoto?.url}
                alt="profile"
                className={styles.previewImage}
              />
            ) : (
              <FiUser size={32} color="#94a3b8" />
            )}
          </div>

          {!readOnly && (
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                const isValid = validateFile(file, {
                  maxSizeMB: 2,
                  allowedTypes: ["image/*"],
                  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
                  fileLabel: "Profile photo",
                });
                if (!isValid) {
                  e.target.value = "";
                  return;
                }

                setForm((prev) => ({ ...prev, profilePhoto: file }));
                setPhotoPreview(URL.createObjectURL(file));
              }}
            />
          )}
        </div>
      </div>

      {/* TEXT FIELDS */}
      <div className={styles.grid2}>
        <div className={styles.inputGroup}>
          <label>Client Name <span className={styles.required}>*</span></label>
          <input
            type="text"
            name="clientName"
            value={form.clientName || ""}
            onChange={handleChange}
            disabled={readOnly}
            required
            className={styles.inputField}
            placeholder="Business or Client Name"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Owner Name</label>
          <input
            type="text"
            name="ownerName"
            value={form.ownerName || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
            placeholder="Primary Contact Person"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
            placeholder="client@example.com"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
            placeholder="+1 234 567 890"
          />
        </div>

        {/* Onboarding Date */}
        <div className={styles.inputGroup}>
          <label>Onboarding Date</label>
          <input
            type="date"
            name="onboardingDate"
            value={form.onboardingDate || ""}
            onChange={handleChange}
            disabled={readOnly}
            className={styles.inputField}
          />
        </div>
      </div>

      {/* Address */}
      <div className={styles.inputGroupFull}>
        <label>Full Address</label>
        <textarea
          name="address"
          value={form.address || ""}
          onChange={handleChange}
          disabled={readOnly}
          className={styles.textareaField}
          placeholder="Enter full business address..."
          rows="2"
        />
      </div>

      {/* Notes */}
      <div className={styles.inputGroupFull}>
        <label>Internal Notes</label>
        <textarea
          name="notes"
          value={form.notes || ""}
          onChange={handleChange}
          disabled={readOnly}
          className={styles.textareaField}
          placeholder="Add any internal notes, context, or special requirements..."
          rows="3"
        />
      </div>

      {/* Independent Update Button for Basic Information */}
      {isEdit && !readOnly && onUpdate && (
        <div className={styles.sectionAction}>
          <button
            type="button"
            className={styles.updateBtn}
            onClick={handleSaveBasic}
            disabled={updating}
          >
            {updating ? <InlineLoader size={16} /> : <FiCheckCircle />}
            <span>{updating ? "Updating Basic Info..." : "Update Basic Information"}</span>
          </button>
        </div>
      )}
    </>
  );
}
