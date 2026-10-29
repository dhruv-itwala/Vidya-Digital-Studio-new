// PunchAPK/src/hooks/useIdleReset.ts
import { useEffect, useRef, useCallback } from "react";

/**
 * Resets kiosk state to the idle employee directory if no user interaction
 * occurs within the timeout threshold.
 */
export const useIdleReset = (onReset: () => void, timeoutMs: number = 30000) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onReset();
    }, timeoutMs);
  }, [onReset, timeoutMs]);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { resetTimer, cancelTimer };
};

