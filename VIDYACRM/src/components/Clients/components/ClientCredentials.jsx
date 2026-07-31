import { useState } from "react";
import styles from "../ClientForm.module.css";
import toast from "react-hot-toast";
import { FiLock, FiPlus, FiTrash2, FiSave, FiX, FiInfo } from "react-icons/fi";

export default function ClientCredentials({
  form,
  setForm,
  readOnly,
  isCreate,
  addCredential,
  deleteCredential,
}) {
  const [loadingIndex, setLoadingIndex] = useState(null);

  const handleAddRow = () => {
    setForm((prev) => ({
      ...prev,
      credentials: [
        ...prev.credentials,
        {
          platform: "",
          username: "",
          password: "",
          note: "",
          isNew: true,
        },
      ],
    }));
  };

  const handleCancel = (index) => {
    setForm((prev) => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (cred, index) => {
    if (!cred.platform || !cred.username) {
      return toast.error("Platform & Username required");
    }

    try {
      setLoadingIndex(index);
      const cleanCred = {
        platform: cred.platform,
        username: cred.username,
        password: cred.password,
        note: cred.note,
      };

      const res = await addCredential(form._id, cleanCred);
      if (!res.success) throw new Error(res.message);
      toast.success("Credential added");
      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleDelete = async (cred) => {
    try {
      const res = await deleteCredential(form._id, cred._id);
      if (!res.success) throw new Error(res.message);
      toast.success("Credential deleted");
      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className={styles.subSectionHeader}>
        <div>
          <h3 className={styles.sectionTitle} style={{borderBottom: 'none', paddingBottom: 0}}>Client Credentials</h3>
        </div>

        {!readOnly && !isCreate && (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleAddRow}
          >
            <FiPlus /> Add Credential
          </button>
        )}
      </div>

      <div style={{marginTop: '24px'}}>
        {form.credentials.length === 0 ? (
          <div className={styles.emptyBlock}>
            No credentials stored.
          </div>
        ) : (
          form.credentials.map((cred, index) => (
            <div key={cred._id || index}>
              {cred.isNew ? (
                <div className={styles.modalForm}>
                  <div className={styles.grid2}>
                    <div className={styles.inputGroup}>
                      <label>Platform / URL <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        className={styles.inputField}
                        placeholder="e.g. WordPress, Shopify..."
                        value={cred.platform || ""}
                        onChange={(e) => {
                          const updated = [...form.credentials];
                          updated[index].platform = e.target.value;
                          setForm((prev) => ({ ...prev, credentials: updated }));
                        }}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Username / Email <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        className={styles.inputField}
                        placeholder="admin@example.com"
                        value={cred.username || ""}
                        onChange={(e) => {
                          const updated = [...form.credentials];
                          updated[index].username = e.target.value;
                          setForm((prev) => ({ ...prev, credentials: updated }));
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.grid2}>
                    <div className={styles.inputGroup}>
                      <label>Password</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        placeholder="Enter password..."
                        value={cred.password || ""}
                        onChange={(e) => {
                          const updated = [...form.credentials];
                          updated[index].password = e.target.value;
                          setForm((prev) => ({ ...prev, credentials: updated }));
                        }}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Notes (Optional)</label>
                      <input
                        type="text"
                        className={styles.inputField}
                        placeholder="Any extra info..."
                        value={cred.note || ""}
                        onChange={(e) => {
                          const updated = [...form.credentials];
                          updated[index].note = e.target.value;
                          setForm((prev) => ({ ...prev, credentials: updated }));
                        }}
                      />
                    </div>
                  </div>

                  <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px'}}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => handleCancel(index)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      style={{background: 'var(--deep-forest)', color: 'white', border: 'none'}}
                      disabled={loadingIndex === index}
                      onClick={() => handleSave(cred, index)}
                    >
                      {loadingIndex === index ? "..." : <><FiSave /> Save</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.listRow}>
                  <div className={styles.rowInfo}>
                    <div className={styles.rowIcon}>
                      <FiLock />
                    </div>
                    <div className={styles.rowText}>
                      <h4>{cred.platform}</h4>
                      <p>
                        User: {cred.username} &nbsp;•&nbsp; Pass: {cred.password || "*****"}
                      </p>
                      {cred.note && (
                        <p style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#6b7280'}}>
                          <FiInfo /> {cred.note}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {!readOnly && (
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(cred)}
                        title="Delete Credential"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
