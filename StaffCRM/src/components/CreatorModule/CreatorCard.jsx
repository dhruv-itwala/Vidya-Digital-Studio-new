import React from "react";
import { BiSolidEdit, BiTrash, BiCopy } from "react-icons/bi";
import toast from "react-hot-toast";
import { TYPE_COLORS, AVATAR_PALETTES } from "./constants";
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

// ✅ unified IG logic (better than both versions)
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

function Avatar({ name, id, size = 44 }) {
  const { bg, color } = avatarPalette(id);
  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: bg,
        color,
        fontSize: size * 0.33,
      }}
    >
      {initials(name)}
    </div>
  );
}

function ContentPill({ type }) {
  const palette = TYPE_COLORS[type] ?? {
    bg: "#F0F0F0",
    color: "#444",
    border: "#DDD",
  };

  return (
    <span
      className={styles.filterPill}
      style={{
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
      }}
    >
      {type.replace("_", " ")}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CreatorCard({ item, onEdit, onDelete }) {
  const { handle, url } = getInstagramData(item.instagramId);

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <div className={styles.card}>
      {/* Top */}
      <div className={styles.cardTop}>
        <div className={styles.cardProfile}>
          <Avatar name={item.name} id={item._id} />

          <div style={{ minWidth: 0 }}>
            <div className={styles.cardName}>{item.name}</div>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={styles.cardHandle}
            >
              @{handle || "—"}
            </a>
          </div>
        </div>

        <div className={styles.cardActions}>
          <button onClick={() => onEdit(item)} className={styles.btnEdit}>
            <BiSolidEdit />
          </button>

          <button
            onClick={() => onDelete(item._id)}
            className={styles.btnDelete}
          >
            <BiTrash />
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

      {/* Contact */}
      <div className={styles.contactRow}>
        {[{ val: item.contactNo }, { val: item.email }].map(({ val }, i) => (
          <button
            key={i}
            onClick={() => val && handleCopy(val)}
            className={styles.contactBtn}
            style={{ cursor: val ? "pointer" : "default" }}
          >
            <BiCopy style={{ fontSize: 12, color: "#AAA" }} />
            <span>{val || "—"}</span>
          </button>
        ))}
      </div>

      {/* Content Types */}
      {item.contentTypes?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {item.contentTypes.map((t) => (
            <ContentPill key={t} type={t} />
          ))}
        </div>
      )}
    </div>
  );
}
