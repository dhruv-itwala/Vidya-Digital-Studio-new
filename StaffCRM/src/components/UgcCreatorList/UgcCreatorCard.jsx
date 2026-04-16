import React from "react";
import { BiSolidEdit, BiTrash, BiCopy, BiLogoInstagram } from "react-icons/bi";
import toast from "react-hot-toast";
import { TYPE_COLORS, AVATAR_PALETTES } from "./constants";
import styles from "./UgcCreatorList.module.css";

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

const igHandle = (raw = "") => {
  if (!raw) return "";
  try {
    return new URL(raw).pathname.replace(/\//g, "");
  } catch {
    return raw.replace(/^@/, "");
  }
};

const igUrl = (raw = "") => {
  if (!raw) return "#";
  if (raw.startsWith("http")) return raw;
  return `https://instagram.com/${raw.replace(/^@/, "")}`;
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

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

// ─── Main Card Component ─────────────────────────────────────────────────────

export default function UgcCreatorCard({ item, onEdit, onDelete }) {
  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      // Fallback for non-secure contexts
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
      <div className={styles.cardTop}>
        <div className={styles.cardProfile}>
          <Avatar name={item.name} id={item._id} />
          <div style={{ minWidth: 0 }}>
            <div className={styles.cardName}>{item.name}</div>
            <a
              href={igUrl(item.instagramId)}
              target="_blank"
              rel="noreferrer"
              className={styles.cardHandle}
            >
              @{igHandle(item.instagramId) || "—"}
            </a>
          </div>
        </div>

        <div className={styles.cardActions}>
          <button
            onClick={() => onEdit(item)}
            className={styles.btnEdit}
            title="Edit"
          >
            <BiSolidEdit />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className={styles.btnDelete}
            title="Delete"
          >
            <BiTrash />
          </button>
        </div>
      </div>

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

      <div className={styles.contactRow}>
        {[
          { val: item.contactNo, label: item.contactNo, icon: "📞" },
          { val: item.email, label: item.email, icon: "✉" },
        ].map(({ val, label, icon }) => (
          <button
            key={icon}
            onClick={() => val && handleCopy(val)}
            className={styles.contactBtn}
            style={{ cursor: val ? "pointer" : "default" }}
          >
            <BiCopy style={{ fontSize: 12, flexShrink: 0, color: "#AAA" }} />
            <span>{label || "—"}</span>
          </button>
        ))}
      </div>

      {item.contentTypes?.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}
        >
          {item.contentTypes.map((t) => (
            <ContentPill key={t} type={t} />
          ))}
        </div>
      )}
    </div>
  );
}
