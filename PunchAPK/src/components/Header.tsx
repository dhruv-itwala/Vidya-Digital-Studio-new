// PunchAPK/src/components/Header.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  onOpenSettings: () => void;
  isOnline: boolean;
  deviceId: string;
}

export const Header: React.FC<Props> = ({ onOpenSettings, isOnline, deviceId }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Formatted in IST
      const timeStr = now.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const dateStr = now.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.brandBadge}>
          <MaterialCommunityIcons name="fingerprint" size={28} color="#10b981" />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>VIDYA DIGITAL STUDIO</Text>
            <Text style={styles.brandSubtitle}>ATTENDANCE KIOSK • {deviceId}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.clockCol}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Text style={styles.dateText}>{currentDate} (IST)</Text>
        </View>

        <View style={styles.connectionCol}>
          <View
            style={[
              styles.connectionPill,
              isOnline ? styles.onlinePill : styles.offlinePill,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isOnline ? styles.onlineDot : styles.offlineDot,
              ]}
            />
            <Text
              style={[
                styles.connectionText,
                isOnline ? styles.onlineText : styles.offlineText,
              ]}
            >
              {isOnline ? "KIOSK READY" : "OFFLINE"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandTextCol: {
    flexDirection: "column",
  },
  brandTitle: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1f2937",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  clockCol: {
    flexDirection: "column",
  },
  timeText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dateText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  connectionCol: {
    alignItems: "flex-end",
  },
  connectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlinePill: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10b981",
  },
  onlineDot: {
    backgroundColor: "#10b981",
  },
  onlineText: {
    color: "#10b981",
  },
  offlinePill: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#ef4444",
  },
  offlineDot: {
    backgroundColor: "#ef4444",
  },
  offlineText: {
    color: "#ef4444",
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

