import { useEffect, useReducer, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  punchInAPI,
  punchOutAPI,
  breakInAPI,
  breakOutAPI,
  getTodayWorkRecordAPI,
  getWeeklyProgressAPI,
} from "../api/attendance.api";
import { getMyReportsByDateAPI } from "../api/report.api";
import { getHolidaysAPI } from "../api/holiday.api";
import { getAllLeavesAPI } from "../api/leave.api";

/* ================= CONSTANTS ================= */
const WORK_TARGET_SECONDS = 8 * 60 * 60;
const BREAK_LIMIT_SECONDS = 60 * 60;

const initialState = {
  loading: true,
  actionLoading: false,

  // daily
  workSeconds: 0,
  breakSeconds: 0,
  isRunning: false,
  onBreak: false,
  punchedOut: false,
  reportSubmitted: false,

  // weekly
  weeklySeconds: 0,
  weeklyStatus: "IN_PROGRESS",

  // special
  isHoliday: false,
  holidayName: "",
  isLeave: false,
  isWeekend: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.payload };
    case "INCREMENT_WEEKLY":
      return {
        ...state,
        weeklySeconds: state.weeklySeconds + 1,
      };

    default:
      return state;
  }
}

export const useAttendance = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef(null);
  const fetchingRef = useRef(false);

  const syncFromServer = useCallback(async () => {
    const [recordRes, reportRes, weeklyRes] = await Promise.all([
      getTodayWorkRecordAPI(),
      getMyReportsByDateAPI(),
      getWeeklyProgressAPI(),
    ]);

    const record = recordRes?.data?.data;
    const weekly = weeklyRes?.data?.data;

    const breakSecs =
      record?.breaks?.reduce((sum, b) => {
        if (!b.in) return sum;
        const end = b.out ? new Date(b.out) : new Date();
        return sum + Math.floor((end - new Date(b.in)) / 1000);
      }, 0) || 0;

    dispatch({
      type: "SET_STATE",
      payload: {
        // daily
        workSeconds: record?.liveNetSeconds || 0,
        breakSeconds: breakSecs,
        isRunning: record?.isRunning || false,
        onBreak: record?.onBreak || false,
        punchedOut: !!record?.punchOut,
        reportSubmitted: Boolean(reportRes?.data?.data),

        // weekly
        weeklySeconds: weekly?.totalSeconds || 0,
        weeklyStatus: weekly?.status || "IN_PROGRESS",
      },
    });
  }, []);

  useEffect(() => {
    if (
      state.weeklyStatus === "COMPLETED" ||
      !state.isRunning ||
      state.onBreak
    ) {
      return;
    }

    const interval = setInterval(() => {
      dispatch({ type: "INCREMENT_WEEKLY" });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, state.onBreak, state.weeklyStatus]);

  /* ================= INITIAL DASHBOARD LOAD ================= */
  const fetchDashboardStatus = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const [holidayRes, leaveRes] = await Promise.all([
        getHolidaysAPI(),
        getAllLeavesAPI(),
      ]);

      const getISTDate = (date) =>
        new Date(date).toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        });

      const holidays = holidayRes?.data?.data || [];
      const today = getISTDate(new Date());

      const todayHoliday = holidays.find((h) => getISTDate(h.date) === today);

      if (todayHoliday) {
        dispatch({
          type: "SET_STATE",
          payload: {
            isHoliday: true,
            holidayName: todayHoliday.name,
            loading: false,
          },
        });
        return;
      }

      await syncFromServer();

      dispatch({ type: "SET_LOADING", payload: false });
    } catch (e) {
      toast.error(`${e?.message || "Failed to load dashboard"}`);
      dispatch({ type: "SET_LOADING", payload: false });
    } finally {
      fetchingRef.current = false;
    }
  }, [syncFromServer]);

  /* ================= ACTION HANDLER ================= */
  const handleAction = async (api, successMsg) => {
    if (state.actionLoading) return;

    try {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      await api();
      await syncFromServer();
      toast.success(successMsg);
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      dispatch({ type: "SET_ACTION_LOADING", payload: false });
    }
  };

  useEffect(() => {
    fetchDashboardStatus();
    return () => abortRef.current?.abort();
  }, [fetchDashboardStatus]);

  return {
    ...state,
    WORK_TARGET_SECONDS,
    BREAK_LIMIT_SECONDS,

    punchIn: () => handleAction(punchInAPI, "👋 Have a great day!"),
    punchOut: async () => {
      if (!state.reportSubmitted) {
        toast.error("⚠ Submit daily report before punching out.");
        return;
      }

      return handleAction(punchOutAPI, "🌟 Great work today!");
    },

    breakIn: () => handleAction(breakInAPI, "☕ Break started"),
    breakOut: () => handleAction(breakOutAPI, "💪 Back to work"),
  };
};
