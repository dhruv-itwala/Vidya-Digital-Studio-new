import { useEffect, useState } from "react";
import { getDashboardOverviewAPI } from "../api/admin.api";

const useDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await getDashboardOverviewAPI();

      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return { data, loading, error, refetch: fetchDashboard };
};

export default useDashboard;
