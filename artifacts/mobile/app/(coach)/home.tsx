import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, NotificationItem, SectionHeader, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

const d = new Date();
const THIS_MONTH = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const TODAY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isWeb = Platform.OS === "web";

export default function CoachHomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const {
    coaches, batches, students, schedules, attendanceLogs,
    notifications, markNotificationRead,
    getCoachBatches, getPendingReceipts, getDefaulters, getTodayAttendance,
  } = useData();
  const router = useRouter();

  const coachId = currentUser?.linkedId ?? "";
  const coach = coaches.find((c) => c.id === coachId);
  const coachBatches = getCoachBatches(coachId);
  const primaryBatch = coachBatches[0];

  const todayAtt = primaryBatch ? getTodayAttendance(primaryBatch.id, TODAY) : undefined;
  const batchStudents = primaryBatch ? students.filter((s) => s.batchId === primaryBatch.id && s.status === "active") : [];
  const presentCount = todayAtt ? todayAtt.entries.filter((e) => e.status === "Present").length : 0;
  const attPct = batchStudents.length > 0 ? (presentCount / batchStudents.length) * 100 : 0;
  const pendingReceipts = primaryBatch ? getPendingReceipts(primaryBatch.id) : [];
  const defaulters = primaryBatch ? getDefaulters(primaryBatch.id, THIS_MONTH) : [];

  const upcomingSession = schedules
    .filter((s) => primaryBatch && s.batchId === primaryBatch.id && s.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const coachNotifs = notifications.filter((n) => n.forUserId === coachId || (!n.forUserId && n.forRole === "coach")).slice(0, 4);

  const quickActions = [
    { label: "Mark Attendance", icon: "check-square" as const, color: c.accentEmerald, route: "/attendance" },
    { label: "Performance", icon: "star" as const, color: c.accentGold, route: "/performance" },
    { label: "Verify Fees", icon: "credit-card" as const, color: c.primary500, route: "/fees" },
    { label: "Admit Student", icon: "user-plus" as const, color: c.accentViolet, route: "/roster" },
  ];

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <LinearGradient
        colors={["#0A1628", "#1A3A6E"]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Coach Dashboard</Text>
            <Text style={styles.name}>{coach?.name ?? "Coach"}</Text>
          </View>
          {primaryBatch && <StatusBadge status="Active" size="md" />}
        </View>

        {primaryBatch && (
          <View style={[styles.batchBanner, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
            <View>
              <Text style={styles.batchLabel}>Primary Batch</Text>
              <Text style={styles.batchName}>{primaryBatch.name} - {primaryBatch.ageRange}</Text>
              <Text style={styles.batchSub}>{batchStudents.length} students</Text>
            </View>
            {upcomingSession && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.batchLabel}>Next Session</Text>
                <Text style={{ color: c.accentGold, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {new Date(upcomingSession.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular" }}>{upcomingSession.time}</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [styles.actionTile, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: c.textPrimary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Today's Attendance */}
        <SectionHeader title="Today's Attendance" actionLabel="Mark Now" onAction={() => router.push("/attendance")} />
        <Card style={{ marginBottom: 16 }}>
          {!todayAtt ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontFamily: "Inter_600SemiBold", color: c.textPrimary, fontSize: 15 }}>Not marked yet</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                  {batchStudents.length} students in {primaryBatch?.name ?? "your batch"}
                </Text>
              </View>
              <Feather name="alert-circle" size={24} color={c.accentAmber} />
            </View>
          ) : (
            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", color: c.textPrimary, fontSize: 15 }}>
                  {presentCount} / {todayAtt.entries.length} Present
                </Text>
                <Text style={{ fontFamily: "Inter_700Bold", color: attPct >= 75 ? c.accentEmerald : attPct >= 50 ? c.accentAmber : c.accentRed, fontSize: 20 }}>
                  {Math.round(attPct)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${attPct}%` as any, backgroundColor: attPct >= 75 ? c.accentEmerald : attPct >= 50 ? c.accentAmber : c.accentRed }]} />
              </View>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                {["Present", "Absent", "Late"].map((status) => {
                  const count = todayAtt.entries.filter((e) => e.status === status).length;
                  const colors: Record<string, string> = { Present: c.accentEmerald, Absent: c.accentRed, Late: c.accentAmber };
                  return (
                    <View key={status} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors[status] }} />
                      <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>{status} {count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </Card>

        {/* Pending Receipts & Defaulters */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <Pressable style={({ pressed }) => [styles.summaryTile, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, flex: 1, opacity: pressed ? 0.85 : 1 }]} onPress={() => router.push("/fees")}>
            <Feather name="file-text" size={20} color={c.accentAmber} />
            <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.textPrimary, marginTop: 6 }}>{pendingReceipts.length}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>Pending Receipts</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.summaryTile, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, flex: 1, opacity: pressed ? 0.85 : 1 }]} onPress={() => router.push("/fees")}>
            <Feather name="alert-triangle" size={20} color={c.accentRed} />
            <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.textPrimary, marginTop: 6 }}>{defaulters.length}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>Defaulters</Text>
          </Pressable>
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        {coachNotifs.length === 0 ? (
          <Card>
            <Text style={{ color: c.textSecondary, textAlign: "center", fontFamily: "Inter_400Regular" }}>All caught up!</Text>
          </Card>
        ) : (
          coachNotifs.map((notif) => (
            <NotificationItem
              key={notif.id}
              title={notif.title}
              message={notif.message}
              time={new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              unread={!notif.read}
              icon="file-text"
              onPress={() => markNotificationRead(notif.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  batchBanner: { borderRadius: 14, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  batchLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.8 },
  batchName: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 2 },
  batchSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  actionTile: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  actionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: "#F1F5F9", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  summaryTile: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center" },
});
