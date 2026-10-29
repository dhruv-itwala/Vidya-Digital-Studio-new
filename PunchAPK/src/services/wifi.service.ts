// PunchAPK/src/services/wifi.service.ts
import * as Network from "expo-network";
import axios from "axios";
import { DEFAULT_CONFIG } from "../config/env";
import { getKioskConfig } from "./storage.service";
import { WifiStatus } from "../types";

/**
 * Checks whether the current device is connected to the authorized
 * Vidya Digital Studio Wi-Fi network (Subnet 192.168.0.x and/or server verified public IP).
 */
export const checkStudioWifi = async (): Promise<WifiStatus> => {
  try {
    const netState = await Network.getNetworkStateAsync();

    if (!netState.isConnected) {
      return {
        isStudioWifi: false,
        localIp: null,
        isWifiConnected: false,
        message: "No internet connection detected.",
      };
    }

    const isWifi =
      netState.type === Network.NetworkStateType.WIFI;

    // Retrieve device local IP on the current network
    let localIp: string | null = null;
    try {
      localIp = await Network.getIpAddressAsync();
    } catch {
      localIp = null;
    }

    // Studio Wi-Fi subnet check (e.g. 192.168.0.x)
    const targetSubnet = DEFAULT_CONFIG.studioLocalSubnet || "192.168.0.";
    const matchesLocalSubnet =
      Boolean(localIp && localIp.startsWith(targetSubnet));

    // Verify with backend Wi-Fi inspector endpoint
    let isServerVerified = false;
    let publicIp: string | null = null;

    try {
      const config = await getKioskConfig();
      const res = await axios.get(`${config.apiUrl}/attendance/wifi-check`, {
        timeout: 5000,
        headers: {
          "x-client-local-ip": localIp || "",
        },
      });

      if (res.data?.data) {
        isServerVerified = Boolean(res.data.data.isOfficeWifi);
        publicIp = res.data.data.clientPublicIp || null;
      }
    } catch {
      // In offline or slow network conditions, fallback to local subnet verification
      isServerVerified = false;
    }

    const isStudioWifi = isWifi && (matchesLocalSubnet || isServerVerified);

    let message = "Connected to Studio Wi-Fi";
    if (!isWifi) {
      message = "Connected via Mobile Cellular Data. Please connect to Studio Wi-Fi.";
    } else if (!isStudioWifi) {
      message = `Connected to Wi-Fi (${localIp || "Unknown IP"}), but not Studio Wi-Fi (192.168.0.x).`;
    }

    return {
      isStudioWifi,
      localIp,
      publicIp,
      isWifiConnected: isWifi,
      message,
    };
  } catch (err: any) {
    return {
      isStudioWifi: false,
      localIp: null,
      isWifiConnected: false,
      message: err.message || "Failed to inspect Wi-Fi status.",
    };
  }
};

