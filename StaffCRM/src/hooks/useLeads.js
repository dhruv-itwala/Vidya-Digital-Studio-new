import { useEffect, useState, useCallback } from "react";
import {
  getLeadsAPI,
  updateLeadStatusAPI,
  deleteLeadAPI,
  convertLeadAPI,
} from "../api/leads.api";

export const useLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowLoading, setRowLoading] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const limit = 10;

  /* ================= FETCH ================= */
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getLeadsAPI({
        page,
        limit,
        search,
        status,
      });

      setLeads(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      setError(err?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  /* ================= STATUS UPDATE ================= */
  const updateStatus = async (id, status) => {
    let previous;

    setRowLoading(id);

    setLeads((prev) => {
      previous = prev;
      return prev.map((l) => (l._id === id ? { ...l, status } : l));
    });

    try {
      await updateLeadStatusAPI(id, status);
      return { success: true };
    } catch {
      setLeads(previous);
      return { success: false, message: "Failed to update status" };
    } finally {
      setRowLoading(null);
    }
  };

  /* ================= DELETE ================= */
  const deleteLead = async (id) => {
    let previous;

    setRowLoading(id);

    setLeads((prev) => {
      previous = prev;
      return prev.filter((l) => l._id !== id);
    });

    try {
      await deleteLeadAPI(id);
      return { success: true };
    } catch {
      setLeads(previous);
      return { success: false, message: "Failed to delete lead" };
    } finally {
      setRowLoading(null);
    }
  };

  /* ================= CONVERT ================= */
  const convertLead = async (id) => {
    let previous;

    setRowLoading(id);

    setLeads((prev) => {
      previous = prev;
      return prev.map((l) =>
        l._id === id ? { ...l, status: "Transferred", isConverted: true } : l,
      );
    });

    try {
      await convertLeadAPI(id);
      return { success: true };
    } catch {
      setLeads(previous);
      return { success: false, message: "Failed to convert lead" };
    } finally {
      setRowLoading(null);
    }
  };

  return {
    leads,
    loading,
    error,
    rowLoading,
    page,
    totalPages,
    search,
    status,
    setStatus,
    setSearch,
    setPage,
    refetch: fetchLeads,
    updateStatus,
    deleteLead,
    convertLead,
  };
};
