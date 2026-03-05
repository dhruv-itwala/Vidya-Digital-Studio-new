import { useState } from "react";
import styles from "../ClientForm.module.css";
import toast from "react-hot-toast";

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

      // ✅ Sync entire updated client from backend
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

      // ✅ Sync full client
      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Credentials</h3>

        {!readOnly && !isCreate && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAddRow}
          >
            + Add Credential
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Platform</th>
              <th>Username</th>
              <th>Password</th>
              <th>Note</th>
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {form.credentials.length === 0 && (
              <tr>
                <td colSpan="5" className={styles.empty}>
                  No credentials added
                </td>
              </tr>
            )}

            {form.credentials.map((cred, index) => (
              <tr key={cred._id || index}>
                {["platform", "username", "password", "note"].map((field) => (
                  <td key={field}>
                    {cred.isNew ? (
                      <input
                        // type={field === "password" ? "password" : "text"}
                        type="text"
                        value={cred[field] || ""}
                        onChange={(e) => {
                          const updated = [...form.credentials];
                          updated[index][field] = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            credentials: updated,
                          }));
                        }}
                      />
                    ) : field === "password" ? (
                      <div className={styles.passwordCell}>
                        <span>{cred.password}</span>
                      </div>
                    ) : (
                      cred[field]
                    )}
                  </td>
                ))}

                {!readOnly && (
                  <td>
                    {cred.isNew ? (
                      <button
                        className={styles.primaryBtn}
                        disabled={loadingIndex === index}
                        onClick={() => handleSave(cred, index)}
                      >
                        {loadingIndex === index ? "Saving..." : "Save"}
                      </button>
                    ) : (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(cred)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
