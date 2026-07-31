import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaEye, FaPen } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { FiSearch, FiFilter, FiPlus, FiUser } from "react-icons/fi";
import { useClients } from "../../hooks/useClient";
import { formatISTDate } from "../../utils/date.util";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ViewClients.module.css";
import Loader from "../Loader/Loader";

export default function ViewClients() {
  const { role } = useAuth();
  const {
    clients,
    loading,
    error,
    rowLoading,
    page,
    totalPages,
    search,
    setSearch,
    status,
    setStatus,
    setPage,
    toggleClientStatus,
    deleteClient,
  } = useClients();

  const navigate = useNavigate();

  /* ================= DEBOUNCED SEARCH ================= */
  const [localSearch, setLocalSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(localSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, setPage, setSearch]);

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this client?",
    );

    if (!confirmDelete) return;

    const res = await deleteClient(id);

    if (res.success) {
      toast.success("Client deleted successfully");
    } else {
      toast.error(res.message);
    }
  };

  /* ================= TOGGLE ================= */
  const handleToggle = async (id, currentStatus) => {
    const res = await toggleClientStatus(id);

    if (res.success) {
      toast.success(currentStatus ? "Client deactivated" : "Client activated");
    } else {
      toast.error(res.message);
    }
  };

  const filteredClients = clients.filter((client) => {
    if (status === "active") return client.isActive === true;
    if (status === "inactive") return client.isActive === false;
    return true; // all
  });

  if (loading) return <Loader />;
  if (error) return <div className={styles.emptyState}>Error: {error}</div>;

  return (
    <div className={styles.pageContainer}>
      
      {/* HEADER SECTION */}
      <div className={styles.headerArea}>
        <div className={styles.titleBlock}>
          <h2 className={styles.pageTitle}>Client Portfolio</h2>
          <span className={styles.badge}>{clients.length} Total Clients</span>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => navigate(`/${role}/clients/create`)}
        >
          <FiPlus className={styles.btnIcon} /> Add Client
        </button>
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
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIconInside} />
          <input
            type="text"
            placeholder="Search clients..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
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
                <th>Client Profile</th>
                <th>Services</th>
                <th>Onboarding</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className={styles.emptyState}>No clients found.</div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => (
                  <tr key={client._id}>
                    {/* SR NO */}
                    <td className={styles.srText}>{(page - 1) * 10 + index + 1}</td>

                    {/* CLIENT INFO */}
                    <td>
                      <div className={styles.clientCell}>
                        {client.profilePhoto?.url ? (
                          <img
                            src={client.profilePhoto.url}
                            alt="avatar"
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            <FiUser />
                          </div>
                        )}
                        <div className={styles.clientInfo}>
                          <span className={styles.businessName}>{client.clientName}</span>
                          <span className={styles.ownerName}>{client.ownerName || "No Owner"}</span>
                        </div>
                      </div>
                    </td>

                    {/* SERVICES */}
                    <td>
                      <div className={styles.servicesWrap}>
                        {client.services?.length ? (
                          client.services.map((service, i) => (
                            <span key={i} className={styles.servicePill}>
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className={styles.emptyDash}>—</span>
                        )}
                      </div>
                    </td>

                    {/* DATE */}
                    <td>
                      <span className={styles.dateText}>
                        {client.onboardingDate ? formatISTDate(client.onboardingDate) : "—"}
                      </span>
                    </td>

                    {/* STATUS TOGGLE */}
                    <td>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={client.isActive}
                          onChange={() => handleToggle(client._id, client.isActive)}
                          disabled={rowLoading === client._id}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      {rowLoading === client._id ? (
                        <div className={styles.spinner}></div>
                      ) : (
                        <div className={styles.actionGroup}>
                          <button
                            className={styles.actionView}
                            onClick={() => navigate(`/${role}/clients/${client._id}`)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            className={styles.actionEdit}
                            onClick={() => navigate(`/${role}/clients/${client._id}/edit`)}
                            title="Edit Client"
                          >
                            <FaPen />
                          </button>
                          <button
                            className={styles.actionDelete}
                            onClick={() => handleDelete(client._id)}
                            title="Delete Client"
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
