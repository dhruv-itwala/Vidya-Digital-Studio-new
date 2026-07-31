import { useEffect, useState, useCallback } from "react";
import {
  getLeadsAPI,
  updateLeadStatusAPI,
  deleteLeadAPI,
  convertLeadAPI,
  updateLeadProposalAPI,
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
  const [proposal, setProposal] = useState("");

  const limit = 25; // Leads per page

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
        proposal,
      });

      setLeads(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      setError(err?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, proposal]);

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

  /* ================= PROPOSAL UPDATE ================= */
  const updateProposal = async (id, proposal) => {
    let previous;

    setRowLoading(id);
    setLeads((prev) => {
      previous = prev;
      return prev.map((l) => (l._id === id ? { ...l, proposal } : l));
    });

    try {
      await updateLeadProposalAPI(id, proposal);
      return { success: true };
    } catch {
      setLeads(previous);
      return { success: false, message: "Failed to update proposal" };
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
    proposal,
    setStatus,
    setProposal,
    setSearch,
    setPage,
    refetch: fetchLeads,
    updateStatus,
    updateProposal,
    deleteLead,
    convertLead,
  };
};
