// VIDYACRM/src/pages/Invoices/AllInvoices.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Loader from "../../components/Loader/Loader";
import InvoicePreviewModal from "./InvoicePreviewModal";
import { getAllInvoicesAPI, deleteInvoiceAPI } from "../../api/invoice.api";
import styles from "./AllInvoices.module.css";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiExternalLink,
  FiEdit2,
  FiTrash2,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

export default function AllInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInv, setPreviewInv] = useState(null);

  const location = useLocation();
  const basePath = location.pathname.startsWith("/hr") ? "/hr/invoices" : "/admin/invoices";

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await getAllInvoicesAPI();
      if (res.data?.success) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, invNum) => {
    if (deletingId) return;
    const ok = window.confirm(`Are you sure you want to delete invoice ${invNum}? This action cannot be undone.`);
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteInvoiceAPI(id);
      setInvoices((prev) => prev.filter((inv) => inv._id !== id));
      toast.success(`Invoice ${invNum} removed successfully`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenPreview = (inv) => {
    setPreviewInv(inv);
    setPreviewOpen(true);
  };

  // KPIs
  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalAdvance = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      totalBilled += Number(inv.totalAmount || 0);
      totalAdvance += Number(inv.advanceAmount || 0);
      totalPending += Number(inv.remainingAmount || 0);
    });

    return {
      count: invoices.length,
      billed: totalBilled,
      collected: totalAdvance,
      pending: totalPending,
    };
  }, [invoices]);

  // Filtering
  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (statusFilter !== "all") {
      result = result.filter((inv) => (inv.status || "unpaid").toLowerCase() === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((inv) => {
        const num = (inv.invoiceNumber || "").toLowerCase();
        const client = (inv.client?.name || "").toLowerCase();
        const comp = (inv.client?.companyName || "").toLowerCase();
        return num.includes(q) || client.includes(q) || comp.includes(q);
      });
    }

    return result;
  }, [invoices, searchQuery, statusFilter]);

  if (loading) return <Loader />;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Client Invoices</h1>
            <p className={styles.subtitle}>
              Generate, monitor, and manage official GST and advance client invoices.
            </p>
          </div>
          <Link to={`${basePath}/create-invoice`} className={styles.createBtn}>
            <FiPlus size={16} />
            <span>Create New Invoice</span>
          </Link>
        </div>

        {/* KPI Stats Strip */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrap} ${styles.iconGreen}`}>
              <FiFileText />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Invoices</span>
              <span className={styles.metricValue}>{stats.count}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrap} ${styles.iconBlue}`}>
              <FiDollarSign />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Invoiced</span>
              <span className={styles.metricValue}>₹{stats.billed.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrap} ${styles.iconGreen}`}>
              <FiCheckCircle />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Collected Advance</span>
              <span className={styles.metricValue}>₹{stats.collected.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={`${styles.metricIconWrap} ${styles.iconRed}`}>
              <FiClock />
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Pending Balance</span>
              <span className={styles.metricValue}>₹{stats.pending.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Controls / Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by Invoice #, Client, or Company..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.filterActions}>
            <select
              className={styles.selectControl}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <button
              type="button"
              className={styles.refreshBtn}
              onClick={fetchInvoices}
              title="Refresh Invoices"
            >
              <FiRefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          {filteredInvoices.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Issue Date</th>
                  <th>Billed To</th>
                  <th>Total Amount</th>
                  <th>Advance / Pending</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const status = (inv.status || "unpaid").toLowerCase();
                  let badgeClass = styles.statusUnpaid;
                  if (status === "paid") badgeClass = styles.statusPaid;
                  else if (status === "partial") badgeClass = styles.statusPartial;

                  return (
                    <tr key={inv._id || inv.invoiceNumber}>
                      <td>
                        <span className={styles.invBadge}>{inv.invoiceNumber}</span>
                      </td>
                      <td>{inv.invoiceDate || "—"}</td>
                      <td>
                        <div className={styles.clientBlock}>
                          <span className={styles.clientCompany}>
                            {inv.client?.companyName || inv.client?.name || "Untitled Client"}
                          </span>
                          {inv.client?.companyName && inv.client?.name && (
                            <span className={styles.clientName}>{inv.client.name}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                          ₹{(inv.totalAmount || 0).toLocaleString("en-IN")}
                        </strong>
                      </td>
                      <td>
                        <div className={styles.amountGroup}>
                          <span>Advance: ₹{(inv.advanceAmount || 0).toLocaleString("en-IN")}</span>
                          {inv.remainingAmount > 0 && (
                            <span className={styles.amountBalance}>
                              Due: ₹{inv.remainingAmount.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${badgeClass}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell} style={{ justifyContent: "flex-end" }}>
                          {inv.pdfUrl && (
                            <button
                              type="button"
                              className={styles.tableActionBtn}
                              onClick={() => handleOpenPreview(inv)}
                              title="View Document"
                            >
                              <FiExternalLink size={13} />
                              <span>View PDF</span>
                            </button>
                          )}

                          <Link
                            to={`${basePath}/${inv._id}/edit`}
                            className={styles.tableActionBtn}
                            title="Edit & Regenerate Invoice"
                          >
                            <FiEdit2 size={13} />
                            <span>Edit</span>
                          </Link>

                          <button
                            type="button"
                            className={`${styles.tableActionBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                            disabled={deletingId === inv._id}
                            title="Delete Invoice"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <FiAlertCircle size={36} style={{ color: "var(--color-primary)" }} />
              <div className={styles.emptyTitle}>No Invoices Found</div>
              <p>
                {searchQuery || statusFilter !== "all"
                  ? "No invoices match your current filter. Try clearing your search."
                  : "You haven't generated any invoices yet. Click '+ Create New Invoice' above to get started."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Document Preview Modal */}
      {previewInv && (
        <InvoicePreviewModal
          isOpen={previewOpen}
          status="success"
          pdfUrl={previewInv.pdfUrl}
          invoiceNumber={previewInv.invoiceNumber}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewInv(null);
          }}
        />
      )}
    </div>
  );
}

