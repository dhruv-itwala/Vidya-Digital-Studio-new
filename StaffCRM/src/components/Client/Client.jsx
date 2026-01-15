import { useEffect, useState } from "react";
import styles from "./Client.module.css";
import { getAllClientsAPI, deleteClientAPI } from "../../api/client.api";
import ClientModal from "./ClientModal";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function Client() {
  const [clients, setClients] = useState([]);
  const [mode, setMode] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getAllClientsAPI();
    setClients(res.data.clients || res.data);
  };

  const openAdd = () => {
    setSelectedClient(null);
    setMode("add");
  };

  const openEdit = (client) => {
    setSelectedClient(client);
    setMode("edit");
  };

  const openView = (client) => {
    setSelectedClient(client);
    setMode("view");
  };

  const closeModal = () => {
    setSelectedClient(null);
    setMode(null);
  };

  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    await deleteClientAPI(id);
    load();
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Clients</h2>
          <button className={styles.addBtn} onClick={openAdd}>
            + Add Client
          </button>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th>Services</th>
                <th>Billing</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {clients.map((c) => (
                <tr key={c._id} onClick={() => openView(c)}>
                  <td>
                    <div className={styles.clientCell}>
                      <strong>{c.clientName}</strong>
                      <div className={styles.sub}>{c.ownerName}</div>
                    </div>
                  </td>

                  <td>
                    <div className={styles.services}>
                      {c.services?.slice(0, 2).map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                      {c.services?.length > 2 && (
                        <em>+{c.services.length - 2}</em>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className={styles.amount}>₹{c.payment?.amount}</div>
                  </td>

                  <td>
                    <span
                      className={`${styles.badge} ${styles[c.payment?.status]}`}
                    >
                      {c.payment?.status}
                    </span>
                  </td>

                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actions}>
                      <FiEye
                        className={styles.icon}
                        onClick={() => openView(c)}
                      />
                      <FiEdit2
                        className={styles.icon}
                        onClick={() => openEdit(c)}
                      />
                      <FiTrash2
                        className={styles.icon}
                        onClick={() => deleteClient(c._id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mode && (
          <ClientModal
            mode={mode}
            defaultValues={selectedClient}
            onClose={closeModal}
            onSaved={load}
          />
        )}
      </div>
    </div>
  );
}
