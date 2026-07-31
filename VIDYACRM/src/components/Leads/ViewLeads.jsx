import { useEffect, useState } from "react";
import { useLeads } from "../../hooks/useLeads";
import styles from "./ViewLeads.module.css";
import { FaEye, FaPen } from "react-icons/fa";
import { RiFileTransferFill } from "react-icons/ri";
import { MdDeleteForever } from "react-icons/md";
import { FiPlus, FiSearch, FiFilter } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../Loader/Loader";

export default function ViewLeads() {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const statusOptions = [
    "Raw Lead",
    "First Contact Attempt",
    "Lead Qualification",
    "Appointment / Meeting Schedule",
    "Presentation / Demo / Consultation",
    "Proposal Send",
    "Negotiation",
    "Verbal Confirmation",
    "Client Won",
    "Closed Loss",
    "Transferred",
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "Raw Lead": return styles.raw;
      case "First Contact Attempt": return styles.contact;
      case "Lead Qualification": return styles.qualification;
      case "Appointment / Meeting Schedule": return styles.meeting;
      case "Presentation / Demo / Consultation": return styles.demo;
      case "Proposal Send": return styles.proposal;
      case "Negotiation": return styles.negotiation;
      case "Verbal Confirmation": return styles.verbal;
      case "Client Won": return styles.won;
      case "Closed Loss": return styles.loss;
      case "Transferred": return styles.transfer;
      default: return "";
    }
  };

  const getProposalClass = (proposal) => {
    switch (proposal) {
      case "Created": return styles.propCreated;
      case "Pending": return styles.propPending;
      default: return "";
    }
  };

  const proposalOptions = ["Pending", "Created"];

  const {
    leads,
    loading,
    error,
    rowLoading,
    page,
    totalPages,
    search,
    status,
    setStatus,
    setSearch,
    setPage,
    updateStatus,
    updateProposal,
    convertLead,
    deleteLead,
  } = useLeads();

  const [searchInput, setSearchInput] = useState(search);
  const statusCount = statusOptions.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  leads.forEach((lead) => {
    if (statusCount[lead.status] !== undefined) {
      statusCount[lead.status]++;
    }
  });

  /* ================= DEBOUNCE SEARCH ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, setPage, setSearch]);

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lead?")) return;

    const res = await deleteLead(id);
    if (res.success) toast.success("Lead deleted");
    else toast.error(res.message);
  };

  /* ================= UPDATE STATUS ================= */
  const handleStatusChange = async (id, newStatus) => {
    const res = await updateStatus(id, newStatus);
    if (res.success) {
      toast.success("Status updated");
    } else {
      toast.error(res.message);
    }
  };

  /* ================= UPDATE PROPOSAL ================= */
  const handleProposalChange = async (id, newProposal) => {
    const res = await updateProposal(id, newProposal);
    if (res.success) {
      toast.success("Proposal status updated");
    } else {
      toast.error(res.message);
    }
  };

  /* ================= TRANSFER ================= */
  const handleTransfer = async (lead) => {
    if (lead.status !== "Client Won") {
      toast.error("Only leads with status 'Client Won' can be transferred.");
      return;
    }
    if (!window.confirm("Transfer this lead to Client?")) return;

    const res = await convertLead(lead._id);
    if (res.success) toast.success("Lead transferred successfully");
    else toast.error(res.message);
  };

  const processedLeads = leads
    .filter((lead) => lead.status !== "Transferred")
    .sort((a, b) => {
      const bottomStatuses = ["Client Won", "Closed Loss"];
      const aBottom = bottomStatuses.includes(a.status);
      const bBottom = bottomStatuses.includes(b.status);
      if (aBottom === bBottom) return 0;
      return aBottom ? 1 : -1;
    });

  if (loading) return <Loader />;
  if (error) return <div className={styles.emptyState}>{error}</div>;

  return (
    <div className={styles.pageContainer}>
      
      {/* HEADER SECTION */}
      <div className={styles.headerArea}>
        <div className={styles.titleBlock}>
          <h2 className={styles.pageTitle}>Leads Pipeline</h2>
          <span className={styles.badge}>{leads.length} Active Leads</span>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => navigate(`/${role}/leads/create`)}
        >
          <FiPlus className={styles.btnIcon} /> Add Lead
        </button>
      </div>

      {/* PIE / DOUGHNUT CHART GRAPH */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3>Pipeline Distribution</h3>
          <p>Visualizing your lead volume across all stages</p>
        </div>
        
        <div className={styles.pieContainer}>
          {(() => {
            const statusColors = {
              "Raw Lead": "#94a3b8",
              "First Contact Attempt": "#60a5fa",
              "Lead Qualification": "#3b82f6",
              "Appointment / Meeting Schedule": "#8b5cf6",
              "Presentation / Demo / Consultation": "#a855f7",
              "Proposal Send": "#f59e0b",
              "Negotiation": "#f97316",
              "Verbal Confirmation": "#10b981",
              "Client Won": "#059669",
              "Closed Loss": "#ef4444",
              "Transferred": "#475569"
            };

            const total = Object.values(statusCount).reduce((a, b) => a + b, 0);
            let currentAngle = 0;
            
            const gradientStops = total === 0 
              ? "#e2e8f0 0% 100%" 
              : statusOptions.map(s => {
                  const count = statusCount[s] || 0;
                  if (count === 0) return null;
                  const percentage = (count / total) * 100;
                  const start = currentAngle;
                  currentAngle += percentage;
                  return `${statusColors[s]} ${start}% ${currentAngle}%`;
                }).filter(Boolean).join(", ");

            return (
              <div className={styles.pieLayout}>
                <div className={styles.pieWrapper}>
                  <div 
                    className={styles.pieChart}
                    style={{ background: `conic-gradient(${gradientStops})` }}
                  >
                    <div className={styles.pieHole}>
                      <span className={styles.pieTotal}>{total}</span>
                      <span className={styles.pieTotalLabel}>Leads</span>
                    </div>
                  </div>
                </div>

                <div className={styles.pieLegend}>
                  {statusOptions.map((s) => {
                    const count = statusCount[s] || 0;
                    return (
                      <div key={s} className={`${styles.legendItem} ${count === 0 ? styles.legendZero : ''}`}>
                        <span 
                          className={styles.legendColor} 
                          style={{ background: statusColors[s] }}
                        ></span>
                        <span className={styles.legendLabel}>{s}</span>
                        <span className={styles.legendCount}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className={styles.utilityBar}>
        <div className={styles.filterGroup}>
          <div className={styles.filterHeader}>
            <FiFilter className={styles.filterIcon} />
            <span>Filter</span>
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className={styles.selectInput}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIconInside} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sr</th>
                <th>Business Name</th>
                <th>Services</th>
                <th>Status</th>
                <th>Proposal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedLeads.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className={styles.emptyState}>No leads found in this view.</div>
                  </td>
                </tr>
              ) : (
                processedLeads.map((lead, index) => (
                  <tr key={lead._id}>
                    <td className={styles.srText}>{(page - 1) * 10 + index + 1}</td>
                    
                    <td>
                      <span className={styles.businessName}>{lead.clientName}</span>
                    </td>

                    <td>
                      <div className={styles.servicesWrap}>
                        {lead.services?.map((service, i) => (
                          <span key={i} className={styles.servicePill}>
                            {service}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className={`${styles.statusDropdown} ${getStatusClass(lead.status)}`}
                        disabled={lead.status === "Transferred"}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        value={lead.proposal}
                        onChange={(e) => handleProposalChange(lead._id, e.target.value)}
                        className={`${styles.proposalDropdown} ${getProposalClass(lead.proposal)}`}
                        disabled={lead.proposal === "Transferred"}
                      >
                        {proposalOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>

                    <td>
                      {rowLoading === lead._id ? (
                        <div className={styles.spinner}></div>
                      ) : (
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.actionView}
                            onClick={() => navigate(`/${role}/leads/${lead._id}`)}
                            title="View Lead"
                          >
                            <FaEye />
                          </button>
                          <button
                            className={styles.actionEdit}
                            onClick={() => navigate(`/${role}/leads/${lead._id}/edit`)}
                            title="Edit Lead"
                          >
                            <FaPen />
                          </button>
                          <button
                            className={styles.actionTransfer}
                            onClick={() => handleTransfer(lead)}
                            disabled={lead.proposal === "Transferred"}
                            title="Transfer to Client"
                          >
                            <RiFileTransferFill />
                          </button>
                          <button
                            className={styles.actionDelete}
                            onClick={() => handleDelete(lead._id)}
                            title="Delete Lead"
                          >
                            <MdDeleteForever />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className={styles.pageBtn}
            >
              Prev
            </button>
            <span className={styles.pageText}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
