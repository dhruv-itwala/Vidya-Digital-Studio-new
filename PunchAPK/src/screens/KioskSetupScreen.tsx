// PunchAPK/src/screens/KioskSetupScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getKioskConfig,
  saveKioskConfig,
  resetKioskConfig,
  saveAdminPin,
} from "../services/storage.service";
import { pingBackend } from "../api/client";
import { checkBiometricSupport } from "../services/biometric.service";
import { BiometricCheckResult } from "../types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  navigation: any;
}

export const KioskSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [apiUrl, setApiUrl] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [newAdminPin, setNewAdminPin] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [bioStatus, setBioStatus] = useState<BiometricCheckResult | null>(null);

  useEffect(() => {
    const init = async () => {
      const [cfg, bio] = await Promise.all([
        getKioskConfig(),
        checkBiometricSupport(),
      ]);
      setApiUrl(cfg.apiUrl);
      setDeviceId(cfg.deviceId);
      setDeviceKey(cfg.deviceKey);
      setBioStatus(bio);
    };
    init();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Temporarily save to test with entered values
      await saveKioskConfig({ apiUrl, deviceId, deviceKey });
      const res = await pingBackend();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const cleanUrl = apiUrl.trim();
    const cleanDeviceId = deviceId.trim();
    const cleanDeviceKey = deviceKey.trim();

    if (!cleanUrl || !cleanDeviceId || !cleanDeviceKey) {
      Alert.alert("Validation Error", "API URL, Device ID, and Device Secret Key are all required.");
      return;
    }

    setSaving(true);
    try {
      await saveKioskConfig({
        apiUrl: cleanUrl,
        deviceId: cleanDeviceId,
        deviceKey: cleanDeviceKey,
      });

      if (newAdminPin.trim()) {
        if (newAdminPin.trim().length < 4) {
          Alert.alert("PIN Error", "Admin PIN must be at least 4 digits.");
          setSaving(false);
          return;
        }
        await saveAdminPin(newAdminPin.trim());
      }

      Alert.alert(
        "Saved",
        "Kiosk configuration and credentials securely saved into device hardware storage.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert("Save Error", err.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      "Confirm Reset",
      "Reset configuration to defaults? This will erase custom keys from secure storage.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetKioskConfig();
            const cfg = await getKioskConfig();
            setApiUrl(cfg.apiUrl);
            setDeviceId(cfg.deviceId);
            setDeviceKey(cfg.deviceKey);
            setNewAdminPin("");
            Alert.alert("Reset", "Defaults restored.");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f3f4f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KIOSK TERMINAL SETUP</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Device Biometrics Diagnostics Card */}
        <View style={styles.diagnosticsCard}>
          <Text style={styles.sectionHeader}>DEVICE HARDWARE DIAGNOSTICS</Text>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagLabel}>Fingerprint Sensor Hardware:</Text>
            <Text
              style={[
                styles.diagValue,
                bioStatus?.hasHardware ? styles.diagOk : styles.diagError,
              ]}
            >
              {bioStatus?.hasHardware ? "DETECTED (Samsung Class 3)" : "NOT DETECTED"}
            </Text>
          </View>

          <View style={styles.diagnosticRow}>
            <Text style={styles.diagLabel}>Fingerprints Enrolled:</Text>
            <Text
              style={[
                styles.diagValue,
                bioStatus?.isEnrolled ? styles.diagOk : styles.diagError,
              ]}
            >
              {bioStatus?.isEnrolled ? "ENROLLED" : "NO FINGERPRINTS ENROLLED"}
            </Text>
          </View>
        </View>

        {/* Server & Terminal Configuration */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>API & DEVICE CREDENTIALS</Text>

          <Text style={styles.inputLabel}>Backend API Base URL</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://backend.vidyadigitalstudio.com/api/v1.0"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Terminal Hardware Device ID</Text>
          <TextInput
            style={styles.input}
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="M32-KIOSK-01"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Device Secret Key (Stored in KeyStore)</Text>
          <TextInput
            style={styles.input}
            value={deviceKey}
            onChangeText={setDeviceKey}
            placeholder="Enter authorized kiosk secret..."
            placeholderTextColor="#6b7280"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.inputLabel}>Change Admin Passcode (Optional)</Text>
          <TextInput
            style={styles.input}
            value={newAdminPin}
            onChangeText={setNewAdminPin}
            placeholder="Enter new 4-digit PIN (Leave blank to keep current)"
            placeholderTextColor="#6b7280"
            secureTextEntry
            keyboardType="numeric"
            maxLength={10}
          />

          {testResult && (
            <View
              style={[
                styles.testResultBox,
                testResult.ok ? styles.testOk : styles.testFail,
              ]}
            >
              <MaterialCommunityIcons
                name={testResult.ok ? "check-circle" : "close-circle"}
                size={20}
                color={testResult.ok ? "#10b981" : "#ef4444"}
              />
              <Text
                style={[
                  styles.testResultText,
                  testResult.ok ? styles.testOkText : styles.testFailText,
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#10b981" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="lan-connect" size={20} color="#10b981" />
                <Text style={styles.testButtonText}>Test Server Connection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetDefaults}
        >
          <Text style={styles.resetButtonText}>Restore Development Defaults</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: "#111827",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#f3f4f6",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  diagnosticsCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  sectionHeader: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 14,
  },
  diagnosticRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  diagLabel: {
    color: "#d1d5db",
    fontSize: 13,
  },
  diagValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  diagOk: {
    color: "#10b981",
  },
  diagError: {
    color: "#ef4444",
  },
  formCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  inputLabel: {
    color: "#d1d5db",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 10,
    marginTop: 4,
  },
  testButtonText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "700",
  },
  testResultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  testOk: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10b981",
  },
  testFail: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#ef4444",
  },
  testResultText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  testOkText: {
    color: "#10b981",
  },
  testFailText: {
    color: "#ef4444",
  },
  saveButton: {
    backgroundColor: "#10b981",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resetButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
});
