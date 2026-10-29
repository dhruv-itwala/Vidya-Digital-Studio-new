// PunchAPK/src/components/StatusBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AttendanceStatus } from "../types";

interface Props {
  status: AttendanceStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case "WORKING":
        return {
          container: styles.workingContainer,
          text: styles.workingText,
          label: "● WORKING",
        };
      case "COMPLETED":
        return {
          container: styles.completedContainer,
          text: styles.completedText,
          label: "✓ COMPLETED",
        };
      case "ON_BREAK":
        return {
          container: styles.breakContainer,
          text: styles.breakText,
          label: "⏸ ON BREAK",
        };
      case "HOLIDAY":
        return {
          container: styles.holidayContainer,
          text: styles.holidayText,
          label: "🌴 HOLIDAY",
        };
      case "NOT_STARTED":
      default:
        return {
          container: styles.notStartedContainer,
          text: styles.notStartedText,
          label: "○ NOT STARTED",
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.badge, badge.container]}>
      <Text style={[styles.badgeText, badge.text]}>{badge.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  workingContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10b981",
    borderWidth: 1,
  },
  workingText: {
    color: "#10b981",
  },
  completedContainer: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "#3b82f6",
    borderWidth: 1,
  },
  completedText: {
    color: "#3b82f6",
  },
  breakContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "#f59e0b",
    borderWidth: 1,
  },
  breakText: {
    color: "#f59e0b",
  },
  holidayContainer: {
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderColor: "#a855f7",
    borderWidth: 1,
  },
  holidayText: {
    color: "#a855f7",
  },
  notStartedContainer: {
    backgroundColor: "rgba(156, 163, 175, 0.15)",
    borderColor: "#6b7280",
    borderWidth: 1,
  },
  notStartedText: {
    color: "#9ca3af",
  },
});

