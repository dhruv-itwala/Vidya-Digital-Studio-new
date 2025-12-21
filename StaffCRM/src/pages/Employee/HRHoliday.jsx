import { useEffect, useMemo, useState } from "react";
import {
  getHolidaysAPI,
  createHolidayAPI,
  deleteHolidayAPI,
} from "../../api/holiday.api";
import styles from "./HRHoliday.module.css";

export default function HRHoliday() {
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: "", name: "" });
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  const fetchHolidays = async () => {
    setLoading(true);
    const res = await getHolidaysAPI();
    setHolidays(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  /* ================= ADD ================= */
  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) return;

    // prevent duplicate dates
    if (holidays.some((h) => h.date === newHoliday.date)) {
      alert("Holiday already exists for this date");
      return;
    }

    setLoading(true);
    await createHolidayAPI(newHoliday);
    setNewHoliday({ date: "", name: "" });
    await fetchHolidays();
    setLoading(false);
  };

  /* ================= DELETE ================= */
  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;

    setHolidays((prev) => prev.filter((h) => h._id !== id));
    await deleteHolidayAPI(id);
  };

  /* ================= SORT ================= */
  const sortedHolidays = useMemo(() => {
    return [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  return (
    <div
      className="masterContainer"
      style={{ flexDirection: "column", gap: "20px" }}
    >
      <h2>Holiday Management</h2>

      <div className={styles.card}>
        {/* ADD HOLIDAY */}
        <div style={{ display: "flex", gap: "12px" }}>
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
          <button onClick={addHoliday} disabled={loading}>
            Add
          </button>
        </div>

        {/* HOLIDAY TABLE */}
        <table>
          <thead>
            <tr>
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
                <td>{new Date(h.date).toISOString().split("T")[0]}</td>
                <td>{h.name}</td>
                <td>
                  <button onClick={() => deleteHoliday(h._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
