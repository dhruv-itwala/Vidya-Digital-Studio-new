import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClients } from "../../hooks/useClient";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import styles from "./ClientForm.module.css";
import ClientBasicInfo from "./components/ClientBasicInfo";
import ClientServices from "./components/ClientServices";
import ClientDocuments from "./components/ClientDocuments";
import ClientCredentials from "./components/ClientCredentials";
import ClientTransactions from "./components/ClientTransactions";

export default function ClientForm({ mode = "view", initialData = null }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const {
    createClient,
    updateClient,
    uploadDocument,
    deleteDocument,
    addCredential,
    deleteCredential,
  } = useClients();

  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const readOnly = isView;

  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [form, setForm] = useState({
    clientName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    services: [],
    onboardingDate: "",
    notes: "",
    profilePhoto: null,
    credentials: [],
    documents: [],
    transactions: [], // add this
    isActive: true,
  });

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (initialData && !initialized) {
      setForm({
        ...initialData,
        services: initialData.services || [],
        credentials: initialData.credentials || [],
        documents: initialData.documents || [],
        profilePhoto: initialData.profilePhoto || null,
        onboardingDate: initialData.onboardingDate
          ? new Date(initialData.onboardingDate).toISOString().split("T")[0]
          : "",
      });

      if (initialData.profilePhoto?.url) {
        setPhotoPreview(initialData.profilePhoto.url);
      }

      setInitialized(true);
    }
  }, [initialData, initialized]);

  /* ================= UNSAVED CHANGES GUARD ================= */

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    if (!form.clientName.trim()) return "Client name is required";

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      return "Invalid email format";

    if (form.phone && !/^\d{10}$/.test(form.phone))
      return "Phone must be 10 digits";

    return null;
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);

      // eslint-disable-next-line no-unused-vars
      const { credentials, documents, transactions, ...rest } = form;

      const finalData = { ...rest };
      if (!(form.profilePhoto instanceof File)) {
        delete finalData.profilePhoto;
      }
      let res;
      if (isCreate) res = await createClient(finalData);
      if (isEdit) res = await updateClient(form._id, finalData);

      if (!res.success) throw new Error(res.message);

      toast.success("Saved successfully");

      setIsDirty(false);
      navigate(`/${role}/clients`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= MARK DIRTY ================= */
  const setFormWithDirty = (updater) => {
    setIsDirty(true);

    if (typeof updater === "function") {
      setForm(updater);
    } else {
      setForm({
        ...updater,
        services: updater.services || [],
        documents: updater.documents || [],
        credentials: updater.credentials || [],
        transactions: updater.transactions || [],
      });
    }
  };

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2>
            {isCreate
              ? "New Client"
              : isEdit
                ? "Edit Client"
                : "Client Details"}
          </h2>

          <div className={styles.actions}>
            <button
              className={styles.secondaryBtn}
              onClick={() => navigate(-1)}
            >
              Back
            </button>

            {isView && (
              <button
                className={styles.primaryBtn}
                onClick={() => navigate(`/${role}/clients/${form._id}/edit`)}
              >
                Edit
              </button>
            )}

            {!isView && (
              <button
                className={styles.primaryBtn}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </div>

        {/* Sections */}

        <ClientBasicInfo
          form={form}
          setForm={setFormWithDirty}
          readOnly={readOnly}
          photoPreview={photoPreview}
          setPhotoPreview={setPhotoPreview}
        />

        <ClientServices
          services={form.services}
          setForm={setFormWithDirty}
          isView={isView}
        />
        {isCreate ? (
          <></>
        ) : (
          <>
            {/* <ClientTransactions
              form={form}
              setForm={setFormWithDirty}
              readOnly={readOnly}
              isCreate={isCreate}
              addTransaction={addTransaction}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
            />*/}

            <ClientDocuments
              form={form}
              setForm={setFormWithDirty}
              readOnly={readOnly}
              isCreate={isCreate}
              uploadDocument={uploadDocument}
              deleteDocument={deleteDocument}
            />

            <ClientCredentials
              form={form}
              setForm={setFormWithDirty}
              readOnly={readOnly}
              isCreate={isCreate}
              addCredential={addCredential}
              deleteCredential={deleteCredential}
            />
          </>
        )}
      </div>
    </div>
  );
}
