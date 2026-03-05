import { useEffect, useState, useCallback } from "react";
import {
  getClientsAPI,
  createClientAPI,
  updateClientAPI,
  deactivateClientAPI,
  addCredentialAPI,
  uploadDocumentAPI,
  deleteDocumentAPI,
  updateCredentialAPI,
  deleteCredentialAPI,
  addTransactionAPI,
  deleteTransactionAPI,
  updateTransactionAPI,
} from "../api/clients.api";

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowLoading, setRowLoading] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const limit = 10;

  /* ================= FETCH ================= */
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getClientsAPI({
        page,
        limit,
        search,
      });

      setClients(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      setError(err?.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /* ================= CREATE ================= */
  const createClient = async (data) => {
    try {
      await createClientAPI(data);
      await fetchClients(); // refresh properly
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= UPDATE ================= */
  const updateClient = async (id, data) => {
    try {
      const res = await updateClientAPI(id, data);

      setClients((prev) => prev.map((c) => (c._id === id ? res.data.data : c)));

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= DEACTIVATE ================= */
  const deactivateClient = async (id) => {
    let previous;

    setRowLoading(id);

    setClients((prev) => {
      previous = prev;
      return prev.filter((c) => c._id !== id);
    });

    try {
      await deactivateClientAPI(id);
      return { success: true };
    } catch (err) {
      setClients(previous);
      return { success: false, message: err.message };
    } finally {
      setRowLoading(null);
    }
  };

  /* ================= ADD CREDENTIAL ================= */
  const addCredential = async (id, data) => {
    try {
      const res = await addCredentialAPI(id, data);

      setClients((prev) => prev.map((c) => (c._id === id ? res.data.data : c)));

      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };
  /* ================= UPDATE CREDENTIAL ================= */
  const updateCredential = async (clientId, credId, data) => {
    try {
      const res = await updateCredentialAPI(clientId, credId, data);
      setClients((prev) =>
        prev.map((c) => (c._id === clientId ? res.data.data : c)),
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= DELETE CREDENTIAL ================= */
  const deleteCredential = async (clientId, credId) => {
    try {
      const res = await deleteCredentialAPI(clientId, credId);
      setClients((prev) =>
        prev.map((c) => (c._id === clientId ? res.data.data : c)),
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= ADD TRANSACTION ================= */
  const addTransaction = async (id, data) => {
    try {
      const res = await addTransactionAPI(id, data);

      setClients((prev) => prev.map((c) => (c._id === id ? res.data.data : c)));

      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= UPDATE TRANSACTION ================= */
  const updateTransaction = async (clientId, txnId, data) => {
    try {
      const res = await updateTransactionAPI(clientId, txnId, data);
      setClients((prev) =>
        prev.map((c) => (c._id === clientId ? res.data.data : c)),
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= DELETE TRANSACTION ================= */
  const deleteTransaction = async (clientId, txnId) => {
    try {
      const res = await deleteTransactionAPI(clientId, txnId);

      setClients((prev) =>
        prev.map((c) => (c._id === clientId ? res.data.data : c)),
      );

      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= UPLOAD DOCUMENT ================= */
  const uploadDocument = async (id, file) => {
    try {
      const res = await uploadDocumentAPI(id, file);

      setClients((prev) => prev.map((c) => (c._id === id ? res.data.data : c)));

      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  /* ================= DELETE DOCUMENT ================= */
  const deleteDocument = async (id, publicId) => {
    try {
      const res = await deleteDocumentAPI(id, publicId);

      setClients((prev) => prev.map((c) => (c._id === id ? res.data.data : c)));

      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return {
    clients,
    loading,
    error,
    rowLoading,
    page,
    totalPages,
    search,
    setSearch,
    setPage,
    refetch: fetchClients,
    createClient,
    updateClient,
    deactivateClient,
    addCredential,
    updateCredential,
    deleteCredential,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    uploadDocument,
    deleteDocument,
  };
};
