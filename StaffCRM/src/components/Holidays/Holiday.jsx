import { useEffect, useMemo, useState } from "react";
import { getUpcomingHolidaysAPI } from "../../api/holiday.api";
import styles from "./Holiday.module.css";
import { holidayFormatDate, holidayGetDayName } from "../../utils/date.util";

export default function Holiday() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await getUpcomingHolidaysAPI();
      setHolidays(res?.data || []);
    } catch (error) {
      console.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  /* ===== SORT BY DATE ===== */
  const sortedHolidays = useMemo(() => {
    return [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  return (
    <div
      className="masterContainer"
      style={{ flexDirection: "column", gap: 20 }}
    >
      <h2>Company Holidays</h2>

      <div className={styles.card}>
        {loading && <p className={styles.info}>Loading holidays...</p>}

        {!loading && sortedHolidays.length === 0 && (
          <p className={styles.info}>No holidays announced yet</p>
        )}

        {!loading && sortedHolidays.length > 0 && (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Holiday</th>
                </tr>
              </thead>

              <tbody>
                {sortedHolidays.map((h) => (
                  <tr key={h._id}>
                    <td>{holidayGetDayName(h.date)}</td>
                    <td>{holidayFormatDate(h.date)}</td>
                    <td>{h.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
