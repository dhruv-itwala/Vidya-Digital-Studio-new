import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { getBackendErrorMessage } from "../utils/errorHandler";

/**
 * Hook to safeguard async button clicks from multiple rapid submissions
 * and track loading state.
 */
export function useAsyncHandler(asyncFn, options = {}) {
  const [loading, setLoading] = useState(false);
  const isExecutingRef = useRef(false);

  const execute = useCallback(
    async (...args) => {
      if (isExecutingRef.current) return;
      isExecutingRef.current = true;
      setLoading(true);

      try {
        const result = await asyncFn(...args);
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        return result;
      } catch (err) {
        const msg = getBackendErrorMessage(err, options.errorMessage || "Operation failed");
        if (options.showToast !== false) {
          toast.error(msg);
        }
        throw err;
      } finally {
        isExecutingRef.current = false;
        setLoading(false);
      }
    },
    [asyncFn, options]
  );

  return [execute, loading];
}

export default useAsyncHandler;
