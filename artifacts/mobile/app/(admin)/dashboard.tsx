import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Card, NotificationItem, SectionHeader, StatCard, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

const THIS_MONTH = "2026-06";
const isWeb = Platform.OS === "web";

export default function AdminDashboard() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { students, coaches, batches, financialLogs, attendanceLogs, notifications, markNotificationRead, deleteNotification } = useData();
  const router = useRouter();

  const stats = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "active").length;
    const activeCoaches = coaches.filter((c) => c.status === "active").length;
    const monthFees = financialLogs.filter((f) => f.billingMonth === THIS_MONTH);
    const paidFees = monthFees.filter((f) => f.status === "Paid").length;
    const feeRate = activeStudents > 0 ? Math.round((paidFees / activeStudents) * 100) : 0;
    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = attendanceLogs.filter((a) => a.date === today);
    const totalPresent = todayLogs.reduce((s, l) => s + l.entries.filter((e) => e.status === "Present").length, 0);
    const totalMarked = todayLogs.reduce((s, l) => s + l.entries.length, 0);
    return { activeStudents, activeCoaches, feeRate, paidFees, totalPresent, totalMarked };
  }, [students, coaches, financialLogs, attendanceLogs]);

  const recentNotifications = useMemo(
    () => notifications.filter((n) => n.forRole === "admin").slice(0, 5),
    [notifications]
  );

  const unreadCount = recentNotifications.filter((n) => !n.read).length;

  const quickActions = [
    { label: "Students", icon: "users" as const, color: c.primary600, route: "/students" },
    { label: "Coaches", icon: "user-check" as const, color: c.accentEmerald, route: "/coaches" },
    { label: "Batches", icon: "layers" as const, color: c.accentViolet, route: "/batches" },
    { label: "Reports", icon: "bar-chart-2" as const, color: c.accentAmber, route: "/reports" },
  ];

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      {/* Header */}
      <LinearGradient
        colors={["#0A1628", "#1A3A6E"]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome Back 👋</Text>
            <Text style={styles.userName}>{currentUser?.name ?? "Admin"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
            <Avatar name={currentUser?.name ?? "A"} size={42} />
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.activeCoaches}</Text>
            <Text style={styles.statLabel}>Coaches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.feeRate}%</Text>
            <Text style={styles.statLabel}>Fees Paid</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{batches.length}</Text>
            <Text style={styles.statLabel}>Batches</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.actionTile,
                { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: c.textPrimary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Batch Overview */}
        <SectionHeader title="Batch Overview" actionLabel="View All" onAction={() => router.push("/batches")} />
        <View style={{ gap: 10, marginBottom: 20 }}>
          {batches.map((batch) => {
            const batchStudents = students.filter((s) => s.batchId === batch.id && s.status === "active").length;
            const batchCoach = batch.coachIds[0];
            return (
              <Card key={batch.id} onPress={() => router.push("/batches")}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>
                      {batch.name} - {batch.ageRange}
                    </Text>
                    <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 2, fontFamily: "Inter_400Regular" }}>
                      {batchStudents} students
                    </Text>
                  </View>
                  <StatusBadge status="Active" />
                </View>
              </Card>
            );
          })}
        </View>

        {/* Recent Notifications */}
        <SectionHeader title="Notifications" />
        {recentNotifications.length === 0 ? (
          <Card>
            <Text style={{ color: c.textSecondary, textAlign: "center", fontFamily: "Inter_400Regular" }}>
              No notifications
            </Text>
          </Card>
        ) : (
          <View>
            {recentNotifications.map((notif) => (
              <Swipeable
                key={notif.id}
                renderRightActions={() => (
                  <Pressable 
                    onPress={() => deleteNotification(notif.id)}
                    style={{ backgroundColor: c.accentRed, justifyContent: "center", alignItems: "center", width: 70, borderRadius: 12, marginBottom: 10, marginLeft: 10 }}
                  >
                    <Feather name="trash-2" size={20} color="#fff" />
                  </Pressable>
                )}
              >
                <NotificationItem
                  title={notif.title}
                  message={notif.message}
                  time={new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  unread={!notif.read}
                  icon={notif.type === "age_boundary" ? "alert-triangle" : notif.type === "new_admission" ? "user-plus" : "bell"}
                  onPress={() => markNotificationRead(notif.id)}
                />
              </Swipeable>
            ))}
          </View>
        )}

        {/* Logout */}
        <Pressable
          onPress={() => logout()}
          style={({ pressed }) => [styles.logoutBtn, { borderColor: c.borderSubtle, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="log-out" size={16} color={c.accentRed} />
          <Text style={{ color: c.accentRed, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  notifBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center" },
  notifBadgeText: { color: "#000", fontSize: 11, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: 4 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  actionTile: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center", gap: 10 },
  actionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, height: 48, marginTop: 8 },
});
