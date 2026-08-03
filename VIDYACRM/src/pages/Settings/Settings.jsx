import React, { useState, useEffect } from "react";
import styles from "./Settings.module.css";
import { useAuth } from "../../context/AuthContext";
import { updateNotificationPreferencesAPI } from "../../api/auth.api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function Settings() {
  const { user, updateUserPreferences } = useAuth();
  
  const [preferences, setPreferences] = useState({
    leaves: true,
    reports: true,
    tasks: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPreferences({
        leaves: user.notificationPreferences.leaves ?? true,
        reports: user.notificationPreferences.reports ?? true,
        tasks: user.notificationPreferences.tasks ?? true,
      });
    }
  }, [user]);

  const handleToggle = async (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    
    try {
      setSaving(true);
      const res = await updateNotificationPreferencesAPI(newPrefs);
      if (res.data?.data) {
        updateUserPreferences(res.data.data);
      }
      toast.success("Preferences updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update preferences");
      // revert on fail
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account preferences and notifications.</p>
      </div>

      <div className={styles.settingsGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>🔔</div>
            <div>
              <h2>Notification Preferences</h2>
              <p>Choose what events you want to be notified about.</p>
            </div>
          </div>

          <div className={styles.settingList}>
            {/* Leaves */}
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h3>Leave Requests</h3>
                <p>Get notified when employees apply for or cancel leaves.</p>
              </div>
              <button 
                className={`${styles.toggle} ${preferences.leaves ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => handleToggle("leaves")}
                disabled={saving}
              >
                <motion.div 
                  className={styles.toggleKnob}
                  animate={{ x: preferences.leaves ? 20 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Reports */}
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h3>Daily Work Reports</h3>
                <p>Get notified when employees submit their end-of-day reports.</p>
              </div>
              <button 
                className={`${styles.toggle} ${preferences.reports ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => handleToggle("reports")}
                disabled={saving}
              >
                <motion.div 
                  className={styles.toggleKnob}
                  animate={{ x: preferences.reports ? 20 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Tasks */}
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <h3>Task Updates</h3>
                <p>Get notified when your assigned tasks are completed or updated.</p>
              </div>
              <button 
                className={`${styles.toggle} ${preferences.tasks ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => handleToggle("tasks")}
                disabled={saving}
              >
                <motion.div 
                  className={styles.toggleKnob}
                  animate={{ x: preferences.tasks ? 20 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
