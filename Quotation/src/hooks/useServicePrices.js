// src/hooks/useServicePrices.js
import { useEffect, useState, useRef } from "react";
import { fetchAllServicePrices } from "../utils/api.endpoints";

const cache = {
  data: null,
  ts: 0,
  ttl: 1000 * 60 * 5, // 5 minutes cache
};

export default function useServicePrices() {
  const [servicePrices, setServicePrices] = useState({});
  const [loading, setLoading] = useState(Boolean(!cache.data));
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        // use cache if recent
        if (cache.data && Date.now() - cache.ts < cache.ttl) {
          setServicePrices(cache.data);
          setLoading(false);
          return;
        }

        const res = await fetchAllServicePrices();

        if (!res?.data?.success || !res?.data?.count) {
          throw new Error("Invalid API response");
        }

        const raw = res.data.data[0] || {};
        const { _id, ...structuredData } = raw;

        cache.data = structuredData;
        cache.ts = Date.now();

        if (mounted.current) setServicePrices(structuredData);
      } catch (err) {
        console.error("useServicePrices:", err);
        if (mounted.current) setError("Failed to load services");
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    load();

    return () => {
      mounted.current = false;
    };
  }, []);

  return {
    servicePrices,
    loading,
    error,
    refresh: async () => {
      cache.data = null;
      cache.ts = 0;
      setLoading(true);
      try {
        await fetchAllServicePrices();
      } catch (e) {
        /* ignore */
      }
      // refetch by resetting effect - easiest for now is to reload page or create forced reload logic */
    },
  };
}
