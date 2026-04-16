import React, { useState, useEffect, useCallback } from "react";
import {
  BiSearch,
  BiPlus,
  BiChevronLeft,
  BiChevronRight,
} from "react-icons/bi";
import toast from "react-hot-toast";
import {
  getugcCreatorsAPI,
  deleteUGCCreatorAPI,
} from "../../api/ugcCreator.api";
import { CONTENT_TYPES } from "./constants";
import UGCCreatorForm from "./UgcCreatorForm";
import UgcCreatorCard from "./UgcCreatorCard"; // Assuming you move the card to its own file or keep it here
import styles from "./UgcCreatorList.module.css";

export default function UgcCreatorList() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchData = async () => {
    try {
      const res = await getugcCreatorsAPI({ page, limit: 9 });
      setData(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error("Failed to load creators");
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

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
      await deleteUGCCreatorAPI(id);
      toast.success("UGCCreator removed");
      fetchData();
    }
  };

  const filtered = data.filter((d) => {
    const matchType =
      filterType === "all" || d.contentTypes?.includes(filterType);
    const q = search.toLowerCase();
    const matchSearch = !q || d.name?.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>
            UGC Creators <br />
            <span className={styles.totalCount}>{data.length} Total </span>
          </h2>
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
              <BiPlus /> Add UGCCreator
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
              className={`${styles.filterPill} ${filterType === f ? styles.filterPillActive : ""}`}
            >
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {filtered.map((item) => (
            <UgcCreatorCard
              key={item._id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

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

        <UGCCreatorForm
          open={drawerOpen}
          editItem={editItem}
          onClose={() => setDrawerOpen(false)}
          onSaved={fetchData}
        />
      </div>
    </div>
  );
}
