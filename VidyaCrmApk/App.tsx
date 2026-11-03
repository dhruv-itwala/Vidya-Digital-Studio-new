// VidyaCrmApk/App.tsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  StatusBar,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import type {
  WebViewNavigation,
  WebViewErrorEvent,
} from "react-native-webview/lib/WebViewTypes";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";

// Configurable fallback target (Local Wi-Fi LAN port 20254 or custom environment)
export const DEFAULT_CRM_URL =
  process.env.EXPO_PUBLIC_CRM_URL || "http://192.168.0.149:20254";

const STORAGE_KEY_CRM_URL = "mystaff_crm_target_url";

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Active CRM URL in state
  const [crmUrl, setCrmUrl] = useState<string>(DEFAULT_CRM_URL);
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_CRM_URL);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const lastBackPressRef = useRef<number>(0);

  // 1. Load saved server URL on app launch
  useEffect(() => {
    const loadStoredUrl = async () => {
      try {
        const storedUrl = await SecureStore.getItemAsync(STORAGE_KEY_CRM_URL);
        if (storedUrl && storedUrl.trim().length > 0) {
          setCrmUrl(storedUrl.trim());
          setInputUrl(storedUrl.trim());
        } else {
          setCrmUrl(DEFAULT_CRM_URL);
          setInputUrl(DEFAULT_CRM_URL);
        }
      } catch (err) {
        console.warn("SecureStore read error:", err);
      } finally {
        setIsInitialized(true);
      }
    };
    loadStoredUrl();
  }, []);

  // 2. Android Hardware Back Button Handling
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return true;
      }

      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      // If at root page, double-press to exit
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressRef.current = now;
      ToastAndroid.show("Press back again to exit MyStaff", ToastAndroid.SHORT);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => backHandler.remove();
  }, [canGoBack, showSettingsModal]);

  // 3. Navigation State Change Tracking
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setIsLoading(navState.loading);
  }, []);

  // 4. Error Handling
  const handleError = (syntheticEvent: WebViewErrorEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn("WebView error:", nativeEvent.description);
    setHasError(true);
    setErrorMessage(nativeEvent.description || "Failed to connect to MyStaff server");
    setIsLoading(false);
  };

  // 5. Retry Connection
  const handleRetry = async () => {
    setHasError(false);
    setIsLoading(true);

    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) {
      setHasError(true);
      setErrorMessage("No network connection detected. Please check your Wi-Fi or mobile data.");
      setIsLoading(false);
      return;
    }

    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // 6. Save new server URL
  const handleSaveUrl = async (newUrlToSave?: string) => {
    const target = (newUrlToSave || inputUrl).trim();
    if (!target) {
      ToastAndroid.show("Please enter a valid URL", ToastAndroid.SHORT);
      return;
    }

    let formattedUrl = target;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `http://${formattedUrl}`;
    }

    try {
      await SecureStore.setItemAsync(STORAGE_KEY_CRM_URL, formattedUrl);
    } catch (err) {
      console.warn("SecureStore write error:", err);
    }

    setCrmUrl(formattedUrl);
    setInputUrl(formattedUrl);
    setShowSettingsModal(false);
    setHasError(false);
    setIsLoading(true);

    ToastAndroid.show(`Connected to: ${formattedUrl}`, ToastAndroid.SHORT);
  };

  // 7. Pull-To-Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasError(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar backgroundColor="#0f5c44" barStyle="light-content" />
        <ActivityIndicator size="large" color="#0f5c44" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0f5c44" barStyle="light-content" />

      {/* Main WebView Container */}
      <View style={styles.webContainer}>
        {!hasError ? (
          <WebView
            ref={webViewRef}
            source={{ uri: crmUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onError={handleError}
            onHttpError={handleError}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            // Performance & compatibility settings
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            mixedContentMode="always"
            allowsBackForwardNavigationGestures={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            pullToRefreshEnabled={true}
            style={styles.webView}
            // User agent identifier
            applicationNameForUserAgent="MyStaff-Android/1.3.90"
          />
        ) : (
          /* Error & Server Configuration Screen */
          <ScrollView
            contentContainerStyle={styles.errorContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <Image
              source={require("./assets/icon.png")}
              style={styles.brandIcon}
              resizeMode="contain"
            />
            <Text style={styles.errorTitle}>Unable to Reach MyStaff</Text>
            <Text style={styles.errorSubtitle}>
              {errorMessage || "Cannot reach server. Verify your Wi-Fi or configure the server URL below."}
            </Text>

            {/* In-place Server Config Box */}
            <View style={styles.serverConfigCard}>
              <Text style={styles.configLabel}>Target Server URL</Text>
              <TextInput
                style={styles.textInput}
                value={inputUrl}
                onChangeText={setInputUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="http://192.168.0.149:20254"
                placeholderTextColor="#9ca3af"
              />

              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => {
                    const localLan = "http://192.168.0.149:20254";
                    setInputUrl(localLan);
                    handleSaveUrl(localLan);
                  }}
                >
                  <Text style={styles.presetChipText}>🏢 Studio LAN (192.168.0.149:20254)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={() => handleSaveUrl()}
                >
                  <Text style={styles.primaryBtnText}>Save & Connect</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondaryBtn]}
                  onPress={handleRetry}
                >
                  <Text style={styles.secondaryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Floating Top Loading Bar */}
        {isLoading && !hasError && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#0f5c44" />
          </View>
        )}

        {/* Floating Settings Button (Allows opening URL configuration anytime) */}
        {!hasError && (
          <TouchableOpacity
            style={styles.floatingSettingsBtn}
            onPress={() => {
              setInputUrl(crmUrl);
              setShowSettingsModal(true);
            }}
          >
            <Text style={styles.floatingSettingsText}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settings Modal (Accessible while browsing) */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Server Settings</Text>
            <Text style={styles.configLabel}>Current CRM URL</Text>
            <TextInput
              style={styles.textInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.0.149:20254"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  const localLan = "http://192.168.0.149:20254";
                  setInputUrl(localLan);
                  handleSaveUrl(localLan);
                }}
              >
                <Text style={styles.presetChipText}>🏢 Studio LAN (192.168.0.149:20254)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.primaryBtn]}
                onPress={() => handleSaveUrl()}
              >
                <Text style={styles.primaryBtnText}>Save & Reload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f5c44",
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  webContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webView: {
    flex: 1,
  },
  loaderOverlay: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 6,
    elevation: 3,
  },
  floatingSettingsBtn: {
    position: "absolute",
    bottom: 18,
    right: 18,
    zIndex: 999,
    backgroundColor: "rgba(15, 92, 68, 0.85)",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  floatingSettingsText: {
    fontSize: 20,
  },
  errorContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  brandIcon: {
    width: 72,
    height: 72,
    marginBottom: 16,
    borderRadius: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 13,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  serverConfigCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    height: 46,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
    marginBottom: 12,
  },
  presetRow: {
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  presetChipText: {
    fontSize: 12,
    color: "#0f5c44",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: "#0f5c44",
    elevation: 2,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "#e5e7eb",
  },
  secondaryBtnText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
  },
  cancelBtnText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
  },
});
