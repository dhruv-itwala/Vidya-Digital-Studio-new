import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getHolidaysAPI,
  createHolidayAPI,
  deleteHolidayAPI,
} from "../../api/holiday.api";
import styles from "./HRHoliday.module.css";
import { holidayFormatDate, holidayGetDayName } from "../../utils/date.util";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import Loader from "../../components/Loader/Loader";
import InlineLoader from "../../components/UI/InlineLoader";

export default function HRHoliday() {
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [initialLoading, setInitialLoading] = useState(true);
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /* ================= FETCH ================= */
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await getHolidaysAPI();
      setHolidays(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to fetch holidays");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  /* ================= ADD ================= */
  const addHoliday = async () => {
    if (addingHoliday) return;
    if (!newHoliday.date || !newHoliday.name.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    if (holidays.some((h) => h.date === newHoliday.date)) {
      toast.error("Holiday already exists for this date");
      return;
    }

    try {
      setAddingHoliday(true);
      await createHolidayAPI(newHoliday);
      toast.success("Holiday added successfully");
      setNewHoliday({ date: "", name: "" });
      await fetchHolidays();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to add holiday");
    } finally {
      setAddingHoliday(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteHoliday = async (id) => {
    if (deletingId) return;
    if (!window.confirm("Delete this holiday?")) return;

    try {
      setDeletingId(id);
      await deleteHolidayAPI(id);
      setHolidays((prev) => prev.filter((h) => h._id !== id));
      toast.success("Holiday deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete holiday");
      await fetchHolidays(); // reload ground truth
    } finally {
      setDeletingId(null);
    }
  };

  /* ================= SORT ================= */
  const sortedHolidays = useMemo(() => {
    return [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  return (
    <div className={styles.pageContainer}>
      
      {/* ================= HEADER ================= */}
      <div className={styles.headerArea}>
        <h2 className={styles.pageTitle}>
          <FaCalendarAlt color="var(--deep-forest)" /> Holiday Management
        </h2>
        <p className={styles.subHeading}>Configure company-wide holidays and off-days.</p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Add New Holiday</h3>
        
        {/* ADD HOLIDAY FORM */}
        <div className={styles.formRow}>
          <input
            type="date"
            className={styles.inputField}
            value={newHoliday.date}
            onChange={(e) =>
              setNewHoliday({ ...newHoliday, date: e.target.value })
            }
          />
          <input
            type="text"
            className={styles.inputField}
            placeholder="e.g. Diwali, Christmas"
            value={newHoliday.name}
            onChange={(e) =>
              setNewHoliday({ ...newHoliday, name: e.target.value })
            }
          />
          <button
            onClick={addHoliday}
            disabled={addingHoliday || !newHoliday.date || !newHoliday.name.trim()}
            className={styles.addBtn}
          >
            {addingHoliday ? <InlineLoader size={14} /> : <FaPlus />}
            <span>{addingHoliday ? "Adding..." : "Add Holiday"}</span>
          </button>
        </div>

        {/* HOLIDAY TABLE */}
        {initialLoading ? (
          <Loader />
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Holiday Name</th>
                  <th style={{width: '80px', textAlign: 'center'}}>Action</th>
                </tr>
              </thead>

              <tbody>
                {sortedHolidays.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <div className={styles.emptyState}>No holidays scheduled for this year.</div>
                    </td>
                  </tr>
                ) : (
                  sortedHolidays.map((h) => (
                    <tr key={h._id}>
                      <td>
                        <span className={styles.holidayDay}>{holidayGetDayName(h.date)}</span>
                      </td>
                      <td>
                        <span className={styles.holidayDate}>{holidayFormatDate(h.date)}</span>
                      </td>
                      <td>
                        <span className={styles.holidayName}>{h.name}</span>
                      </td>
                      <td style={{display: 'flex', justifyContent: 'center'}}>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deleteHoliday(h._id)}
                          disabled={deletingId === h._id}
                          title="Delete Holiday"
                        >
                          {deletingId === h._id ? <InlineLoader size={14} /> : <MdDeleteForever />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
