import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClientById, deleteClient } from "../../api/client.api";
import { FaCopy } from "react-icons/fa";
import toast from "react-hot-toast";
import styles from "./ClientView.module.css";
import { useAuth } from "../../context/AuthContext";

const ClientView = () => {
  const { role } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const copyToClipboard = async (text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Copied");
    }
  };

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await getClientById(id);
      setClient(res.data);
    } catch {
      toast.error("Failed to load client");
      navigate(`/${role}/clients`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this client?",
    );
    if (!confirmDelete) return;

    try {
      await deleteClient(id);
      toast.success("Client deleted successfully");
      navigate(`/${role}/clients`);
    } catch {
      toast.error("Failed to delete client");
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading client...</div>;
  }

  if (!client) return null;

  const totalPaid =
    client.transactions?.reduce((sum, txn) => sum + txn.amount, 0) || 0;

  const remainingAmount = (client.totalAmount || 0) - totalPaid;

  const paidMonths =
    client.billingType === "monthly" && client.monthlyAmount
      ? Math.floor(totalPaid / client.monthlyAmount)
      : 0;

  const remainingMonths =
    client.billingType === "monthly" ? (client.tenure || 0) - paidMonths : null;

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <img
              src={client.profilePhoto || "/avatar.png"}
              alt="profile"
              className={styles.avatar}
            />
            <div className={styles.headerText}>
              <h2 className={styles.clientName}>{client.clientName}</h2>
              <p className={styles.ownerName}>{client.ownerName}</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.btn}
              onClick={() => navigate(`/${role}/clients`)}
            >
              Back
            </button>
            <button
              className={styles.btn}
              onClick={() => navigate(`/${role}/clients/${id}/edit`)}
            >
              Edit
            </button>
            <button className={styles.delete} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>

        {/* BASIC INFO */}
        <section className={styles.section}>
          <h3>Basic Information</h3>

          <div className={styles.grid}>
            <Info label="Email" value={client.email} />
            <Info label="Phone" value={client.phone} />
            <Info
              label="Onboarding Date"
              value={
                client.onboardingDate
                  ? new Date(client.onboardingDate).toLocaleDateString("en-GB")
                  : "-"
              }
            />
            <Info label="Billing Type" value={client.billingType} />
            <Info label="Payment Status" value={client.paymentStatus} />
          </div>

          <Info label="Address" value={client.address} full />
        </section>

        {/* SERVICES */}
        <section className={styles.section}>
          <h3>Services</h3>
          <div className={styles.services}>
            {client.services?.map((service, i) => (
              <span key={i} className={styles.servicePill}>
                {service}
              </span>
            ))}
          </div>
        </section>

        {/* PAYMENT DETAILS */}
        <section className={styles.section}>
          <h3>Payment Details</h3>

          <div className={styles.grid}>
            <Info label="Total Amount" value={`₹ ${client.totalAmount || 0}`} />
            <Info label="Paid Amount" value={`₹ ${totalPaid}`} />
            <Info label="Remaining Amount" value={`₹ ${remainingAmount}`} />

            {client.billingType === "monthly" && (
              <>
                <Info
                  label="Monthly Amount"
                  value={`₹ ${client.monthlyAmount || 0}`}
                />
                <Info label="Tenure" value={`${client.tenure || 0} months`} />
                <Info label="Paid Months" value={paidMonths} />
                <Info label="Remaining Months" value={remainingMonths} />
              </>
            )}
          </div>
        </section>

        {/* TRANSACTIONS */}
        <section className={styles.section}>
          <h3>Transaction History</h3>

          {!client.transactions || client.transactions.length === 0 ? (
            <p className={styles.empty}>No transactions found</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableRow}>
                    <th className={styles.tableHeader}>Date</th>
                    <th className={styles.tableHeader}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {client.transactions.map((t, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        {new Date(t.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className={styles.tableCell}>₹ {t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CREDENTIALS */}
        <section className={styles.section}>
          <h3>Credentials</h3>

          {!client.credentials || client.credentials.length === 0 ? (
            <p className={styles.empty}>No credentials added</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableRow}>
                    <th className={styles.tableHeader}>Platform</th>
                    <th className={styles.tableHeader}>Username</th>
                    <th className={styles.tableHeader}>Password</th>
                    <th className={styles.tableHeader}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {client.credentials.map((c, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.tableCell}>{c.platform}</td>
                      <td className={styles.tableCell}>
                        <div className={styles.passwordCell}>
                          {c.username}
                          <FaCopy onClick={() => copyToClipboard(c.username)} />
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.passwordCell}>
                          {c.password}
                          <FaCopy onClick={() => copyToClipboard(c.password)} />
                        </div>
                      </td>
                      <td className={styles.tableCell}>{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const Info = ({ label, value, full }) => (
  <div className={full ? styles.full : ""}>
    <div className={styles.label}>{label}</div>
    <div className={styles.value}>{value || "-"}</div>
  </div>
);

export default ClientView;
