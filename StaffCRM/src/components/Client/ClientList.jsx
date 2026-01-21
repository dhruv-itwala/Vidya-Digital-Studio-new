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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await getAllClients();
      setClients(res.data);
    } catch (err) {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (clientId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this client?",
    );
    if (!confirm) return;

    try {
      await deleteClient(clientId);
      toast.success("Client deleted successfully");
      setClients((prev) => prev.filter((c) => c._id !== clientId));
    } catch (err) {
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
                <th className={styles.headerRow}>Sr.No</th>
                <th className={styles.headerRow}>Client</th>
                <th className={styles.headerRow}>Services</th>
                <th className={styles.headerRow}>Onboarding Date</th>
                <th className={styles.headerRow}>Actions</th>
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
                  <td>{index + 1}</td>
                  {/* CLIENT INFO */}
                  <td>
                    <div className={styles.clientCell}>
                      <img
                        src={client.profilePhoto || "/avatar.png"}
                        alt="profile"
                        className={styles.avatar}
                      />
                      <div>
                        <div className={styles.clientName}>
                          {client.clientName}
                        </div>
                        <div className={styles.ownerName}>
                          {client.ownerName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* SERVICES */}
                  <td>
                    <div className={styles.services}>
                      {client.services.map((service, i) => (
                        <span key={i} className={styles.servicePill}>
                          {service}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* DATE */}
                  <td>
                    {new Date(client.onboardingDate).toLocaleDateString(
                      "en-GB",
                    )}
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
