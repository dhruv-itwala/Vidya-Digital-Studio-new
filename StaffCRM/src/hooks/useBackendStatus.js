import { useEffect, useState } from "react";
import axios from "axios";

export default function useBackendStatus() {
  const [isDown, setIsDown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/ping`, {
          timeout: 5000,
        });
        setIsDown(false);
      } catch {
        setIsDown(true);
      } finally {
        setLoading(false);
      }
    };

    checkBackend();
  }, []);

  return { isDown, loading };
}
