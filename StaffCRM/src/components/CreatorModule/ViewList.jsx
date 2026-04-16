import React, { useState, useEffect } from "react";
import { BiSearch, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import styles from "./Creator.module.css";
import Loader from "../Loader/Loader";
import { CONTENT_TYPES } from "./constants";

export default function ViewList({ title = "Creators", getAPI }) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await getAPI({
        page,
        limit: 100,
      });

      setData(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const filteredData = data
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

  const formatFollowers = (n) => {
    if (!n) return "—";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const getInstagramHandle = (raw = "") => {
    if (!raw) return "";

    try {
      const url = new URL(raw);
      return url.pathname.split("/").filter(Boolean)[0] || "";
    } catch {
      return raw.replace(/^@/, "");
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, filterType, minFollowers, maxFollowers, sortOrder]);

  if (loading) return <Loader />;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2>
            {title}{" "}
            <span className={styles.totalCount}>{data.length} Showing</span>
          </h2>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div className={styles.searchWrapper}>
              <BiSearch className={styles.searchIcon} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className={styles.searchInput}
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.searchInput}
            >
              <option value="all">All Types</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min Followers"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              className={styles.searchInput}
            />

            <input
              type="number"
              placeholder="Max Followers"
              value={maxFollowers}
              onChange={(e) => setMaxFollowers(e.target.value)}
              className={styles.searchInput}
            />

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={styles.searchInput}
            >
              <option value="">Sort</option>
              <option value="high">High → Low</option>
              <option value="low">Low → High</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Instagram</th>
                <th>Followers</th>
                <th>Content</th>
                <th>Rate</th>
                <th>Contact</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>

                  <td>
                    <a
                      href={
                        item.instagramId?.startsWith("http")
                          ? item.instagramId
                          : `https://instagram.com/${getInstagramHandle(item.instagramId)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--color-accent)" }}
                    >
                      @{getInstagramHandle(item.instagramId) || "—"}
                    </a>
                  </td>

                  <td>{formatFollowers(item.followers)}</td>

                  <td>{item.contentTypes?.join(", ") || "—"}</td>

                  <td>{item.priceDetails || "—"}</td>

                  <td>{item.contactNo || item.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      </div>
    </div>
  );
}
