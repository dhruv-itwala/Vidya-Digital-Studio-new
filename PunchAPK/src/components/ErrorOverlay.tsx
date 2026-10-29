// PunchAPK/src/components/ErrorOverlay.tsx
import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  errorMessage: string;
  isTimeout?: boolean;
  verifying?: boolean;
  onVerifyStatus?: () => void;
  onDismiss: () => void;
}

export const ErrorOverlay: React.FC<Props> = ({
  visible,
  errorMessage,
  isTimeout = false,
  verifying = false,
  onVerifyStatus,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name={isTimeout ? "wifi-alert" : "alert-circle"}
              size={48}
              color="#ffffff"
            />
          </View>

          <Text style={styles.title}>
            {isTimeout ? "NETWORK TIMEOUT" : "ATTENDANCE REJECTED"}
          </Text>

          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {errorMessage || "An unexpected error occurred while processing attendance."}
            </Text>
          </View>

          {isTimeout && onVerifyStatus && (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={onVerifyStatus}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" />
                  <Text style={styles.verifyButtonText}>Check Status with Server</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss & Close</Text>
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
    borderColor: "#ef4444",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    color: "#ef4444",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  verifyButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  verifyButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  dismissButton: {
    width: "100%",
    backgroundColor: "#374151",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissButtonText: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
  },
});
