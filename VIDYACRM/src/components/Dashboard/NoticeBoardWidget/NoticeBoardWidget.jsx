import React, { useEffect, useState } from "react";
import styles from "./NoticeBoardWidget.module.css";
import { getAnnouncementsAPI } from "../../../api/announcement.api";
import { FiInfo, FiAlertCircle, FiCheckCircle, FiGift } from "react-icons/fi";

const iconMap = {
  info: <FiInfo size={20} color="#3b82f6" />,
  warning: <FiAlertCircle size={20} color="#f59e0b" />,
  success: <FiCheckCircle size={20} color="#10b981" />,
  party: <FiGift size={20} color="#8b5cf6" />,
};

const bgMap = {
  info: "rgba(59, 130, 246, 0.1)",
  warning: "rgba(245, 158, 11, 0.1)",
  success: "rgba(16, 185, 129, 0.1)",
  party: "rgba(139, 92, 246, 0.1)",
};

const NoticeBoardWidget = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await getAnnouncementsAPI();
        setAnnouncements(res.data.announcements || []);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (loading || announcements.length === 0) return null;

  return (
    <div className={styles.noticeContainer}>
      {announcements.map((ann) => (
        <div 
          key={ann._id} 
          className={styles.noticeCard} 
          style={{ backgroundColor: bgMap[ann.type] || bgMap.info }}
        >
          <div className={styles.iconWrapper}>
            {iconMap[ann.type] || iconMap.info}
          </div>
          <div className={styles.noticeContent}>
            <h4 className={styles.noticeTitle}>{ann.title}</h4>
            <p className={styles.noticeMessage}>{ann.message}</p>
            <div className={styles.noticeMeta}>
              Posted by {ann.author?.name} on {new Date(ann.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoticeBoardWidget;
