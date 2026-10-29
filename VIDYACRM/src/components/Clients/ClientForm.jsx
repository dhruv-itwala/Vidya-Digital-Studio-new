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
import ClientPortalSettings from "./components/ClientPortalSettings";
import ContentCalendarManager from "./components/ContentCalendarManager";
import { FiArrowLeft, FiCheckCircle, FiEdit2, FiExternalLink, FiCalendar } from "react-icons/fi";
import InlineLoader from "../UI/InlineLoader";

export default function ClientForm({ mode = "view", initialData = null }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const pathPrefix = role === "intern" ? "employee" : role;
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
  const [updatingBasic, setUpdatingBasic] = useState(false);
  const [updatingServices, setUpdatingServices] = useState(false);
  const [updatingPortal, setUpdatingPortal] = useState(false);

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
    transactions: [],
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
    if (!form.clientName.trim()) return "Business/Client name is required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      return "Invalid email format";
    if (form.phone && !/^\d{10}$/.test(form.phone))
      return "Phone must be 10 digits";
    return null;
  };

  /* ================= INDEPENDENT SECTION UPDATES ================= */

  // 1. Update Basic Information
  const handleUpdateBasicInfo = async (basicData) => {
    if (!form._id) return;
    try {
      setUpdatingBasic(true);
      const res = await updateClient(form._id, basicData);
      if (!res.success) throw new Error(res.message);
      toast.success("Basic Information updated successfully");
      setIsDirty(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update basic info");
    } finally {
      setUpdatingBasic(false);
    }
  };

  // 2. Update Active Services
  const handleUpdateServices = async (servicesList) => {
    if (!form._id) return;
    try {
      setUpdatingServices(true);
      const res = await updateClient(form._id, { services: servicesList });
      if (!res.success) throw new Error(res.message);
      toast.success("Active Services updated successfully");
      setIsDirty(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update services");
    } finally {
      setUpdatingServices(false);
    }
  };

  // 3. Update Client Portal Settings
  const handleUpdatePortalSettings = async (portalData) => {
    if (!form._id) return;
    try {
      setUpdatingPortal(true);
      const res = await updateClient(form._id, portalData);
      if (!res.success) throw new Error(res.message);
      toast.success("Client Portal Settings updated successfully");
      setIsDirty(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update portal settings");
    } finally {
      setUpdatingPortal(false);
    }
  };

  /* ================= SAVE (Used for Onboarding / Create) ================= */
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);
      // eslint-disable-next-line no-unused-vars
      const { credentials, documents, transactions, invoices, ...rest } = form;
      const finalData = { ...rest };

      if (!(form.profilePhoto instanceof File)) {
        delete finalData.profilePhoto;
      }

      let res;
      if (isCreate) res = await createClient(finalData);
      else res = await updateClient(form._id, finalData);

      if (!res.success) throw new Error(res.message);

      toast.success(isCreate ? "Client created successfully" : "Client updated successfully");
      setIsDirty(false);
      navigate(`/${pathPrefix}/clients`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save client");
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
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(-1)}
              title="Back"
            >
              <FiArrowLeft />
            </button>
            <div className={styles.headerText}>
              <h2 className={styles.heading}>
                {isCreate ? "Onboard New Client" : isEdit ? "Edit Client Profile" : "Client Portfolio"}
              </h2>
              <p className={styles.subHeading}>
                {isCreate
                  ? "Enter details to create a new client portfolio."
                  : isEdit
                    ? "Update each segment independently using the buttons below."
                    : "Viewing client portfolio."}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            {isView && (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => navigate(`/${pathPrefix}/clients/${form._id}/portal`)}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                <FiExternalLink /> Portal View
              </button>
            )}
            {isView && (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => navigate(`/${pathPrefix}/clients/${form._id}/edit`)}
              >
                <FiEdit2 /> Edit Profile
              </button>
            )}

            {isCreate && (
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={styles.primaryBtn}
              >
                {loading && <InlineLoader size={16} />}
                <span>{loading ? "Saving..." : "Save Client"}</span>
                {!loading && <FiCheckCircle />}
              </button>
            )}

            {isEdit && (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => navigate(`/${pathPrefix}/clients/${form._id}/portal`)}
                style={{ backgroundColor: "#0F5C44", borderColor: "#0F5C44" }}
              >
                <FiExternalLink /> View Portal
              </button>
            )}
          </div>
        </div>

        {/* FORM BODY (BENTO GRID) */}
        <div className={styles.formBody}>
          {/* SEGMENT 1: BASIC INFORMATION */}
          <div className={styles.bentoSection}>
            <ClientBasicInfo
              form={form}
              setForm={setFormWithDirty}
              readOnly={readOnly}
              photoPreview={photoPreview}
              setPhotoPreview={setPhotoPreview}
              isEdit={isEdit}
              onUpdate={handleUpdateBasicInfo}
              updating={updatingBasic}
            />
          </div>

          {/* SEGMENT 2: ACTIVE SERVICES */}
          <div className={styles.bentoSection}>
            <ClientServices
              services={form.services}
              setForm={setFormWithDirty}
              isView={isView}
              isEdit={isEdit}
              onUpdate={handleUpdateServices}
              updating={updatingServices}
            />
          </div>

          {/* SEGMENT 3: CLIENT PORTAL SETTINGS */}
          <div className={styles.bentoSection}>
            <ClientPortalSettings
              form={form}
              setForm={setFormWithDirty}
              readOnly={readOnly}
              isEdit={isEdit}
              onUpdate={handleUpdatePortalSettings}
              updating={updatingPortal}
            />
          </div>

          {/* SEGMENT 4: CONTENT CALENDAR */}
          {form._id && (
              <ContentCalendarManager
                clientId={form._id}
                readOnly={readOnly}
                onSpreadsheetUpdated={(url) =>
                  setForm((prev) => ({ ...prev, contentCalendarLink: url }))
                }
              />
          )}

          {!isCreate && (
            <>
              {/* SEGMENT 5: DOCUMENTS */}
              <div className={styles.bentoSection}>
                <ClientDocuments
                  form={form}
                  setForm={setFormWithDirty}
                  readOnly={readOnly}
                  isCreate={isCreate}
                  uploadDocument={uploadDocument}
                  deleteDocument={deleteDocument}
                />
              </div>

              {/* SEGMENT 6: CREDENTIALS */}
              <div className={styles.bentoSection}>
                <ClientCredentials
                  form={form}
                  setForm={setFormWithDirty}
                  readOnly={readOnly}
                  isCreate={isCreate}
                  addCredential={addCredential}
                  deleteCredential={deleteCredential}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
