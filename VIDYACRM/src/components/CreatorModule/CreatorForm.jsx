import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiX, FiCheck, FiSave } from "react-icons/fi";
import styles from "./Creator.module.css";
import { CONTENT_TYPES, TYPE_COLORS } from "./constants";

// ─── Content Pill ───────────────────────────────────────────────────────────

const ContentPill = ({ type, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.formPill} ${active ? styles.formPillActive : ""}`}
    >
      {active && <FiCheck className={styles.pillCheck} />}
      {type.replace("_", " ")}
    </button>
  );
};

// ─── Main Form ──────────────────────────────────────────────────────────────

export default function CreatorForm({
  open,
  editItem,
  onClose,
  onSaved,
  createAPI,
  updateAPI,
  title = "Creator",
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      instagramId: "",
      contactNo: "",
      email: "",
      contentTypes: [],
      followers: "",
      priceDetails: "",
    },
  });

  const selectedTypes = watch("contentTypes") || [];

  useEffect(() => {
    if (open) {
      reset(
        editItem || {
          name: "",
          instagramId: "",
          contactNo: "",
          email: "",
          contentTypes: [],
          followers: "",
          priceDetails: "",
        },
      );
    }
  }, [open, editItem, reset]);

  const toggleType = (type) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setValue("contentTypes", next, { shouldDirty: true });
  };

  const onSubmit = async (data) => {
    try {
      if (editItem) await updateAPI(editItem._id, data);
      else await createAPI(data);

      onSaved();
      onClose();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleRow}>
            <h3 className={styles.drawerTitle}>
              {editItem ? `Edit ${title}` : `Add New ${title}`}
            </h3>
            <p className={styles.drawerSubtitle}>
              {editItem ? "Update the details below." : "Enter the details to create a new profile."}
            </p>
          </div>
          <button onClick={onClose} className={styles.btnClose} title="Close">
            <FiX />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <form id="creator-form" onSubmit={handleSubmit(onSubmit)} className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Full Name</label>
              <input
                {...register("name", { required: true })}
                className={styles.formInput}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className={styles.formField}>
              <label>Instagram Handle / URL</label>
              <input
                {...register("instagramId")}
                className={styles.formInput}
                placeholder="@handle or URL"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Contact Number</label>
                <input
                  {...register("contactNo")}
                  className={styles.formInput}
                  placeholder="+91..."
                />
              </div>

              <div className={styles.formField}>
                <label>Email Address</label>
                <input
                  type="email"
                  {...register("email")}
                  className={styles.formInput}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Followers Count</label>
                <input
                  type="number"
                  {...register("followers")}
                  className={styles.formInput}
                  placeholder="e.g. 50000"
                />
              </div>

              <div className={styles.formField}>
                <label>Price / Rate</label>
                <input
                  {...register("priceDetails")}
                  className={styles.formInput}
                  placeholder="e.g. ₹5k/reel"
                />
              </div>
            </div>

            {/* Content Types */}
            <div className={styles.formFieldFull}>
              <label>Content Categories</label>
              <div className={styles.pillsWrapper}>
                {CONTENT_TYPES.map((t) => (
                  <ContentPill
                    key={t}
                    type={t}
                    active={selectedTypes.includes(t)}
                    onClick={() => toggleType(t)}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button type="button" onClick={onClose} className={styles.btnCancel}>
            Cancel
          </button>
          <button
            type="submit"
            form="creator-form"
            disabled={isSubmitting}
            className={styles.btnSave}
          >
            {isSubmitting ? "Saving..." : editItem ? "Update Profile" : "Save Profile"}
            {!isSubmitting && <FiSave />}
          </button>
        </div>
      </div>
    </>
  );
}
