import { useEffect, useRef, useState } from "react";
import {
  BiSolidEdit,
  BiTrash,
  BiCopy,
  BiLogoInstagram,
  BiSearch,
  BiPlus,
  BiX,
  BiChevronLeft,
  BiChevronRight,
} from "react-icons/bi";
import {
  getugcCreatorsAPI,
  createUGCCreatorAPI,
  updateUGCCreatorAPI,
  deleteUGCCreatorAPI,
} from "../../api/ugcCreator.api";

import styles from "./UgcCreatorList.module.css";
import toast from "react-hot-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  "lifestyle",
  "entertainment",
  "food",
  "cooking",
  "travel",
  "fashion",
  "artist",
  "beauty",
  "model",
  "makeup_artist",
  "dancer",
];

const TYPE_COLORS = {
  lifestyle: { bg: "#F0F4FF", color: "#3347A8", border: "#C0CBEF" },
  entertainment: { bg: "#FFF8E7", color: "#7A4F00", border: "#F0CC6A" },
  food: { bg: "#EDFAF3", color: "#1A6644", border: "#7DDBA8" },
  cooking: { bg: "#E8FAF0", color: "#155C3C", border: "#68D49A" },
  travel: { bg: "#E8F5FF", color: "#0B4E8A", border: "#72B9F2" },
  fashion: { bg: "#FDF0F8", color: "#7B2060", border: "#E89DD2" },
  artist: { bg: "#F2EEFF", color: "#4C2FAF", border: "#BBA8F0" },
  beauty: { bg: "#FFF0F0", color: "#8A2020", border: "#F0AAAA" },
  model: { bg: "#F5F5F0", color: "#3A3A30", border: "#BFBFB0" },
  makeup_artist: { bg: "#FFF3EC", color: "#7A3210", border: "#F5B48A" },
  dancer: { bg: "#F0FFFE", color: "#0C5754", border: "#6AD6D0" },
};

const AVATAR_PALETTES = [
  { bg: "#1A1A2E", color: "#E8E0FF" },
  { bg: "#0D2137", color: "#A0DCFF" },
  { bg: "#1A2E1A", color: "#A0F0B8" },
  { bg: "#2E1A1A", color: "#FFBBAA" },
  { bg: "#2E1A2E", color: "#F0AAEE" },
  { bg: "#2E2A1A", color: "#FFE0A0" },
];

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

// ─── Avatar ───────────────────────────────────────────────────────────────────

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

// ─── ContentPill ─────────────────────────────────────────────────────────────

function ContentPill({ type, interactive, active, onClick }) {
  const palette = TYPE_COLORS[type] ?? {
    bg: "#F0F0F0",
    color: "#444",
    border: "#0f5c44",
  };
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "11px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "100px",
        whiteSpace: "nowrap",
        letterSpacing: ".02em",
        border: `1px solid ${active || !interactive ? palette.border : "#0f5c44"}`,
        background: active || !interactive ? palette.bg : "transparent",
        color: active || !interactive ? palette.color : "#999",
        cursor: interactive ? "pointer" : "default",
        transition: "all .15s",
        userSelect: "none",
      }}
    >
      {type.replace("_", " ")}
    </span>
  );
}

// ─── UGC CREATOR CARD ───────────────────────────────────────────────────────────

function UgcCreatorCard({ item, onEdit, onDelete, onCopy }) {
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
              <BiLogoInstagram style={{ fontSize: 13 }} />@
              {igHandle(item.instagramId) || "—"}
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
            onClick={() => val && onCopy(val)}
            title={`Copy ${label}`}
            className={styles.contactBtn}
            style={{ cursor: val ? "pointer" : "default" }}
          >
            <BiCopy style={{ fontSize: 12, flexShrink: 0, color: "#AAA" }} />
            <span>{label || "—"}</span>
          </button>
        ))}
      </div>

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

// ─── Drawer Form ──────────────────────────────────────────────────────────────

