// PunchAPK/src/screens/KioskHomeScreen.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../components/Header";
import { EmployeeCard } from "../components/EmployeeCard";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { SuccessOverlay } from "../components/SuccessOverlay";
import { ErrorOverlay } from "../components/ErrorOverlay";
import { Employee } from "../types";
import {
  fetchKioskEmployees,
  fetchKioskEmployeeStatus,
  kioskPunchIn,
  kioskPunchOut,
} from "../api/kiosk.api";
import { pingBackend } from "../api/client";
import { authenticateKiosk } from "../services/biometric.service";
import {
  getKioskConfig,
  hasAdminPin,
  verifyAdminPin,
  setInitialAdminPin,
} from "../services/storage.service";
import { useIdleReset } from "../hooks/useIdleReset";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";

interface Props {
  navigation: any;
}

export const KioskHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [deviceId, setDeviceId] = useState("M32-KIOSK-01");

  // Interaction State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const pendingIdempotencyKeyRef = useRef<string | null>(null);

  // Admin PIN Gate State
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [isUnprovisioned, setIsUnprovisioned] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Result Overlays
  const [successData, setSuccessData] = useState<{
    visible: boolean;
    actionType: "PUNCH_IN" | "PUNCH_OUT";
    employeeName: string;
    serverTime: string;
    isLateHalfDay?: boolean;
  }>({
    visible: false,
    actionType: "PUNCH_IN",
    employeeName: "",
    serverTime: "",
  });

  const [errorData, setErrorData] = useState<{
    visible: boolean;
    message: string;
    isTimeout: boolean;
  }>({
    visible: false,
    message: "",
    isTimeout: false,
  });
  const [reconcilingStatus, setReconcilingStatus] = useState(false);

  // Watchdog idle reset: Resets open modals and search if user walks away for 30 seconds
  // Guarded so it never discards state during an active biometric prompt or network request
  const resetToIdle = useCallback(() => {
    if (actionLoading) return;
    setSelectedEmployee(null);
    setSearch("");
  }, [actionLoading]);

  const { resetTimer, cancelTimer } = useIdleReset(resetToIdle, 30000);

  const loadData = useCallback(async () => {
    try {
      const [config, ping, list] = await Promise.all([
        getKioskConfig(),
        pingBackend(),
        fetchKioskEmployees(),
      ]);

      setDeviceId(config.deviceId);
      setIsOnline(ping.ok);
      setEmployees(list);
    } catch (err: any) {
      console.warn("Kiosk load data error:", err.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Periodic background sync every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSelectEmployee = (emp: Employee) => {
    resetTimer();
    setSelectedEmployee(emp);
  };

  const handleCancelModal = () => {
    cancelTimer();
    setSelectedEmployee(null);
    pendingIdempotencyKeyRef.current = null;
  };

  // Admin PIN Gate Handler
  const handleOpenAdminGate = async () => {
    setAdminPinInput("");
    setConfirmPinInput("");
    setAdminPinError("");
    const isConfigured = await hasAdminPin();
    setIsUnprovisioned(!isConfigured);
    setAdminModalVisible(true);
  };

  const handleAdminGateSubmit = async () => {
    setAdminPinError("");

    if (isUnprovisioned) {
      // First-time provisioning flow: set master PIN
      const pin = adminPinInput.trim();
      const confirm = confirmPinInput.trim();

      if (!pin || !confirm) {
        setAdminPinError("Both PIN fields are required.");
        return;
      }
      if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
        setAdminPinError("PIN must be between 4 and 8 numeric digits.");
        return;
      }
      if (pin !== confirm) {
        setAdminPinError("PINs do not match. Please re-enter.");
        return;
      }

      setVerifyingPin(true);
      try {
        await setInitialAdminPin(pin);
        setAdminModalVisible(false);
        setAdminPinInput("");
        setConfirmPinInput("");
        setIsUnprovisioned(false);
        navigation.navigate("Setup");
      } catch (err: any) {
        setAdminPinError(err.message || "Failed to initialize Admin PIN.");
      } finally {
        setVerifyingPin(false);
      }
    } else {
      // Authentication flow with configured PIN
      const pin = adminPinInput.trim();
      if (!pin) {
        setAdminPinError("Please enter Admin PIN.");
        return;
      }

      setVerifyingPin(true);
      try {
        const isValid = await verifyAdminPin(pin);
        if (isValid) {
          setAdminModalVisible(false);
          setAdminPinInput("");
          navigation.navigate("Setup");
        } else {
          setAdminPinError("Incorrect Admin PIN. Access denied.");
        }
      } catch (err: any) {
        setAdminPinError(err.message || "Failed to verify PIN.");
      } finally {
        setVerifyingPin(false);
      }
    }
  };

  // Reconcile status after timeout
  const handleReconcileStatus = async () => {
    if (!selectedEmployee) return;

    setReconcilingStatus(true);
    try {
      const liveStatus = await fetchKioskEmployeeStatus(selectedEmployee.id);
      setErrorData((prev) => ({ ...prev, visible: false }));

      const wasPunchIn = selectedEmployee.status !== "WORKING";
      const isNowWorking = liveStatus.status === "WORKING";
      const isNowCompleted = liveStatus.status === "COMPLETED";

      if ((wasPunchIn && isNowWorking) || (!wasPunchIn && isNowCompleted)) {
        // Attendance successfully registered despite timeout
        setSuccessData({
          visible: true,
          actionType: wasPunchIn ? "PUNCH_IN" : "PUNCH_OUT",
          employeeName: liveStatus.name,
          serverTime: wasPunchIn ? liveStatus.punchIn || "" : liveStatus.punchOut || "",
          isLateHalfDay: liveStatus.isLateHalfDay,
        });
        setSelectedEmployee(null);
        pendingIdempotencyKeyRef.current = null;
      } else {
        // Attendance did not register; allow safe retry
        setErrorData({
          visible: true,
          message: "Attendance was not recorded by server. Please try again.",
          isTimeout: false,
        });
      }
      loadData();
    } catch (err: any) {
      setErrorData({
        visible: true,
        message: err.message || "Unable to check status from server.",
        isTimeout: true,
      });
    } finally {
      setReconcilingStatus(false);
    }
  };

  const handleExecuteAttendance = async () => {
    if (!selectedEmployee) return;

    cancelTimer();
    setActionLoading(true);

    const isWorking = selectedEmployee.status === "WORKING";
    const actionText = isWorking ? "Punch Out" : "Punch In";

    // 1. Trigger Native Samsung Fingerprint Prompt
    const authResult = await authenticateKiosk(
      selectedEmployee.name,
      actionText,
    );

    if (!authResult.success) {
      setActionLoading(false);
      if (authResult.error && !authResult.error.includes("cancelled")) {
        setErrorData({
          visible: true,
          message: authResult.error,
          isTimeout: false,
        });
      }
      return;
    }

    // Reuse pending idempotency key if retrying after timeout, or generate new UUID
    if (!pendingIdempotencyKeyRef.current) {
      pendingIdempotencyKeyRef.current = Crypto.randomUUID();
    }
    const idempotencyKey = pendingIdempotencyKeyRef.current;

    // 2. Submit signed request to master backend
    try {
      if (isWorking) {
        const res = await kioskPunchOut(selectedEmployee.id, idempotencyKey);
        setSelectedEmployee(null);
        pendingIdempotencyKeyRef.current = null;
        setSuccessData({
          visible: true,
          actionType: "PUNCH_OUT",
          employeeName: res.name,
          serverTime: res.punchOut,
        });
      } else {
        const res = await kioskPunchIn(selectedEmployee.id, idempotencyKey);
        setSelectedEmployee(null);
        pendingIdempotencyKeyRef.current = null;
        setSuccessData({
          visible: true,
          actionType: "PUNCH_IN",
          employeeName: res.name,
          serverTime: res.punchIn,
          isLateHalfDay: res.isLateHalfDay,
        });
      }

      // Background refresh after attendance update
      loadData();
    } catch (err: any) {
      const msg = err.message || "Failed to process attendance with server.";
      const isTimeout =
        msg.toLowerCase().includes("timed out") ||
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("network");

      setErrorData({
        visible: true,
        message: msg,
        isTimeout,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered employees memo
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.trim().toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.designation && e.designation.toLowerCase().includes(q)),
    );
  }, [employees, search]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Header
        deviceId={deviceId}
        isOnline={isOnline}
        onOpenSettings={handleOpenAdminGate}
      />

      <View style={styles.searchBarContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color="#9ca3af"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by employee name..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={(text) => {
            resetTimer();
            setSearch(text);
          }}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading Employee Directory...</Text>
        </View>
      ) : filteredEmployees.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="account-search-outline"
            size={64}
            color="#4b5563"
          />
          <Text style={styles.emptyTitle}>No Employees Found</Text>
          <Text style={styles.emptySubtitle}>
            {search ? `No staff matching "${search}"` : "Employee directory is empty"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh Directory</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              onPress={() => handleSelectEmployee(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#10b981"
              colors={["#10b981"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Confirmation & Biometric Prompt Modal */}
      <ConfirmationModal
        visible={!!selectedEmployee}
        employee={selectedEmployee}
        isLoading={actionLoading}
        onConfirm={handleExecuteAttendance}
        onCancel={handleCancelModal}
      />

      {/* Success Confirmation Overlay */}
      <SuccessOverlay
        visible={successData.visible}
        actionType={successData.actionType}
        employeeName={successData.employeeName}
        serverTime={successData.serverTime}
        isLateHalfDay={successData.isLateHalfDay}
        onDismiss={() =>
          setSuccessData((prev) => ({ ...prev, visible: false }))
        }
      />

      {/* Error Rejection Overlay with Timeout Reconciliation */}
      <ErrorOverlay
        visible={errorData.visible}
        errorMessage={errorData.message}
        isTimeout={errorData.isTimeout}
        verifying={reconcilingStatus}
        onVerifyStatus={handleReconcileStatus}
        onDismiss={() => {
          setErrorData((prev) => ({ ...prev, visible: false }));
          pendingIdempotencyKeyRef.current = null;
        }}
      />

      {/* Admin PIN Gate Modal */}
      <Modal
        visible={adminModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.adminModalBackdrop}>
          <View style={styles.adminModalCard}>
            <View style={styles.adminIconCircle}>
              <MaterialCommunityIcons
                name={isUnprovisioned ? "shield-plus" : "shield-lock"}
                size={36}
                color="#ffffff"
              />
            </View>
            <Text style={styles.adminModalTitle}>
              {isUnprovisioned ? "INITIAL KIOSK SETUP" : "ADMIN ACCESS REQUIRED"}
            </Text>
            <Text style={styles.adminModalSubtitle}>
              {isUnprovisioned
                ? "This kiosk terminal is unprovisioned. Create a 4 to 8 digit Admin PIN to secure this terminal."
                : "Enter the Kiosk Administrator PIN to access terminal configuration."}
            </Text>

            <TextInput
              style={styles.adminPinInput}
              value={adminPinInput}
              onChangeText={(t) => {
                setAdminPinInput(t);
                setAdminPinError("");
              }}
              placeholder={
                isUnprovisioned ? "Create Admin PIN (4-8 digits)" : "Enter Admin PIN"
              }
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              autoFocus
            />

            {isUnprovisioned && (
              <TextInput
                style={[styles.adminPinInput, { marginTop: 10 }]}
                value={confirmPinInput}
                onChangeText={(t) => {
                  setConfirmPinInput(t);
                  setAdminPinError("");
                }}
                placeholder="Confirm Admin PIN"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                secureTextEntry
                maxLength={8}
              />
            )}

            {adminPinError ? (
              <Text style={styles.adminPinErrorText}>{adminPinError}</Text>
            ) : null}

            <View style={styles.adminModalBtnRow}>
              <TouchableOpacity
                style={styles.adminCancelBtn}
                onPress={() => setAdminModalVisible(false)}
              >
                <Text style={styles.adminCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminSubmitBtn}
                onPress={handleAdminGateSubmit}
                disabled={verifyingPin}
              >
                {verifyingPin ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.adminSubmitBtnText}>
                    {isUnprovisioned ? "Set PIN & Open" : "Unlock"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    marginHorizontal: 16,
    marginVertical: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 15,
    marginTop: 12,
  },
  emptyTitle: {
    color: "#f3f4f6",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#1f2937",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  retryButtonText: {
    color: "#10b981",
    fontSize: 14,
  },
  adminModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  adminModalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  adminIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  adminModalTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  adminModalSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  adminPinInput: {
    width: "100%",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    fontSize: 18,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#4b5563",
    letterSpacing: 4,
    marginBottom: 8,
  },
  adminPinErrorText: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  adminModalBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    width: "100%",
  },
  adminCancelBtn: {
    flex: 1,
    backgroundColor: "#374151",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adminCancelBtnText: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "600",
  },
  adminSubmitBtn: {
    flex: 1,
    backgroundColor: "#3b82f6",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adminSubmitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
