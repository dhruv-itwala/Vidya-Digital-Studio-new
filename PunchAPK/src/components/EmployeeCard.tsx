// PunchAPK/src/components/EmployeeCard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Employee } from "../types";
import { StatusBadge } from "./StatusBadge";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  employee: Employee;
  onPress: () => void;
}

const getInitials = (name: string): string => {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const EmployeeCard: React.FC<Props> = ({ employee, onPress }) => {
  const isWorking = employee.status === "WORKING";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isWorking ? styles.cardActive : styles.cardDefault,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        {employee.profilePicture ? (
          <Image
            source={{ uri: employee.profilePicture }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initialsText}>
              {getInitials(employee.name)}
            </Text>
          </View>
        )}

        <StatusBadge status={employee.status} />
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.nameText} numberOfLines={1}>
          {employee.name}
        </Text>
        <Text style={styles.roleText} numberOfLines={1}>
          {employee.designation || employee.role.toUpperCase()}
        </Text>
      </View>

      <View style={styles.actionPromptRow}>
        <Text style={styles.actionPromptText}>
          {employee.status === "WORKING"
            ? "Tap to Punch Out"
            : employee.status === "COMPLETED"
            ? "Tap to Punch In Again"
            : "Tap to Punch In"}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color="#9ca3af"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cardDefault: {
    borderColor: "#374151",
  },
  cardActive: {
    borderColor: "rgba(16, 185, 129, 0.4)",
    backgroundColor: "#172334",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#374151",
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  infoCol: {
    marginBottom: 12,
  },
  nameText: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  roleText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  actionPromptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  actionPromptText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
});

