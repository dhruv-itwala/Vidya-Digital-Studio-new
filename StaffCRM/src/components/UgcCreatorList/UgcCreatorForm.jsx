import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { BiX } from "react-icons/bi";
import { CONTENT_TYPES, TYPE_COLORS } from "./constants"; // Import TYPE_COLORS
import {
  createUGCCreatorAPI,
  updateUGCCreatorAPI,
} from "../../api/ugcCreator.api";
import styles from "./UgcCreatorList.module.css";

const ContentPill = ({ type, active, onClick }) => {
  // Grab the specific colors for this type from your constants
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
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
        border: "none",
        background: "transparent",
        padding: 0,
        transition: "transform 0.1s active",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <span
        style={{
          display: "inline-flex",
          padding: "6px 14px",
          borderRadius: "100px",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.02em",
          textTransform: "capitalize",
          // Toggle styles based on 'active' state
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

export default function UGCCreatorForm({ open, editItem, onClose, onSaved }) {
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

  // Watch contentTypes so the UI re-renders when setValue is called
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
    const nextValue = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setValue("contentTypes", nextValue, { shouldDirty: true });
  };

  const onSubmit = async (data) => {
    try {
      if (editItem) await updateUGCCreatorAPI(editItem._id, data);
      else await createUGCCreatorAPI(data);
      onSaved();
      onClose();
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={onClose}
        style={{ display: open ? "block" : "none", opacity: open ? 1 : 0 }}
      />
      <div
        className={styles.drawer}
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleRow}>
            <span className={styles.drawerTitle}>
              {editItem ? "Edit UGCCreator" : "Add UGCCreator"}
            </span>
            {/* <button onClick={onClose} className={styles.closeBtn}>
              <BiX />
            </button> */}
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
              placeholder="+91..."
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
