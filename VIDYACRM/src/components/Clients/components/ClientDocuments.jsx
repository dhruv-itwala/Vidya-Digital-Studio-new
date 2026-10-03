import { useState } from "react";
import styles from "../ClientForm.module.css";
import toast from "react-hot-toast";
import { formatFileSize } from "../../../utils/time.util";
import { FiFileText, FiPlus, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import { validateFile } from "../../../utils/fileValidator";
import { getBackendErrorMessage } from "../../../utils/errorHandler";
import UploadProgressBar from "../../UI/UploadProgressBar";

export default function ClientDocuments({
  form,
  setForm,
  readOnly,
  isCreate,
  uploadDocument,
  deleteDocument,
}) {
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(0);

  const handleAddRow = () => {
    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, { file: null, isNew: true }],
    }));
  };

  const handleCancel = (index) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleUpload = async (doc, index) => {
    if (!doc.file) return toast.error("Select file");

    const isValid = validateFile(doc.file, {
      maxSizeMB: 10,
      allowedExtensions: [".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".webp"],
      fileLabel: "Document",
    });
    if (!isValid) return;

    try {
      setLoadingIndex(index);
      setUploadPercent(0);
      const res = await uploadDocument(form._id, doc.file, (percent) => {
        setUploadPercent(percent);
      });
      if (!res.success) throw new Error(res.message);
      toast.success("Uploaded successfully");
      setForm(res.data);
    } catch (err) {
      toast.error(getBackendErrorMessage(err, "Failed to upload document"));
    } finally {
      setLoadingIndex(null);
      setUploadPercent(0);
    }
  };

  const handleDelete = async (doc) => {
    try {
      setLoadingIndex(doc._id);
      const res = await deleteDocument(form._id, doc.public_id);
      if (!res.success) throw new Error(res.message);
      toast.success("Deleted successfully");
      setForm(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  const normalDate = (date) => {
    return new Date(date).toLocaleDateString("en-CA");
  };

  return (
    <>
      <div className={styles.subSectionHeader}>
        <div>
          <h3 className={styles.sectionTitle} style={{borderBottom: 'none', paddingBottom: 0}}>Client Documents</h3>
        </div>
        {!readOnly && !isCreate && (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleAddRow}
          >
            <FiPlus /> Add Document
          </button>
        )}
      </div>
      
      <div style={{marginTop: '24px'}}>
        {form.documents.length === 0 ? (
          <div className={styles.emptyBlock}>
            No documents uploaded yet.
          </div>
        ) : (
          form.documents.map((doc, index) => (
            <div key={doc._id || index} className={styles.listRow}>
              <div className={styles.rowInfo}>
                <div className={styles.rowIcon}>
                  <FiFileText />
                </div>
                
                <div className={styles.rowText}>
                  {doc.isNew ? (
                    <div>
                      <input
                        type="file"
                        className={styles.fileInput}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;

                          const isValid = validateFile(file, {
                            maxSizeMB: 10,
                            allowedExtensions: [".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".webp"],
                            fileLabel: "Document",
                          });
                          if (!isValid) {
                            e.target.value = "";
                            return;
                          }

                          const updated = [...form.documents];
                          updated[index].file = file;
                          updated[index].name = file.name;

                          setForm((prev) => ({
                            ...prev,
                            documents: updated,
                          }));
                        }}
                      />
                      {loadingIndex === index && uploadPercent > 0 && (
                        <UploadProgressBar percent={uploadPercent} label="Uploading..." />
                      )}
                    </div>
                  ) : (
                    <>
                      <h4>
                        <a href={doc.url} target="_blank" rel="noreferrer" style={{color: 'var(--deep-forest)', textDecoration: 'none'}}>
                          {doc.name}
                        </a>
                      </h4>
                      <p>
                        {doc.size ? formatFileSize(doc.size) : "N/A"} • Uploaded {doc.uploadedAt ? normalDate(doc.uploadedAt) : "N/A"}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {!readOnly && (
                <div className={styles.rowActions}>
                  {doc.isNew ? (
                    <>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        style={{background: 'var(--deep-forest)', color: 'white', border: 'none'}}
                        disabled={loadingIndex === index}
                        onClick={() => handleUpload(doc, index)}
                      >
                        {loadingIndex === index ? "..." : <><FiUploadCloud /> Save</>}
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleCancel(index)}
                        title="Cancel"
                      >
                        <FiX />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDelete(doc)}
                      disabled={loadingIndex === doc._id}
                      title="Delete Document"
                    >
                      {loadingIndex === doc._id ? "..." : <FiTrash2 />}
                    </button>
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
