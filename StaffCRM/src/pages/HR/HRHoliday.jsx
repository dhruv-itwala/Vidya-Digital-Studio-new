import { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getHolidaysAPI,
  createHolidayAPI,
  deleteHolidayAPI,
} from "../../api/holiday.api";
import styles from "./HRHoliday.module.css";
import { holidayFormatDate, holidayGetDayName } from "../../utils/date.util";

export default function HRHoliday() {
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getHolidaysAPI();
      setHolidays(res?.data?.data || []);
    } catch (error) {
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  /* ================= ADD ================= */
  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    if (holidays.some((h) => h.date === newHoliday.date)) {
      toast.error("Holiday already exists for this date");
      return;
    }

    try {
      setLoading(true);
      await createHolidayAPI(newHoliday);
      toast.success("Holiday added successfully");
      setNewHoliday({ date: "", name: "" });
      fetchHolidays();
    } catch (error) {
      toast.error("Failed to add holiday");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;

    try {
      setHolidays((prev) => prev.filter((h) => h._id !== id));
      await deleteHolidayAPI(id);
      toast.success("Holiday deleted");
    } catch (error) {
      toast.error("Failed to delete holiday");
      fetchHolidays(); // rollback
    }
  };

  /* ================= SORT ================= */
  const sortedHolidays = useMemo(() => {
    return [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  return (
    <div
      className="masterContainer"
      style={{ flexDirection: "column", gap: 20 }}
    >
      <h2>Holiday Management</h2>

      <div className={styles.card}>
        {/* ADD HOLIDAY */}
        <div className={styles.formRow}>
          <input
            type="date"
            value={newHoliday.date}
            onChange={(e) =>
              setNewHoliday({ ...newHoliday, date: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Holiday Name"
            value={newHoliday.name}
            onChange={(e) =>
              setNewHoliday({ ...newHoliday, name: e.target.value })
            }
          />
          <button
            onClick={addHoliday}
            disabled={loading}
            className={styles.addBtn}
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

        {/* HOLIDAY TABLE */}
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {sortedHolidays.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No holidays added
                  </td>
                </tr>
              )}

              {sortedHolidays.map((h) => (
                <tr key={h._id}>
                  <td>{holidayGetDayName(h.date)}</td>
                  <td>{holidayFormatDate(h.date)}</td>
                  <td>{h.name}</td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteHoliday(h._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
