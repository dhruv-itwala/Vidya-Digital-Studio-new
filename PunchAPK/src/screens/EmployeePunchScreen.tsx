// PunchAPK/src/screens/EmployeePunchScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UserProfile, TodayWorkRecord, WifiStatus } from "../types";
import { checkStudioWifi } from "../services/wifi.service";
import {
  getTodayAttendance,
  submitPunchIn,
  submitPunchOut,
  getOfficeNetworkConfig,
  setCurrentIpAsOffice,
  updateOfficeNetworkConfig,
} from "../api/attendance.api";
import {
  getAllEmployeesForAdmin,
  toggleEmployeeWifiRestriction,
} from "../api/auth.api";
import { authenticateKiosk } from "../services/biometric.service";
import { clearAuthSession } from "../services/storage.service";
import { SuccessOverlay } from "../components/SuccessOverlay";
import { ErrorOverlay } from "../components/ErrorOverlay";

interface Props {
  user: UserProfile;
  token: string;
  onLogout: () => void;
}

export const EmployeePunchScreen: React.FC<Props> = ({
  user,
  token,
  onLogout,
}) => {
  const [record, setRecord] = useState<TodayWorkRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const [wifiStatus, setWifiStatus] = useState<WifiStatus>({
    isStudioWifi: false,
    localIp: null,
    isWifiConnected: false,
  });

  // Success Overlay
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

  // Error Overlay
  const [errorData, setErrorData] = useState<{
    visible: boolean;
    message: string;
    isTimeout: boolean;
  }>({
    visible: false,
    message: "",
    isTimeout: false,
  });

  // Admin / HR Wi-Fi Configuration State
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<"employees" | "network">("employees");
  const [employeesList, setEmployeesList] = useState<UserProfile[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [detectedIp, setDetectedIp] = useState("");
  const [configuredIps, setConfiguredIps] = useState("");
  const [localSubnet, setLocalSubnet] = useState("192.168.0.");
  const [lastUpdatedInfo, setLastUpdatedInfo] = useState("");

  const openAdminNetworkModal = async () => {
    setAdminModalVisible(true);
    setAdminLoading(true);
    try {
      const [networkData, emps] = await Promise.all([
        getOfficeNetworkConfig(token),
        getAllEmployeesForAdmin(token),
      ]);
      setDetectedIp(networkData.detectedClientIp || "");
      setConfiguredIps((networkData.config?.officePublicIps || []).join(", "));
      setLocalSubnet(networkData.config?.localSubnet || "192.168.0.");
      setEmployeesList(emps || []);
      if (networkData.config?.updatedAt) {
        setLastUpdatedInfo(
          `Last updated by ${networkData.config.updatedByName || "Admin"} on ${new Date(
            networkData.config.updatedAt,
          ).toLocaleString("en-IN")}`,
        );
      } else {
        setLastUpdatedInfo("Using default office configuration.");
      }
    } catch (err: any) {
      Alert.alert(
        "Admin Tools Error",
        err.response?.data?.message || err.message || "Failed to load admin settings.",
      );
    } finally {
      setAdminLoading(false);
    }
  };

  const handleToggleEmployeeWifi = async (empId: string, val: boolean) => {
    setEmployeesList((prev) =>
      prev.map((e) => (e._id === empId ? { ...e, requireOfficeWifi: val } : e)),
    );
    try {
      await toggleEmployeeWifiRestriction(token, empId, val);
    } catch (err: any) {
      setEmployeesList((prev) =>
        prev.map((e) => (e._id === empId ? { ...e, requireOfficeWifi: !val } : e)),
      );
      Alert.alert(
        "Update Failed",
        err.response?.data?.message || err.message || "Failed to update employee rule.",
      );
    }
  };

  const handleSetCurrentIp = async () => {
    setAdminLoading(true);
    try {
      const res = await setCurrentIpAsOffice(token, localSubnet);
      Alert.alert("Studio Wi-Fi Updated", res.message || "Office Wi-Fi IP updated.");
      await loadAttendance();
      const data = await getOfficeNetworkConfig(token);
      setDetectedIp(data.detectedClientIp || "");
      setConfiguredIps((data.config?.officePublicIps || []).join(", "));
      if (data.config?.updatedAt) {
        setLastUpdatedInfo(
          `Last updated by ${data.config.updatedByName || "Admin"} on ${new Date(
            data.config.updatedAt,
          ).toLocaleString("en-IN")}`,
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Update Failed",
        err.response?.data?.message || err.message || "Failed to update office IP.",
      );
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveCustomNetwork = async () => {
    setAdminLoading(true);
    try {
      const ips = configuredIps
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await updateOfficeNetworkConfig(token, {
        officePublicIps: ips,
        localSubnet: localSubnet.trim() || "192.168.0.",
      });

      Alert.alert("Saved", res.message || "Office network settings saved.");
      await loadAttendance();
      setAdminModalVisible(false);
    } catch (err: any) {
      Alert.alert(
        "Save Failed",
        err.response?.data?.message || err.message || "Failed to save settings.",
      );
    } finally {
      setAdminLoading(false);
    }
  };

  // Clock in IST
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Attendance and Wi-Fi state
  const loadAttendance = useCallback(async () => {
    try {
      const [wifi, att] = await Promise.all([
        checkStudioWifi(),
        getTodayAttendance(token),
      ]);
      setWifiStatus(wifi);
      setRecord(att);
    } catch (err: any) {
      console.warn("Attendance load error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadAttendance();
    // Poll Wi-Fi & attendance status every 15s
    const interval = setInterval(loadAttendance, 15000);
    return () => clearInterval(interval);
  }, [loadAttendance]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  // Determine current punch action
  const isWorking = Boolean(record?.punchIn && !record?.punchOut);
  const isCompleted = Boolean(record?.punchIn && record?.punchOut);
  const nextAction: "PUNCH_IN" | "PUNCH_OUT" = isWorking
    ? "PUNCH_OUT"
    : "PUNCH_IN";

  // Handle Biometric Punch Action
  const handlePunchAction = async () => {
    const isWifiRequired = user.requireOfficeWifi !== false;
    if (isWifiRequired && !wifiStatus.isStudioWifi) {
      Alert.alert(
        "Studio Wi-Fi Required",
        "Attendance can only be marked while connected to Vidya Digital Studio Wi-Fi (192.168.0.x). Please connect to the office Wi-Fi network.",
      );
      return;
    }

    // Step 1: Biometric Verification
    const promptMessage =
      nextAction === "PUNCH_IN"
        ? `Authenticate to Punch In as ${user.name}`
        : `Authenticate to Punch Out as ${user.name}`;

    const bioResult = await authenticateKiosk(promptMessage);

    if (!bioResult.success) {
      setErrorData({
        visible: true,
        message: bioResult.error || "Biometric authentication was cancelled or failed.",
        isTimeout: false,
      });
      return;
    }

    // Step 2: Submit to Backend
    setActionLoading(true);

    try {
      if (nextAction === "PUNCH_IN") {
        const res = await submitPunchIn(token, wifiStatus.localIp);
        setSuccessData({
          visible: true,
          actionType: "PUNCH_IN",
          employeeName: user.name,
          serverTime: res.data?.punchIn || new Date().toISOString(),
          isLateHalfDay: res.data?.isLateHalfDay || false,
        });
      } else {
        const res = await submitPunchOut(token, wifiStatus.localIp);
        setSuccessData({
          visible: true,
          actionType: "PUNCH_OUT",
          employeeName: user.name,
          serverTime: res.data?.punchOut || new Date().toISOString(),
        });
      }

      await loadAttendance();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit punch record to server.";

      setErrorData({
        visible: true,
        message: msg,
        isTimeout: msg.toLowerCase().includes("timeout"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Confirm Sign Out",
      "Are you sure you want to sign out from this device?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await clearAuthSession();
            onLogout();
          },
        },
      ],
    );
  };

  // Avatar Initials
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatTimeStr = (isoString?: string | null) => {
    if (!isoString) return "--:--";
    try {
      return new Date(isoString).toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "--:--";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.userProfileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>
              {user.designation || user.role.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {(user.role === "admin" || user.role === "hr") && (
            <TouchableOpacity
              style={styles.adminWifiButton}
              onPress={openAdminNetworkModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="router-wireless-settings"
                size={22}
                color="#10b981"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogoutPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
          />
        }
      >
        {/* IST Clock Card */}
        <View style={styles.clockCard}>
          <Text style={styles.clockTime}>{currentTime}</Text>
          <Text style={styles.clockDate}>{currentDate} (IST)</Text>
        </View>

        {/* Network Status Pill */}
        {user.requireOfficeWifi === false ? (
          <View style={[styles.networkBadge, styles.networkBadgeRemote]}>
            <MaterialCommunityIcons
              name="home-map-marker"
              size={20}
              color="#38bdf8"
            />
            <View style={styles.networkMeta}>
              <Text style={[styles.networkTitle, { color: "#38bdf8" }]}>
                WORK FROM HOME / ON-SITE
              </Text>
              <Text style={styles.networkSub}>
                Office Wi-Fi exempt • Allowed to punch from any network
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.networkBadge,
              wifiStatus.isStudioWifi
                ? styles.networkBadgeOnline
                : styles.networkBadgeOffline,
            ]}
          >
            <MaterialCommunityIcons
              name={wifiStatus.isStudioWifi ? "wifi-check" : "wifi-off"}
              size={20}
              color={wifiStatus.isStudioWifi ? "#10b981" : "#ef4444"}
            />
            <View style={styles.networkMeta}>
              <Text
                style={[
                  styles.networkTitle,
                  wifiStatus.isStudioWifi
                    ? styles.networkTitleOnline
                    : styles.networkTitleOffline,
                ]}
              >
                {wifiStatus.isStudioWifi
                  ? "STUDIO WI-FI VERIFIED"
                  : "NOT ON STUDIO WI-FI"}
              </Text>
              <Text style={styles.networkSub}>
                {wifiStatus.isStudioWifi
                  ? `IP: ${wifiStatus.localIp || "192.168.0.x"} • Ready to Punch`
                  : wifiStatus.message}
              </Text>
            </View>
          </View>
        )}

        {/* Today's Attendance Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Today's Attendance</Text>
            <View
              style={[
                styles.statusPill,
                isWorking
                  ? styles.statusPillWorking
                  : isCompleted
                  ? styles.statusPillCompleted
                  : styles.statusPillNotStarted,
              ]}
            >
              <Text
                style={[
                  styles.statusPillText,
                  isWorking
                    ? styles.statusTextWorking
                    : isCompleted
                    ? styles.statusTextCompleted
                    : styles.statusTextNotStarted,
                ]}
              >
                {isWorking
                  ? "WORKING"
                  : isCompleted
                  ? "COMPLETED"
                  : "NOT STARTED"}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="clock-in"
                size={22}
                color="#10b981"
              />
              <Text style={styles.statLabel}>Punch In</Text>
              <Text style={styles.statValue}>
                {formatTimeStr(record?.punchIn)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="clock-out"
                size={22}
                color="#f59e0b"
              />
              <Text style={styles.statLabel}>Punch Out</Text>
              <Text style={styles.statValue}>
                {formatTimeStr(record?.punchOut)}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={22}
                color="#60a5fa"
              />
              <Text style={styles.statLabel}>Total Time</Text>
              <Text style={styles.statValue}>
                {record?.totalWorkMinutes
                  ? `${Math.floor(record.totalWorkMinutes / 60)}h ${
                      record.totalWorkMinutes % 60
                    }m`
                  : "--"}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary Biometric Punch Action Button */}
        <View style={styles.actionContainer}>
          {(() => {
            const isPunchAllowed =
              user.requireOfficeWifi === false || wifiStatus.isStudioWifi;
            return (
              <TouchableOpacity
                style={[
                  styles.punchButton,
                  nextAction === "PUNCH_IN"
                    ? styles.punchInButton
                    : styles.punchOutButton,
                  (!isPunchAllowed || actionLoading) &&
                    styles.punchButtonDisabled,
                ]}
                onPress={handlePunchAction}
                disabled={!isPunchAllowed || actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={36}
                      color="#ffffff"
                    />
                    <Text style={styles.punchButtonTitle}>
                      {nextAction === "PUNCH_IN"
                        ? "PUNCH IN (BIOMETRIC)"
                        : "PUNCH OUT (BIOMETRIC)"}
                    </Text>
                    <Text style={styles.punchButtonSub}>
                      {isPunchAllowed
                        ? "Touch fingerprint / Face ID to verify"
                        : "Connect to Studio Wi-Fi to unlock"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })()}
        </View>
      </ScrollView>

      {/* Success Modal */}
      <SuccessOverlay
        visible={successData.visible}
        actionType={successData.actionType}
        employeeName={successData.employeeName}
        serverTime={successData.serverTime}
        isLateHalfDay={successData.isLateHalfDay}
        onDismiss={() => setSuccessData((prev) => ({ ...prev, visible: false }))}
      />

      {/* Error Modal */}
      <ErrorOverlay
        visible={errorData.visible}
        errorMessage={errorData.message}
        isTimeout={errorData.isTimeout}
        onDismiss={() => setErrorData((prev) => ({ ...prev, visible: false }))}
        onVerifyStatus={handlePunchAction}
      />

      {/* Admin / HR Network Configuration Modal */}
      <Modal
        visible={adminModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Office Attendance Settings</Text>
                <Text style={styles.modalSubtitle}>Admin & HR Control Panel</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAdminModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  adminTab === "employees" && styles.tabBtnActive,
                ]}
                onPress={() => setAdminTab("employees")}
              >
                <MaterialCommunityIcons
                  name="account-cog"
                  size={18}
                  color={adminTab === "employees" ? "#ffffff" : "#9ca3af"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    adminTab === "employees" && styles.tabBtnTextActive,
                  ]}
                >
                  Employee Rules
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  adminTab === "network" && styles.tabBtnActive,
                ]}
                onPress={() => setAdminTab("network")}
              >
                <MaterialCommunityIcons
                  name="router-wireless"
                  size={18}
                  color={adminTab === "network" ? "#ffffff" : "#9ca3af"}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    adminTab === "network" && styles.tabBtnTextActive,
                  ]}
                >
                  Office Wi-Fi IP
                </Text>
              </TouchableOpacity>
            </View>

            {adminLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.modalLoadingText}>Loading settings...</Text>
              </View>
            ) : adminTab === "employees" ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.tabNotice}>
                  Turn ON for employees working offline at the studio (must be on Studio Wi-Fi to punch).
                  Turn OFF for employees working from home (WFH) or on-site.
                </Text>

                <TextInput
                  style={styles.searchBar}
                  placeholder="Search employee by name..."
                  placeholderTextColor="#6b7280"
                  value={employeeSearch}
                  onChangeText={setEmployeeSearch}
                />

                {employeesList
                  .filter(
                    (e) =>
                      e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                      (e.designation || "").toLowerCase().includes(employeeSearch.toLowerCase()),
                  )
                  .map((emp) => {
                    const isRequired = emp.requireOfficeWifi === true;
                    return (
                      <View key={emp._id} style={styles.employeeRuleCard}>
                        <View style={styles.empInfoCol}>
                          <Text style={styles.empNameText}>{emp.name}</Text>
                          <Text style={styles.empRoleText}>
                            {emp.designation || emp.role.toUpperCase()}
                          </Text>
                          <View
                            style={[
                              styles.workBadge,
                              isRequired
                                ? styles.workBadgeOffice
                                : styles.workBadgeRemote,
                            ]}
                          >
                            <Text
                              style={[
                                styles.workBadgeText,
                                isRequired
                                  ? { color: "#f59e0b" }
                                  : { color: "#10b981" },
                              ]}
                            >
                              {isRequired
                                ? "🏢 In-Studio (Wi-Fi Required)"
                                : "🏠 Remote (WFH / On-site)"}
                            </Text>
                          </View>
                        </View>

                        <Switch
                          value={isRequired}
                          onValueChange={(val) =>
                            handleToggleEmployeeWifi(emp._id, val)
                          }
                          trackColor={{ false: "#374151", true: "#10b981" }}
                          thumbColor="#ffffff"
                        />
                      </View>
                    );
                  })}
                {employeesList.length === 0 && (
                  <Text style={styles.emptyListText}>No employees found.</Text>
                )}
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1-Click Set Current IP Box */}
                <View style={styles.detectedIpBox}>
                  <Text style={styles.inputLabel}>YOUR CURRENT PUBLIC IP</Text>
                  <Text style={styles.detectedIpValue}>
                    {detectedIp || "Detecting..."}
                  </Text>
                  <Text style={styles.detectedIpHint}>
                    Detected by server. Tap below to authorize this IP for all employee punches.
                  </Text>

                  <TouchableOpacity
                    style={styles.setIpButton}
                    onPress={handleSetCurrentIp}
                    disabled={!detectedIp || adminLoading}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-check"
                      size={18}
                      color="#ffffff"
                    />
                    <Text style={styles.setIpButtonText}>
                      Set Current Network as Office Wi-Fi
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Database State Summary */}
                {lastUpdatedInfo ? (
                  <Text style={styles.lastUpdatedText}>{lastUpdatedInfo}</Text>
                ) : null}

                {/* Manual Edit Inputs */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>AUTHORIZED PUBLIC IP(S)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={configuredIps}
                    onChangeText={setConfiguredIps}
                    placeholder="e.g. 103.21.54.10, 122.161.45.10"
                    placeholderTextColor="#6b7280"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.inputHelp}>
                    Comma-separated list of broadband public IPs.
                  </Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>LOCAL WI-FI SUBNET</Text>
                  <TextInput
                    style={styles.textInput}
                    value={localSubnet}
                    onChangeText={setLocalSubnet}
                    placeholder="192.168.0."
                    placeholderTextColor="#6b7280"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.inputHelp}>
                    Local IP prefix reported by phones on office Wi-Fi.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.saveSettingsButton}
                  onPress={handleSaveCustomNetwork}
                  disabled={adminLoading}
                >
                  <Text style={styles.saveSettingsText}>Save Network Settings</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  userProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1.5,
    borderColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "800",
  },
  userMeta: {
    flexDirection: "column",
  },
  userName: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
  },
  userRole: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1f2937",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  adminWifiButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  clockCard: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 16,
  },
  clockTime: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1,
  },
  clockDate: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  networkBadgeOnline: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  networkBadgeOffline: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  networkBadgeRemote: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  networkMeta: {
    flex: 1,
  },
  networkTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  networkTitleOnline: {
    color: "#10b981",
  },
  networkTitleOffline: {
    color: "#ef4444",
  },
  networkSub: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#f3f4f6",
    fontSize: 16,
    fontWeight: "700",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillWorking: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  statusPillCompleted: {
    backgroundColor: "rgba(96, 165, 250, 0.2)",
  },
  statusPillNotStarted: {
    backgroundColor: "rgba(156, 163, 175, 0.2)",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusTextWorking: {
    color: "#10b981",
  },
  statusTextCompleted: {
    color: "#60a5fa",
  },
  statusTextNotStarted: {
    color: "#9ca3af",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#1f2937",
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  actionContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  punchButton: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  punchInButton: {
    backgroundColor: "#10b981",
  },
  punchOutButton: {
    backgroundColor: "#f59e0b",
  },
  punchButtonDisabled: {
    backgroundColor: "#374151",
    opacity: 0.6,
  },
  punchButtonTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 8,
  },
  punchButtonSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modalCard: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#f3f4f6",
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
  modalLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  modalLoadingText: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 12,
  },
  detectedIpBox: {
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 16,
  },
  detectedIpValue: {
    color: "#10b981",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginVertical: 4,
  },
  detectedIpHint: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  setIpButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  setIpButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  lastUpdatedText: {
    color: "#6b7280",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#374151",
  },
  inputHelp: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
  },
  saveSettingsButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  saveSettingsText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: "#374151",
  },
  tabBtnText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
  },
  tabBtnTextActive: {
    color: "#ffffff",
  },
  tabNotice: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 14,
  },
  employeeRuleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  empInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  empNameText: {
    color: "#f3f4f6",
    fontSize: 15,
    fontWeight: "700",
  },
  empRoleText: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    textTransform: "uppercase",
  },
  workBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  workBadgeOffice: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  workBadgeRemote: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  workBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  emptyListText: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 20,
  },
});
