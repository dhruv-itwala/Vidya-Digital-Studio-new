import React, { useState, useEffect, useCallback } from "react";
import {
  BiSearch,
  BiPlus,
  BiChevronLeft,
  BiChevronRight,
} from "react-icons/bi";
import toast from "react-hot-toast";
import CreatorCard from "./CreatorCard";
import CreatorForm from "./CreatorForm";
import styles from "./Creator.module.css";
import Loader from "../Loader/Loader";
import { CONTENT_TYPES, TYPE_COLORS } from "./constants";

export default function CreatorList({
  title = "Creators",
  getAPI,
  deleteAPI,
  createAPI,
  updateAPI,
  pagelimit = 50,
}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [sortOrder, setSortOrder] = useState("");
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");

  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAPI({ page, limit: pagelimit });
      setData(res.data.data);
      setTotalPages(res.data.pages);
    } catch {
      toast.error(`Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  }, [page, pagelimit, getAPI, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditItem(null);
    setDrawerOpen(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      await deleteAPI(id);
      toast.success(`${title} removed`);
      fetchData();
    }
  };

  const filtered = data
    .filter((d) => {
      const matchType =
        filterType === "all" || d.contentTypes?.includes(filterType);

      const q = search.toLowerCase();
      const matchSearch = !q || d.name?.toLowerCase().includes(q);

      const followers = Number(d.followers || 0);
      const matchMin = !minFollowers || followers >= Number(minFollowers);
      const matchMax = !maxFollowers || followers <= Number(maxFollowers);

      return matchType && matchSearch && matchMin && matchMax;
    })
    .sort((a, b) => {
      if (!sortOrder) return 0;
      const fa = Number(a.followers || 0);
      const fb = Number(b.followers || 0);
      return sortOrder === "high" ? fb - fa : fa - fb;
    });

  if (loading) return <Loader />;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2>
            {title}{" "}
            <span className={styles.totalCount}>{data.length} Total</span>
          </h2>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={styles.searchInput}
            >
              <option value="">Sort</option>
              <option value="high">High → Low</option>
              <option value="low">Low → High</option>
            </select>

            <input
              type="number"
              placeholder="Min"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              className={styles.searchInput}
            />

            <input
              type="number"
              placeholder="Max"
              value={maxFollowers}
              onChange={(e) => setMaxFollowers(e.target.value)}
              className={styles.searchInput}
            />

            <button
              onClick={() => {
                setSortOrder("");
                setMinFollowers("");
                setMaxFollowers("");
              }}
              className={styles.addButton}
            >
              Reset
            </button>
          </div>

          {/* Search + Add */}
          <div className={styles.actions}>
            <div className={styles.searchWrapper}>
              <BiSearch className={styles.searchIcon} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className={styles.searchInput}
              />
            </div>

            <button onClick={handleAdd} className={styles.addButton}>
              <BiPlus /> Add {title}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
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

        {/* Grid */}
        <div className={styles.grid}>
          {filtered.map((item) => (
            <CreatorCard
              key={item._id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={styles.pageBtn}
          >
            <BiChevronLeft />
          </button>

          <span>
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

        {/* Form */}
        <CreatorForm
          open={drawerOpen}
          editItem={editItem}
          onClose={() => setDrawerOpen(false)}
          onSaved={fetchData}
          createAPI={createAPI}
          updateAPI={updateAPI}
          title={title}
        />
      </div>
    </div>
  );
}
