import React from "react";
import { FiEdit2, FiTrash2, FiCopy, FiInstagram, FiMail, FiPhone } from "react-icons/fi";
import toast from "react-hot-toast";
import { AVATAR_PALETTES } from "./constants";
import styles from "./Creator.module.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatFollowers = (n) => {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const avatarPalette = (id = "") =>
  AVATAR_PALETTES[
    [...(id || "x")].reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      AVATAR_PALETTES.length
  ];

const getInstagramData = (raw = "") => {
  if (!raw) return { handle: "", url: "#" };

  try {
    const url = new URL(raw);
    const handle = url.pathname.split("/").filter(Boolean)[0] || "";
    return {
      handle,
      url: `${url.origin}/${handle}`,
    };
  } catch {
    const handle = raw.replace(/^@/, "");
    return {
      handle,
      url: `https://instagram.com/${handle}`,
    };
  }
};

// ─── Sub Components ──────────────────────────────────────────────────────────

function Avatar({ name, id, size = 52 }) {
  const { bg, color } = avatarPalette(id);
  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: bg,
        color,
        fontSize: size * 0.4,
      }}
    >
      {initials(name)}
    </div>
  );
}

function ContentPill({ type }) {
  return (
    <span className={styles.contentPill}>
      {type.replace("_", " ")}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CreatorCard({ item, onEdit, onDelete }) {
  const { handle, url } = getInstagramData(item.instagramId);

  const handleCopy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success(`${label} copied to clipboard`);
    }
  };

  return (
    <div className={styles.card}>
      {/* Top */}
      <div className={styles.cardTop}>
        <div className={styles.cardProfile}>
          <Avatar name={item.name} id={item._id} />

          <div className={styles.profileInfo}>
            <div className={styles.cardName} title={item.name}>{item.name}</div>
            
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={styles.cardHandle}
            >
              <FiInstagram /> @{handle || "—"}
            </a>
          </div>
        </div>

        <div className={styles.cardActions}>
          <button onClick={() => onEdit(item)} className={styles.btnEdit} title="Edit Creator">
            <FiEdit2 />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className={styles.btnDelete}
            title="Delete Creator"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Followers</div>
          <div className={styles.statValue}>
            {formatFollowers(item.followers)}
          </div>
        </div>

        <div className={styles.statBox}>
          <div className={styles.statLabel}>Rate</div>
          <div className={styles.rateValue}>{item.priceDetails || "—"}</div>
        </div>
      </div>

      {/* Content Types */}
      {item.contentTypes?.length > 0 && (
        <div className={styles.contentTypesRow}>
          {item.contentTypes.map((t) => (
            <ContentPill key={t} type={t} />
          ))}
        </div>
      )}

      {/* Contact */}
      <div className={styles.contactRow}>
        <button
          onClick={() => item.contactNo && handleCopy(item.contactNo, "Phone")}
          className={styles.contactBtn}
          disabled={!item.contactNo}
          title={item.contactNo || "No Phone"}
        >
          <FiPhone className={styles.contactIcon} />
          <span>{item.contactNo || "—"}</span>
        </button>

        <button
          onClick={() => item.email && handleCopy(item.email, "Email")}
          className={styles.contactBtn}
          disabled={!item.email}
          title={item.email || "No Email"}
        >
          <FiMail className={styles.contactIcon} />
          <span>{item.email || "—"}</span>
        </button>
      </div>

    </div>
  );
}
