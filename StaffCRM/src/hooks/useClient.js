import { useState } from "react";
import toast from "react-hot-toast";
import {
  createClient,
  updateClient,
  uploadClientDocuments,
  deleteClientDocument,
} from "../api/client.api";

export const useClient = () => {
  const [loading, setLoading] = useState(false);

  /* =========================================
     CREATE CLIENT
  ========================================= */
  const handleCreateClient = async (data) => {
    if (loading) return;

    try {
      setLoading(true);

      const fd = new FormData();

      /* ---- SERVICES ---- */
      if (data.servicesText) {
        const services = data.servicesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        fd.append("services", JSON.stringify(services));
      }

      /* ---- LOOP FIELDS ---- */
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === "servicesText") return;
        if (key === "documents") return; // handled separately

        if (Array.isArray(value)) {
          fd.append(key, JSON.stringify(value));
          return;
        }

        if (key === "profilePhoto" && value?.[0]) {
          fd.append("profilePhoto", value[0]);
          return;
        }

        fd.append(key, value);
      });

      const created = await createClient(fd);
      const clientId = created.data._id;

      /* ---- DOCUMENT UPLOAD ---- */
      if (data.documents?.length) {
        const docFormData = new FormData();

        data.documents.forEach((doc) => {
          if (!doc.removed && doc.file?.[0]) {
            docFormData.append("documents", doc.file[0]);
          }
        });

        if ([...docFormData.entries()].length > 0) {
          await uploadClientDocuments(clientId, docFormData);
        }
      }

      toast.success("Client created successfully");

      return created.data;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create client");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     UPDATE CLIENT
  ========================================= */
  const handleUpdateClient = async (clientId, data) => {
    if (loading) return;

    try {
      setLoading(true);

      const fd = new FormData();

      if (data.servicesText) {
        const services = data.servicesText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        fd.append("services", JSON.stringify(services));
      }

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === "servicesText") return;
        if (key === "documents") return;

        if (Array.isArray(value)) {
          fd.append(key, JSON.stringify(value));
          return;
        }

        if (key === "profilePhoto" && value?.[0]) {
          fd.append("profilePhoto", value[0]);
          return;
        }

        fd.append(key, value);
      });

      const updated = await updateClient(clientId, fd);

      /* ---- NEW DOCUMENTS ---- */
      if (data.documents?.length) {
        const docFormData = new FormData();

        data.documents.forEach((doc) => {
          if (!doc.removed && doc.file?.[0]) {
            docFormData.append("documents", doc.file[0]);
          }
        });

        if ([...docFormData.entries()].length > 0) {
          await uploadClientDocuments(clientId, docFormData);
        }
      }

      toast.success("Client updated successfully");

      return updated.data;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update client");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     DELETE DOCUMENT
  ========================================= */
  const handleDeleteDocument = async (clientId, documentId) => {
    try {
      setLoading(true);

      await deleteClientDocument(clientId, documentId);

      toast.success("Document deleted");

      return documentId; // 👈 return deleted id
    } catch (err) {
      toast.error("Failed to delete document");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleCreateClient,
    handleUpdateClient,
    handleDeleteDocument,
  };
};
