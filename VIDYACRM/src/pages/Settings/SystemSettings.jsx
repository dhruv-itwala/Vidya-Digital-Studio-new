import React, { useState, useEffect } from "react";
import styles from "./Settings.module.css";
import { getSystemSettingsAPI, updateSystemSettingsAPI } from "../../api/systemSettings.api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import Loader from "../../components/Loader/Loader";

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSystemSettingsAPI();
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (category, key) => {
    if (!settings || togglingKey) return;

    const currentCat = settings.notifications?.[category] || {};
    const newValue = !currentCat[key];
    const keyId = `${category}-${key}`;
    const previousSettings = settings;

    // Immutable optimistic update
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [category]: {
          ...currentCat,
          [key]: newValue,
        },
      },
    };
    setSettings(newSettings);
    setTogglingKey(keyId);

    try {
      await updateSystemSettingsAPI({
        notifications: {
          [category]: {
            [key]: newValue,
          },
        },
      });
      toast.success("System setting updated");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update system setting");
      // Revert to snapshot
      setSettings(previousSettings);
    } finally {
      setTogglingKey(null);
    }
  };

  if (loading && !settings) return <Loader />;

  const renderToggle = (category, key, title, desc) => {
    const isOn = settings.notifications[category]?.[key] ?? true;
    
    return (
      <div className={styles.settingItem} key={`${category}-${key}`}>
        <div className={styles.settingInfo}>
          <h3 style={{ color: "#000000 !important", fontWeight: "600" }}>{title}</h3>
          <p>{desc}</p>
        </div>
        <button 
          className={`${styles.toggle} ${isOn ? styles.toggleOn : styles.toggleOff}`}
          onClick={() => handleToggle(category, key)}
          disabled={togglingKey !== null}
        >
          <motion.div 
            className={styles.toggleKnob}
            animate={{ x: isOn ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    );
  };

  return (
    <div className={styles.settingsGrid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>⚙️</div>
          <div>
            <h2>Reminders & Attendance</h2>
            <p>Global notifications for attendance events.</p>
          </div>
        </div>
        <div className={styles.settingList}>
          {renderToggle("reminders", "punchIn", "Punch In", "Send notifications when employees punch in.")}
          {renderToggle("reminders", "punchOut", "Punch Out", "Send notifications when employees punch out.")}
          {renderToggle("reminders", "breakIn", "Break Started", "Send notifications when employees start a break.")}
          {renderToggle("reminders", "breakOut", "Break Ended", "Send notifications when employees return from break.")}
          {renderToggle("reminders", "breakAboutToOver", "Break Ending Warning", "Send warnings when a break is almost over.")}
          {renderToggle("reminders", "report", "Daily Reports", "Send notifications when an employee submits their daily report.")}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>ℹ️</div>
          <div>
            <h2>Information</h2>
            <p>Global notifications for company info.</p>
          </div>
        </div>
        <div className={styles.settingList}>
          {renderToggle("info", "noticeboard", "Notice Board", "Send a push notification when a new announcement is posted.")}
          {renderToggle("info", "birthdays", "Birthdays", "Send birthday reminders to the team.")}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>👥</div>
          <div>
            <h2>Human Resources</h2>
            <p>Global notifications for HR actions.</p>
          </div>
        </div>
        <div className={styles.settingList}>
          {renderToggle("hr", "leaveApplied", "Leave Applied", "Send notifications to HR/Admin when someone applies for leave.")}
          {renderToggle("hr", "leaveStatusChanged", "Leave Status Changed", "Send notifications to employees when their leave is approved or declined.")}
          {renderToggle("hr", "ticketCreated", "New Ticket Raised", "Send notifications to HR/Admin when a ticket or complaint is raised.")}
          {renderToggle("hr", "ticketStatusChanged", "Ticket Status Changed", "Send notifications to employees when their ticket status changes or is resolved.")}
        </div>
      </div>
    </div>
  );
}
