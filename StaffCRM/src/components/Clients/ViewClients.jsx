import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaEye, FaPen } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { useClients } from "../../hooks/useClient";
import { formatISTDate } from "../../utils/date.util";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ViewClients.module.css";

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
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch]);

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

  const handleToggle = async (id, currentStatus) => {
    const res = await toggleClientStatus(id);

    if (res.success) {
      toast.success(currentStatus ? "Client deactivated" : "Client activated");
    } else {
      toast.error(res.message);
    }
  };

  if (loading) return <div className={styles.loader}>Loading...</div>;

  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2 className={styles.heading}>Client List</h2>

          <div className={styles.headerActions}>
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search clients..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={styles.search}
            />

            <button
              className={styles.createBtn}
              onClick={() => navigate(`/${role}/clients/create`)}
            >
              + Create Client
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sr.No</th>
                <th>Client</th>
                <th>Services</th>
                <th>Onboarding Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles.empty}>
                    No clients found
                  </td>
                </tr>
              )}

              {clients.map((client, index) => (
                <tr key={client._id}>
                  {/* SR NO */}
                  <td>{(page - 1) * 10 + index + 1}</td>

                  {/* CLIENT INFO */}
                  <td>
                    <div className={styles.clientCell}>
                      <img
                        src={client.profilePhoto?.url || "/people.png"}
                        alt="avatar"
                        className={styles.avatar}
                      />

                      <div>
                        <div className={styles.clientName}>
                          {client.clientName}
                        </div>
                        <div className={styles.ownerName}>
                          {client.ownerName || "-"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* SERVICES */}
                  <td>
                    <div className={styles.services}>
                      {client.services?.length
                        ? client.services.map((service, i) => (
                            <span key={i} className={styles.servicePill}>
                              {service}
                            </span>
                          ))
                        : "-"}
                    </div>
                  </td>

                  {/* DATE */}
                  <td>{formatISTDate(client.onboardingDate)}</td>

                  {/* ACTIONS */}
                  <td>
                    {rowLoading === client._id ? (
                      <div className={styles.spinner}></div>
                    ) : (
                      <div className={styles.actions}>
                        <button
                          className={styles.view}
                          onClick={() =>
                            navigate(`/${role}/clients/${client._id}`)
                          }
                        >
                          <FaEye />
                        </button>

                        <button
                          className={styles.edit}
                          onClick={() =>
                            navigate(`/${role}/clients/${client._id}/edit`)
                          }
                        >
                          <FaPen />
                        </button>

                        <button
                          className={styles.delete}
                          onClick={() => handleDelete(client._id)}
                        >
                          <MdDeleteForever />
                        </button>

                        {/* ACTIVE TOGGLE */}
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={client.isActive}
                            onChange={() =>
                              handleToggle(client._id, client.isActive)
                            }
                            disabled={rowLoading === client._id}
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
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
