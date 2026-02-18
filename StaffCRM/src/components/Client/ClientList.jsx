import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye, FaPen } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { getAllClients, deleteClient } from "../../api/client.api";
import styles from "./ClientList.module.css";
import { useAuth } from "../../context/AuthContext";

const ClientList = () => {
  const { role } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* =========================================
     FETCH CLIENTS
  ========================================= */
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await getAllClients();
      setClients(res.data || []);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /* =========================================
     DELETE CLIENT
  ========================================= */
  const handleDelete = async (clientId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?",
    );
    if (!confirmDelete) return;

    try {
      await deleteClient(clientId);
      toast.success("Client deleted successfully");

      setClients((prev) => prev.filter((c) => c._id !== clientId));
    } catch {
      toast.error("Failed to delete client");
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading clients...</div>;
  }

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Client List</h2>

          <button
            className={styles.createBtn}
            onClick={() => navigate(`/${role}/clients/create`)}
          >
            + Create Client
          </button>
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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    No clients found
                  </td>
                </tr>
              )}

              {clients.map((client, index) => (
                <tr key={client._id}>
                  {/* SERIAL */}
                  <td>{index + 1}</td>

                  {/* CLIENT INFO */}
                  <td>
                    <div className={styles.clientCell}>
                      <img
                        src={client.profilePhoto?.url || "/avatar.png"}
                        alt="profile"
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
                      {client.services?.length ? (
                        client.services.map((service, i) => (
                          <span key={i} className={styles.servicePill}>
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className={styles.empty}>-</span>
                      )}
                    </div>
                  </td>

                  {/* DATE */}
                  <td>
                    {client.onboardingDate
                      ? new Date(client.onboardingDate).toLocaleDateString(
                          "en-GB",
                        )
                      : "-"}
                  </td>

                  {/* PAYMENT STATUS */}
                  <td>
                    <span
                      className={`${styles.status} ${
                        styles[client.paymentStatus]
                      }`}
                    >
                      {client.paymentStatus}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
