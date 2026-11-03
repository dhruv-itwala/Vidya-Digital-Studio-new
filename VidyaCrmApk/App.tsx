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
} from "react-native";
import { WebView } from "react-native-webview";
import type {
  WebViewNavigation,
  WebViewErrorEvent,
} from "react-native-webview/lib/WebViewTypes";
import * as Network from "expo-network";

// Configurable CRM target URL (defaults to production CRM, or LAN / custom via environment)
const DEFAULT_CRM_URL =
  process.env.EXPO_PUBLIC_CRM_URL || "https://backend.vidyadigitalstudio.com/api/v1.0";

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [crmUrl, setCrmUrl] = useState(DEFAULT_CRM_URL);
  const lastBackPressRef = useRef<number>(0);

  // 1. Android Hardware Back Button Handling
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
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
  }, [canGoBack]);

  // 2. Navigation State Change Tracking
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setIsLoading(navState.loading);
  }, []);

  // 3. Error Handling
  const handleError = (syntheticEvent: WebViewErrorEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn("WebView error:", nativeEvent.description);
    setHasError(true);
    setErrorMessage(nativeEvent.description || "Failed to connect to MyStaff server");
    setIsLoading(false);
  };

  // 4. Retry Connection
  const handleRetry = async () => {
    setHasError(false);
    setIsLoading(true);

    const netInfo = await Network.getNetworkStateAsync();
    if (!netInfo.isConnected) {
      setHasError(true);
      setErrorMessage("No internet connection detected. Please check your Wi-Fi or mobile data.");
      setIsLoading(false);
      return;
    }

    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  // 5. Pull-To-Refresh
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
          /* Error & Offline Fallback Screen */
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
              {errorMessage || "Check your network connection and server availability."}
            </Text>
            <Text style={styles.urlHint}>Target: {crmUrl}</Text>

            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Floating Top Loading Bar */}
        {isLoading && !hasError && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#0f5c44" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f5c44",
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
  errorContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f9fafb",
  },
  brandIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    borderRadius: 18,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  urlHint: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 24,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#0f5c44",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    elevation: 2,
  },
  retryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});

