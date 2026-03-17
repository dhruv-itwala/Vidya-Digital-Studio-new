import { useEffect, useState } from "react";
import { useLeads } from "../../hooks/useLeads";
import styles from "./ViewLeads.module.css";
import { FaEye, FaPen } from "react-icons/fa";
import { RiFileTransferFill } from "react-icons/ri";
import { MdDeleteForever } from "react-icons/md";
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
  ];

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
    proposal,
    setStatus,
    setProposal,
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
  }, [searchInput]);

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
    // Check if lead is eligible for transfer
    if (lead.status !== "Client Won") {
      toast.error("Only leads with status 'Client Won' can be transferred.");
      return;
    }

    if (!window.confirm("Transfer this lead?")) return;

    const res = await convertLead(lead._id);

    if (res.success) {
      toast.success("Lead transferred successfully");
    } else {
      toast.error(res.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* ================= HEADER ================= */}
        <div className={styles.header}>
          <h2 className={styles.heading}>Raw Leads</h2>

          <div className={styles.headerActions}>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={styles.search}
            />
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className={styles.statusFilter}
            >
              <option value="">All Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              className={styles.createBtn}
              onClick={() => navigate(`/${role}/leads/create`)}
            >
              + Create Lead
            </button>
          </div>
        </div>

        <div className={styles.funnelContainer}>
          {statusOptions.map((status, index) => {
            const count = statusCount[status] || 0;

            return (
              <div key={status} className={styles.funnelStep}>
                <div
                  className={styles.funnelBar}
                  style={{
                    width: `${Math.max(count * 20, 40)}px`,
                  }}
                >
                  <span>{count}</span>
                </div>
                <p>{status}</p>
              </div>
            );
          })}
        </div>

        {/* ================= TABLE ================= */}
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
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.noData}>
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead, index) => (
                  <tr key={lead._id} className={styles.tableRow}>
                    <td>{(page - 1) * 10 + index + 1}</td>

                    <td className={styles.businessName}>{lead.clientName}</td>

                    <td>
                      <div className={styles.pills}>
                        {lead.services?.map((service, i) => (
                          <span key={i} className={styles.pill}>
                            {service}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          handleStatusChange(lead._id, e.target.value)
                        }
                        className={`${styles.statusSelect} ${
                          lead.status === "Transferred"
                            ? styles.transferred
                            : ""
                        }`}
                        disabled={lead.status === "Transferred"}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        value={lead.proposal}
                        onChange={(e) =>
                          handleProposalChange(lead._id, e.target.value)
                        }
                        className={`${styles.statusSelect} ${
                          lead.proposal === "Transferred"
                            ? styles.transferred
                            : ""
                        }`}
                        disabled={lead.proposal === "Transferred"}
                      >
                        {proposalOptions.map((proposal) => (
                          <option key={proposal} value={proposal}>
                            {proposal}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      {rowLoading === lead._id ? (
                        <div className={styles.spinner}></div>
                      ) : (
                        <div className={styles.actions}>
                          <button
                            className={styles.view}
                            onClick={() =>
                              navigate(`/${role}/leads/${lead._id}`)
                            }
                          >
                            <FaEye />
                          </button>

                          <button
                            className={styles.edit}
                            onClick={() =>
                              navigate(`/${role}/leads/${lead._id}/edit`)
                            }
                          >
                            <FaPen />
                          </button>

                          <button
                            className={styles.delete}
                            onClick={() => handleDelete(lead._id)}
                          >
                            <MdDeleteForever />
                          </button>

                          <button
                            className={styles.transfer}
                            onClick={() => handleTransfer(lead)}
                            disabled={lead.proposal === "Transferred"}
                          >
                            <RiFileTransferFill />
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

        {/* ================= PAGINATION ================= */}
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
