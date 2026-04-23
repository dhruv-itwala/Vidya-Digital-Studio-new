import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import styles from "./Creator.module.css";
import { CONTENT_TYPES, TYPE_COLORS } from "./constants";
// ─── Content Pill ───────────────────────────────────────────────────────────

const ContentPill = ({ type, active, onClick }) => {
  const palette = TYPE_COLORS[type] || {
    bg: "#F0F0F0",
    color: "#444",
    border: "#DDD",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          padding: "6px 14px",
          borderRadius: "100px",
          fontSize: "12px",
          fontWeight: 500,
          border: `1px solid ${active ? palette.border : "#E0E0E0"}`,
          background: active ? palette.bg : "#F9F9F9",
          color: active ? palette.color : "#999",
          transition: "all 0.2s ease",
        }}
      >
        {type.replace("_", " ")}
      </span>
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={onClose}
        style={{ display: open ? "block" : "none", opacity: open ? 1 : 0 }}
      />

      {/* Drawer */}
      <div
        className={styles.drawer}
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleRow}>
            <span className={styles.drawerTitle}>
              {editItem ? `Edit ${title}` : `Add ${title}`}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.formGrid}>
          <div className={styles.formField}>
            <label>Name</label>
            <input
              {...register("name", { required: true })}
              className={styles.formInput}
              placeholder="Full name"
            />
          </div>

          <div className={styles.formField}>
            <label>Instagram handle</label>
            <input
              {...register("instagramId")}
              className={styles.formInput}
              placeholder="@handle"
            />
          </div>

          <div className={styles.formField}>
            <label>Contact number</label>
            <input
              {...register("contactNo")}
              className={styles.formInput}
              placeholder="987..."
            />
          </div>

          <div className={styles.formField}>
            <label>Email</label>
            <input
              {...register("email")}
              className={styles.formInput}
              placeholder="name@email.com"
            />
          </div>

          <div className={styles.formField}>
            <label>Followers</label>
            <input
              type="number"
              {...register("followers")}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formField}>
            <label>Price details</label>
            <input
              {...register("priceDetails")}
              className={styles.formInput}
              placeholder="e.g. ₹5k/reel"
            />
          </div>

          {/* Content Types */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label className={styles.formLabel}>Content types</label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}
            >
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

          {/* Footer */}
          <div className={styles.drawerFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.btnSave}
            >
              {isSubmitting ? "Saving..." : editItem ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
