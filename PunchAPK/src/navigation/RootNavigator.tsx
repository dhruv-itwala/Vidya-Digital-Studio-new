// PunchAPK/src/navigation/RootNavigator.tsx
import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { EmployeePunchScreen } from "../screens/EmployeePunchScreen";
import { KioskHomeScreen } from "../screens/KioskHomeScreen";
import { KioskSetupScreen } from "../screens/KioskSetupScreen";
import { getAuthSession } from "../services/storage.service";
import { UserProfile } from "../types";

export type RootStackParamList = {
  Login: undefined;
  EmployeePunch: undefined;
  KioskHome: undefined;
  KioskSetup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{
    token: string;
    user: UserProfile;
  } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const storedSession = await getAuthSession();
      if (storedSession) {
        setSession(storedSession);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#0b0f19" },
      }}
    >
      {session ? (
        <Stack.Screen name="EmployeePunch">
          {(props) => (
            <EmployeePunchScreen
              {...props}
              token={session.token}
              user={session.user}
              onLogout={() => setSession(null)}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen
              {...props}
              onLoginSuccess={(token, user) => setSession({ token, user })}
            />
          )}
        </Stack.Screen>
      )}

      {/* Standalone Kiosk Fallback Screens */}
      <Stack.Screen name="KioskHome" component={KioskHomeScreen} />
      <Stack.Screen name="KioskSetup" component={KioskSetupScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0b0f19",
    alignItems: "center",
    justifyContent: "center",
  },
});
