import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, Divider } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

export default function CoachProfileScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { coaches, batches, getCoachBatches } = useData();

  const coachId = currentUser?.linkedId ?? "";
  const coach = coaches.find((c) => c.id === coachId);
  const coachBatches = getCoachBatches(coachId);
  const topPad = isWeb ? 67 : insets.top;

  if (!coach) {
    return (
      <View style={{ flex: 1, backgroundColor: c.primary050, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Feather name="user" size={48} color={c.textDisabled} />
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 16, marginTop: 16, textAlign: "center" }}>
          Profile not found.{"\n"}Please contact your admin.
        </Text>
        <View style={{ marginTop: 32, width: "100%" }}>
          <Button onPress={() => logout()} label="Sign Out" variant="danger" fullWidth icon="log-out" />
        </View>
      </View>
    );
  }

  const infoRows = [
    { icon: "hash" as const, label: "HRMS ID", value: coach.hrmsId },
    { icon: "briefcase" as const, label: "Designation", value: coach.designation },
    { icon: "phone" as const, label: "Mobile", value: coach.mobile },
    { icon: "mail" as const, label: "Email", value: coach.email || "—" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <LinearGradient
        colors={["#0A1628", "#1A3A6E"]}
        style={[styles.header, { paddingTop: topPad + 24 }]}
      >
        <Avatar name={coach.name} size={80} uri={coach.photo} />
        <Text style={styles.name}>{coach.name}</Text>
        <Text style={styles.designation}>{coach.designation}</Text>
        <View style={styles.hrmsChip}>
          <Text style={styles.hrmsText}>{coach.hrmsId}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }}>
        {/* Batch Assignments */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {coachBatches.map((batch) => {
            const colors: Record<string, string> = { "batch-a": c.accentEmerald, "batch-b": c.primary500, "batch-c": c.accentViolet };
            const color = colors[batch.id] ?? c.primary500;
            return (
              <View key={batch.id} style={[styles.batchBadge, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
                <Text style={{ color, fontFamily: "Inter_700Bold", fontSize: 14 }}>{batch.name}</Text>
                <Text style={{ color, fontFamily: "Inter_400Regular", fontSize: 12 }}>{batch.ageRange}</Text>
              </View>
            );
          })}
        </View>

        {/* Profile Info */}
        <Card>
          {infoRows.map((row, i) => (
            <View key={i}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
                <View style={[styles.iconBox, { backgroundColor: c.primary100 }]}>
                  <Feather name={row.icon} size={16} color={c.primary600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 }}>{row.label}</Text>
                  <Text style={{ color: c.textPrimary, fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 1 }}>{row.value}</Text>
                </View>
              </View>
              {i < infoRows.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        {/* Account Info */}
        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Login ID</Text>
            <Text style={{ color: c.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{currentUser?.loginId}</Text>
          </View>
          <Divider />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Role</Text>
            <Text style={{ color: c.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 13, textTransform: "capitalize" }}>Coach</Text>
          </View>
          <Divider />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13 }}>Member Since</Text>
            <Text style={{ color: c.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
              {new Date(coach.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </Text>
          </View>
        </Card>

        <View style={{ marginTop: 24 }}>
          <Button onPress={() => logout()} label="Sign Out" variant="danger" fullWidth icon="log-out" />
        </View>

        <Text style={{ textAlign: "center", color: c.textDisabled, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 20 }}>
          Cricket360 v1.0 · DSA Dhanbad
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 32, alignItems: "center" },
  name: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 14 },
  designation: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  hrmsChip: { marginTop: 10, backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(245,158,11,0.4)" },
  hrmsText: { color: "#F59E0B", fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 0.5 },
  batchBadge: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 2 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
