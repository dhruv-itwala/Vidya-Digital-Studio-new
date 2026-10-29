// PunchAPK/App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useKeepAwake } from "expo-keep-awake";

export default function App() {
  // Keeps the screen on while the kiosk is in the foreground
  useKeepAwake();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0b0f19" translucent={false} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

