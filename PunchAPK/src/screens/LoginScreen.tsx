// PunchAPK/src/screens/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { loginEmployee } from "../api/auth.api";
import { saveAuthSession } from "../services/storage.service";
import { checkStudioWifi } from "../services/wifi.service";
import { WifiStatus } from "../types";

interface Props {
  navigation: any;
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginScreen: React.FC<Props> = ({ navigation, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [wifiStatus, setWifiStatus] = useState<WifiStatus>({
    isStudioWifi: false,
    localIp: null,
    isWifiConnected: false,
  });

  const inspectWifi = async () => {
    const status = await checkStudioWifi();
    setWifiStatus(status);
  };

  useEffect(() => {
    inspectWifi();
    const interval = setInterval(inspectWifi, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    setErrorMessage("");

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setErrorMessage("Please enter both email/phone and password.");
      return;
    }

    setLoading(true);

    try {
      const { token, user } = await loginEmployee(trimmedEmail, trimmedPass);
      await saveAuthSession(token, user);
      onLoginSuccess(token, user);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please verify credentials.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Studio Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIconWrapper}>
              <MaterialCommunityIcons
                name="shield-check"
                size={40}
                color="#10b981"
              />
            </View>
            <Text style={styles.brandTitle}>VIDYA DIGITAL STUDIO</Text>
            <Text style={styles.brandSubtitle}>STAFF ATTENDANCE PORTAL</Text>

            {/* Network Verification Badge */}
            <View
              style={[
                styles.networkPill,
                wifiStatus.isStudioWifi
                  ? styles.networkPillOnline
                  : styles.networkPillOffline,
              ]}
            >
              <View
                style={[
                  styles.networkDot,
                  wifiStatus.isStudioWifi
                    ? styles.networkDotOnline
                    : styles.networkDotOffline,
                ]}
              />
              <Text
                style={[
                  styles.networkText,
                  wifiStatus.isStudioWifi
                    ? styles.networkTextOnline
                    : styles.networkTextOffline,
                ]}
              >
                {wifiStatus.isStudioWifi
                  ? `Studio Wi-Fi (${wifiStatus.localIp || "192.168.0.x"})`
                  : wifiStatus.isWifiConnected
                  ? `Other Wi-Fi (${wifiStatus.localIp || "Offline"})`
                  : "Mobile Cellular Data"}
              </Text>
            </View>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Sign In</Text>
            <Text style={styles.cardSubtext}>
              Sign in with your staff account to mark daily attendance.
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color="#ef4444"
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email / Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Phone</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="employee@vidyadigitalstudio.com"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color="#9ca3af"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0b0f19" />
              ) : (
                <Text style={styles.submitButtonText}>Sign In to Attendance</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brandTitle: {
    color: "#f3f4f6",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  brandSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 14,
  },
  networkPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  networkPillOnline: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10b981",
  },
  networkPillOffline: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#ef4444",
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkDotOnline: {
    backgroundColor: "#10b981",
  },
  networkDotOffline: {
    backgroundColor: "#ef4444",
  },
  networkText: {
    fontSize: 12,
    fontWeight: "700",
  },
  networkTextOnline: {
    color: "#10b981",
  },
  networkTextOffline: {
    color: "#ef4444",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1f2937",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardSubtext: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: "#d1d5db",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#0b0f19",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

