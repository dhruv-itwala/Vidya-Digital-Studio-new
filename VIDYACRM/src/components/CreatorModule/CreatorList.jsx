import React, { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiRefreshCw
} from "react-icons/fi";
import toast from "react-hot-toast";
import CreatorCard from "./CreatorCard";
import CreatorForm from "./CreatorForm";
import styles from "./Creator.module.css";
import Loader from "../Loader/Loader";
import { CONTENT_TYPES } from "./constants";

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
    if (window.confirm("Are you sure you want to remove this creator?")) {
      await deleteAPI(id);
      toast.success(`${title} removed`);
      fetchData();
    }
  };

  const filtered = data
    .filter((d) => {
      const matchType = filterType === "all" || d.contentTypes?.includes(filterType);
      const q = search.toLowerCase();
      const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.instagramId?.toLowerCase().includes(q);

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
    <div className={styles.pageContainer}>
      {/* HEADER SECTION */}
      <div className={styles.headerArea}>
        <div className={styles.titleBlock}>
          <h2 className={styles.pageTitle}>{title}</h2>
          <span className={styles.badge}>{data.length} Total</span>
        </div>
        <button onClick={handleAdd} className={styles.primaryBtn}>
          <FiPlus className={styles.btnIcon} /> Add {title}
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className={styles.utilityBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterHeader}>
            <FiFilter className={styles.filterIcon} />
            <span>Filters</span>
          </div>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Sort by Followers</option>
            <option value="high">High to Low</option>
            <option value="low">Low to High</option>
          </select>

          <input
            type="number"
            placeholder="Min Followers"
            value={minFollowers}
            onChange={(e) => setMinFollowers(e.target.value)}
            className={styles.numberInput}
          />

          <input
            type="number"
            placeholder="Max Followers"
            value={maxFollowers}
            onChange={(e) => setMaxFollowers(e.target.value)}
            className={styles.numberInput}
          />

          <button
            onClick={() => {
              setSortOrder("");
              setMinFollowers("");
              setMaxFollowers("");
              setSearch("");
            }}
            className={styles.resetBtn}
            title="Reset Filters"
          >
            <FiRefreshCw />
          </button>
        </div>

        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIconInside} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* CONTENT TYPE PILLS */}
      <div className={styles.pillsContainer}>
        {["all", ...CONTENT_TYPES].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilterType(f);
              setPage(1);
            }}
            className={`${styles.pillBtn} ${filterType === f ? styles.pillActive : ""}`}
          >
            {f === "all" ? "All Content Types" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No creators found matching your criteria.</p>
        </div>
      ) : (
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
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={styles.pageBtn}
          >
            <FiChevronLeft />
          </button>
          <span className={styles.pageText}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={styles.pageBtn}
          >
            <FiChevronRight />
          </button>
        </div>
      )}

      {/* DRAWER FORM */}
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
  );
}
