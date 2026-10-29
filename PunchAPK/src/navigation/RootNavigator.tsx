// PunchAPK/src/navigation/RootNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { KioskHomeScreen } from "../screens/KioskHomeScreen";
import { KioskSetupScreen } from "../screens/KioskSetupScreen";

export type RootStackParamList = {
  Home: undefined;
  Setup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#0b0f19" },
      }}
    >
      <Stack.Screen name="Home" component={KioskHomeScreen} />
      <Stack.Screen name="Setup" component={KioskSetupScreen} />
    </Stack.Navigator>
  );
};