function Drawer({ open, editItem, onClose, onSaved }) {
  const EMPTY = {
    name: "",
    instagramId: "",
    contactNo: "",
    email: "",
    contentTypes: [],
    followers: "",
    priceDetails: "",
  };
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const firstInput = useRef();

  useEffect(() => {
    if (!open) return;

    setForm(editItem ? { ...editItem } : EMPTY);

    const timer = setTimeout(() => firstInput.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setForm(editItem ? { ...editItem } : EMPTY);

    const timer = setTimeout(() => firstInput.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, editItem?._id]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleType = (t) =>
    set(
      "contentTypes",
      form.contentTypes.includes(t)
        ? form.contentTypes.filter((x) => x !== t)
        : [...form.contentTypes, t],
    );

  const handleSave = async () => {
    if (!form.name.trim()) {
      firstInput.current?.focus();
      return;
    }
    setLoading(true);
    try {
      if (editItem) await updateUGCCreatorAPI(editItem._id, form);
      else await createUGCCreatorAPI(form);
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, children }) => (
    <div className={styles.formField}>
      <label className={styles.formLabel}>{label}</label>
      {children}
    </div>
  );

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={onClose}
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      <div
        className={styles.drawer}
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHandle} />
          <div className={styles.drawerTitleRow}>
            <span className={styles.drawerTitle}>
              {editItem ? "Edit UGCCreator" : "Add UGCCreator"}
            </span>
            <button onClick={onClose} className={styles.closeBtn}>
              <BiX />
            </button>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Field label="Name">
            <input
              ref={firstInput}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
              className={styles.formInput}
            />
          </Field>
          <Field label="Instagram handle / URL">
            <input
              value={form.instagramId}
              onChange={(e) => set("instagramId", e.target.value)}
              placeholder="@handle"
              className={styles.formInput}
            />
          </Field>
          <Field label="Contact number">
            <input
              value={form.contactNo}
              onChange={(e) => set("contactNo", e.target.value)}
              placeholder="+91 …"
              className={styles.formInput}
            />
          </Field>
          <Field label="Email">
            <input
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@email.com"
              className={styles.formInput}
            />
          </Field>
          <Field label="Followers">
            <input
              type="number"
              value={form.followers}
              onChange={(e) => set("followers", e.target.value)}
              placeholder="e.g. 45000"
              className={styles.formInput}
            />
          </Field>
          <Field label="Price details">
            <input
              value={form.priceDetails}
              onChange={(e) => set("priceDetails", e.target.value)}
              placeholder="e.g. ₹5k/reel"
              className={styles.formInput}
            />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Content types">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  paddingTop: 4,
                }}
              >
                {CONTENT_TYPES.map((t) => (
                  <ContentPill
                    key={t}
                    type={t}
                    interactive
                    active={form.contentTypes.includes(t)}
                    onClick={() => toggleType(t)}
                  />
                ))}
              </div>
            </Field>
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button onClick={onClose} className={styles.btnCancel}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={styles.btnSave}
          >
            {loading ? "Saving…" : editItem ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UgcCreatorList() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchData = async () => {
    const res = await getugcCreatorsAPI({ page, limit: 9 });
    setData(res.data.data);
    setTotalPages(res.data.pages);
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleEdit = (item) => {
    setEditItem(item);
    setDrawerOpen(true);
  };
  const handleAdd = () => {
    setEditItem(null);
    setDrawerOpen(true);
  };
  const handleDelete = async (id) => {
    await deleteUGCCreatorAPI(id);
    toast.success("UGCCreator removed");
    fetchData();
  };
  const handleCopy = async (text) => {
    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleSaved = () => {
    toast.success(editItem ? "UGCCreator updated" : "UGCCreator added");
    fetchData();
  };

  const filtered = data.filter((d) => {
    const matchType =
      filterType === "all" || d.contentTypes?.includes(filterType);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.name?.toLowerCase().includes(q) ||
      igHandle(d.instagramId).toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');`}</style>

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2>UGCCreators</h2>
            <span className={styles.totalCount}>{data.length} total</span>
          </div>
          <div className={styles.actions}>
            <div className={styles.searchWrapper}>
              <BiSearch className={styles.searchIcon} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className={styles.searchInput}
              />
            </div>
            <button onClick={handleAdd} className={styles.addButton}>
              <BiPlus style={{ fontSize: 16 }} /> Add UGCCreator
            </button>
          </div>
        </div>

        <div className={styles.filterRow}>
          {["all", ...CONTENT_TYPES].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilterType(f);
                setPage(1);
              }}
              className={`${styles.filterPill} ${
                filterType === f ? styles.filterPillActive : ""
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>No UGCCreators found.</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((item) => (
              <UgcCreatorCard
                key={item._id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}

        <div className={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={styles.pageBtn}
          >
            <BiChevronLeft />
          </button>
          <span style={{ fontSize: 13, color: "#888" }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={styles.pageBtn}
          >
            <BiChevronRight />
          </button>
        </div>

        <Drawer
          open={drawerOpen}
          editItem={editItem}
          onClose={() => setDrawerOpen(false)}
          onSaved={handleSaved}
        />
      </div>
    </div>
  );
}
