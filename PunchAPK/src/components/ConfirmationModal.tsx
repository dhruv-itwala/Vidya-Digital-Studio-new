// PunchAPK/src/components/ConfirmationModal.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Employee } from "../types";
import { StatusBadge } from "./StatusBadge";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  employee: Employee | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<Props> = ({
  visible,
  employee,
  isLoading,
  onConfirm,
  onCancel,
}) => {
  if (!employee) return null;

  const isWorking = employee.status === "WORKING";
  const actionLabel = isWorking
    ? "CONFIRM PUNCH OUT"
    : employee.status === "COMPLETED"
    ? "CONFIRM PUNCH IN (AGAIN)"
    : "CONFIRM PUNCH IN";

  const actionColor = isWorking ? "#ea580c" : "#10b981";

  const formatSessionTime = (dateStr: string | null) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>ATTENDANCE VERIFICATION</Text>
            <TouchableOpacity onPress={onCancel} disabled={isLoading}>
              <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.employeeSummaryBox}>
            <Text style={styles.employeeName}>{employee.name}</Text>
            <Text style={styles.employeeRole}>
              {employee.designation || employee.role.toUpperCase()}
            </Text>
            <View style={styles.badgeWrapper}>
              <StatusBadge status={employee.status} />
            </View>
          </View>

          {isWorking && employee.punchIn && (
            <View style={styles.sessionBox}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#9ca3af" />
              <Text style={styles.sessionText}>
                Active session started at:{" "}
                <Text style={styles.sessionHighlight}>
                  {formatSessionTime(employee.punchIn)} (IST)
                </Text>
              </Text>
            </View>
          )}

          <View style={styles.biometricNotice}>
            <MaterialCommunityIcons name="fingerprint" size={22} color="#60a5fa" />
            <Text style={styles.biometricNoticeText}>
              Fingerprint required. Tap below, then touch the side power key sensor.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: actionColor },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={onConfirm}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={24}
                  color="#ffffff"
                />
                <Text style={styles.actionButtonText}>{actionLabel}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel & Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  employeeSummaryBox: {
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  employeeName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  employeeRole: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  badgeWrapper: {
    marginTop: 2,
  },
  sessionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#172334",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  sessionText: {
    color: "#9ca3af",
    fontSize: 13,
  },
  sessionHighlight: {
    color: "#f3f4f6",
    fontWeight: "700",
  },
  biometricNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  biometricNoticeText: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 14,
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
  },
});

