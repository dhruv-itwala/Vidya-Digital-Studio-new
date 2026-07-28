import toast from "react-hot-toast";
import {
  sendTestNotificationAPI,
  subscribeToNotificationsAPI,
} from "../api/notification.api";

/**
 * Detect iOS (iPhone / iPad)
 */
export const isIOS = () => {
  if (typeof window === "undefined") return false;
  return (
    ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(
      navigator.platform,
    ) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

/**
 * Detect PWA Standalone Mode
 */
export const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator && window.navigator.standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
};

/**
 * Convert VAPID Public Key
 */
function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error("VAPID public key is missing.");
  }

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Check Push Notification Status
 */
export const getNotificationStatus = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return {
      supported: false,
      status: "unsupported",
      isIOS: isIOS(),
      isStandalone: isStandalone(),
    };
  }

  const isIosDevice = isIOS();
  const isStandaloneApp = isStandalone();

  // iOS Safari requires Add to Home Screen first
  if (isIosDevice && !isStandaloneApp) {
    return {
      supported: false,
      status: "ios_needs_pwa",
      isIOS: true,
      isStandalone: false,
      message: "Install app to Home Screen on iPhone/iPad to enable push notifications.",
    };
  }

  const permission = Notification.permission;
  if (permission !== "granted") {
    return {
      supported: true,
      status: permission,
      isIOS: isIosDevice,
      isStandalone: isStandaloneApp,
    };
  }

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return {
        supported: true,
        status: subscription ? "enabled" : "granted",
        isIOS: isIosDevice,
        isStandalone: isStandaloneApp,
      };
    }
  } catch (err) {
    console.error("Error checking push subscription:", err);
  }

  return {
    supported: true,
    status: permission,
    isIOS: isIosDevice,
    isStandalone: isStandaloneApp,
  };
};

/**
 * Enable Push Notifications
 */
export const enablePushNotifications = async () => {
  try {
    if (isIOS() && !isStandalone()) {
      const msg =
        "To enable push notifications on iPhone/iPad:\n1. Tap Share in Safari\n2. Select 'Add to Home Screen'\n3. Open Staff CRM from your Home Screen.";
      toast(msg, { icon: "📲", duration: 6000 });
      alert(msg);
      return { success: false, reason: "ios_needs_pwa" };
    }

    if (!("Notification" in window)) {
      toast.error("Notifications are not supported on this browser.");
      return { success: false, reason: "unsupported" };
    }

    if (!("serviceWorker" in navigator)) {
      toast.error("Service Worker is not supported on this device.");
      return { success: false, reason: "no_service_worker" };
    }

    const permission = await Notification.requestPermission();

    if (permission === "denied") {
      toast.error(
        "Notification permission is blocked. Please allow notifications in your browser Site Settings.",
      );
      return { success: false, reason: "denied" };
    }

    if (permission !== "granted") {
      toast("Notification permission was not granted.");
      return { success: false, reason: permission };
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      toast.error("VAPID public key is not configured.");
      return { success: false, reason: "missing_vapid" };
    }

    let subscription = await registration.pushManager.getSubscription();

    try {
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }
    } catch (subErr) {
      console.warn("Unsubscribing existing subscription due to key mismatch and retrying...", subErr);
      if (subscription) {
        await subscription.unsubscribe();
      }
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    await subscribeToNotificationsAPI(subscription);

    toast.success("✅ Push Notifications Enabled Successfully!");

    return { success: true };
  } catch (error) {
    console.error("Push Notification Error:", error);
    toast.error(error?.message || "Failed to enable notifications.");
    return { success: false, error: error?.message };
  }
};

/**
 * Test Push Notifications
 */
export const handleTestNotification = async () => {
  try {
    const { data } = await sendTestNotificationAPI();
    toast.success(data?.message || "Test notification request sent.");
    return { success: true, data };
  } catch (error) {
    console.error(error);
    const msg =
      error?.message ||
      error?.data?.message ||
      "Failed to send test notification. Make sure notifications are enabled.";
    toast.error(msg);
    return { success: false, error: msg };
  }
};