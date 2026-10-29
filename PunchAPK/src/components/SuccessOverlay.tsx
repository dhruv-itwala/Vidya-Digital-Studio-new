// PunchAPK/src/components/SuccessOverlay.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  actionType: "PUNCH_IN" | "PUNCH_OUT";
  employeeName: string;
  serverTime: string;
  isLateHalfDay?: boolean;
  onDismiss: () => void;
}

export const SuccessOverlay: React.FC<Props> = ({
  visible,
  actionType,
  employeeName,
  serverTime,
  isLateHalfDay,
  onDismiss,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, onDismiss]);

  if (!visible) return null;

  const formattedTime = serverTime
    ? new Date(serverTime).toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "--";

  const isPunchIn = actionType === "PUNCH_IN";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="check-bold" size={48} color="#ffffff" />
          </View>

          <Text style={styles.title}>
            {isPunchIn ? "PUNCH IN CONFIRMED" : "PUNCH OUT CONFIRMED"}
          </Text>

          <Text style={styles.employeeName}>{employeeName}</Text>

          <View style={styles.timestampBox}>
            <Text style={styles.timestampLabel}>SERVER CONFIRMED TIME</Text>
            <Text style={styles.timestampValue}>{formattedTime} (IST)</Text>
          </View>

          {isLateHalfDay && (
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#f59e0b" />
              <Text style={styles.warningText}>
                Late login (after 10:30 AM IST). Logged as Half-Day.
              </Text>
            </View>
          )}

          <Text style={styles.messageText}>
            {isPunchIn
              ? "Have a productive day at Vidya Digital Studio!"
              : "Great work today! Enjoy your evening."}
          </Text>

          <TouchableOpacity style={styles.doneButton} onPress={onDismiss}>
            <Text style={styles.doneButtonText}>Done ({countdown}s)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10b981",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    color: "#10b981",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
  },
  employeeName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },
  timestampBox: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  timestampLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  timestampValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "#f59e0b",
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    width: "100%",
  },
  warningText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  messageText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  doneButton: {
    width: "100%",
    backgroundColor: "#10b981",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});

