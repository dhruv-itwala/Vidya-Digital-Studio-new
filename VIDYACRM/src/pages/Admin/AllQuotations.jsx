import { useEffect, useState } from "react";
import Loader from "../../components/Loader/Loader";
import InlineLoader from "../../components/UI/InlineLoader";
import styles from "./AllQuotations.module.css";
import { getAllQuotesAPI, deleteQuoteAPI } from "../../api/admin.api";
import toast from "react-hot-toast";

export default function AllQuotations() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await getAllQuotesAPI();
      setQuotes(res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    const confirm = window.confirm(
      "Are you sure you want to delete this quotation?",
    );
    if (!confirm) return;

    try {
      setDeletingId(id);
      await deleteQuoteAPI(id);
      setQuotes((prev) => prev.filter((q) => q._id !== id));
      toast.success("Quotation deleted successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete quotation");
    } finally {
      setDeletingId(null);
    }
  };

  const total = quotes.length;
  const pages = Math.ceil(total / rowsPerPage);
  const start = (page - 1) * rowsPerPage;
  const paginated = quotes.slice(start, start + rowsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>All Quotations</h2>
          <button
            className={styles.createBtn}
            onClick={() =>
              window.open("https://quotation.vidyadigitalstudio.com/", "_blank")
            }
          >
            + Create Quotation
          </button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sr.No.</th>
                <th>Client</th>
                <th>Categories</th>
                <th>Subtotal</th>
                <th>PDF</th>
                <th>Created on</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    No quotations found.
                  </td>
                </tr>
              ) : (
                paginated.map((q, index) => {
                  const categories = [
                    ...new Set(q.items.map((i) => i.category.trim())),
                  ];

                  return (
                    <tr key={q._id}>
                      <td>{start + index + 1}</td>
                      <td>{q.client.name}</td>

                      <td>
                        <div className={styles.categoryList}>
                          {categories.map((c) => (
                            <span key={c} className={styles.categoryPill}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className={styles.amount}>
                        ₹{q.subtotal.toLocaleString()}
                      </td>

                      <td>
                        <a
                          href={q.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.downloadBtn}
                        >
                          Download
                        </a>
                      </td>

                      <td>
                        {new Date(q.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(q._id)}
                          disabled={deletingId === q._id}
                        >
                          {deletingId === q._id ? <InlineLoader size={12} /> : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan="7">
                  <div className={styles.pagination}>
                    <div>
                      Rows:
                      <select
                        className={styles.rowsSelect}
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(+e.target.value);
                          setPage(1);
                        }}
                      >
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                      </select>
                    </div>

                    <div>
                      {start + 1}-{Math.min(start + rowsPerPage, total)} of{" "}
                      {total}
                    </div>

                    <div className={styles.pageControls}>
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ‹
                      </button>
                      <button
                        disabled={page === pages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
