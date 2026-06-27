import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, SectionHeader, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

const THIS_MONTH = "2026-06";
const TODAY = "2026-06-23";
const isWeb = Platform.OS === "web";

export default function StudentHomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const {
    students, batches, coaches, schedules,
    getStudentFeeStatus, getStudentPerformance,
    attendanceLogs,
  } = useData();
  const router = useRouter();

  const studentId = currentUser?.linkedId ?? "";
  const student = students.find((s) => s.id === studentId);
  const batch = student ? batches.find((b) => b.id === student.batchId) : undefined;
  const coach = batch ? coaches.find((c) => batch.coachIds.includes(c.id)) : undefined;

  const feeStatus = getStudentFeeStatus(studentId, THIS_MONTH);
  const perfLogs = getStudentPerformance(studentId).slice(0, 3);
  const latestPerf = perfLogs[0];

  const upcomingSession = useMemo(() => {
    if (!student) return undefined;
    return schedules
      .filter((s) => s.batchId === student.batchId && s.date >= TODAY)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [schedules, student]);

  // Attendance stats for this student
  const attStats = useMemo(() => {
    if (!student) return { present: 0, total: 0 };
    const batchLogs = attendanceLogs.filter((a) => a.batchId === student.batchId);
    const present = batchLogs.reduce((s, log) => {
      const entry = log.entries.find((e) => e.studentId === studentId);
      return s + (entry?.status === "Present" ? 1 : 0);
    }, 0);
    const total = batchLogs.filter((l) => l.entries.some((e) => e.studentId === studentId)).length;
    return { present, total };
  }, [attendanceLogs, student, studentId]);

  const topPad = isWeb ? 67 : insets.top;

  const feeStatusColor = {
    Paid: c.accentEmerald,
    Pending: c.accentAmber,
    Unpaid: c.accentRed,
    Rejected: c.accentRed,
  }[(feeStatus?.status ?? "Unpaid")] ?? c.accentRed;

  if (!student) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <LinearGradient
        colors={["#0A1628", "#1A3A6E"]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <Text style={styles.greeting}>Welcome back 🏏</Text>
        <Text style={styles.name}>{student.name}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <StatusBadge status={batch?.name ?? "Group"} />
          <StatusBadge status={student.playingRole ?? "Player"} />
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{attStats.present}</Text>
            <Text style={styles.statLabel}>Sessions Attended</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {attStats.total > 0 ? `${Math.round((attStats.present / attStats.total) * 100)}%` : "—"}
            </Text>
            <Text style={styles.statLabel}>Attendance Rate</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{perfLogs.length}</Text>
            <Text style={styles.statLabel}>Ratings</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }} showsVerticalScrollIndicator={false}>
        {/* Upcoming Session */}
        <SectionHeader title="Next Session" actionLabel="All Sessions" onAction={() => router.push("/schedule")} />
        {upcomingSession ? (
          <Card accentColor={upcomingSession.type === "Practice" ? c.primary500 : upcomingSession.type === "Match" ? c.accentViolet : c.accentGold} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <StatusBadge status={upcomingSession.type} size="sm" />
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary, marginTop: 8 }}>
                  {new Date(upcomingSession.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 2 }}>
                  {upcomingSession.time}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Feather name="map-pin" size={14} color={c.textDisabled} />
                <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right", maxWidth: 120 }}>
                  {upcomingSession.venue}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ color: c.textSecondary, textAlign: "center", fontFamily: "Inter_400Regular" }}>No upcoming sessions</Text>
          </Card>
        )}

        {/* Fee Status */}
        <SectionHeader title="Monthly Fee" actionLabel="Pay Now" onAction={() => router.push("/payment")} />
        <Pressable onPress={() => router.push("/payment")} style={({ pressed }) => [styles.feeCard, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, opacity: pressed ? 0.85 : 1 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[styles.feeIcon, { backgroundColor: `${feeStatusColor}15` }]}>
              <Feather name="credit-card" size={22} color={feeStatusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>June 2026 Fee</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                ₹1,500 monthly
              </Text>
              {feeStatus?.status === "Rejected" && (
                <Text style={{ color: c.accentRed, fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 4 }}>
                  Rejected: {feeStatus.rejectionNote?.slice(0, 60)}...
                </Text>
              )}
            </View>
            <StatusBadge status={feeStatus?.status ?? "Unpaid"} size="md" />
          </View>
        </Pressable>

        {/* Latest Performance */}
        <SectionHeader title="Latest Rating" actionLabel="Full Report" onAction={() => router.push("/student-performance")} />
        {latestPerf ? (
          <Card accentColor={c.accentGold} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", color: c.textSecondary, fontSize: 13 }}>
                {new Date(latestPerf.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>{coach?.name ?? "Coach"}</Text>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {!latestPerf.battingNA && (
                <SkillMini label="Batting" score={(latestPerf.footwork + latestPerf.shotSelection + latestPerf.timing) / 3} color={c.primary500} />
              )}
              {!latestPerf.bowlingNA && (
                <SkillMini label="Bowling" score={(latestPerf.lineAndLength + latestPerf.action + latestPerf.paceAndVariation) / 3} color={c.accentViolet} />
              )}
              {!latestPerf.fieldingNA && (
                <SkillMini label="Fielding" score={(latestPerf.catching + latestPerf.groundFielding + latestPerf.throwing) / 3} color={c.accentEmerald} />
              )}
            </View>

            {latestPerf.remarks && (
              <View style={[styles.remarkBox, { backgroundColor: c.primary050, borderColor: c.borderSubtle }]}>
                <Feather name="message-circle" size={14} color={c.primary500} />
                <Text style={{ flex: 1, color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" }}>
                  "{latestPerf.remarks}"
                </Text>
              </View>
            )}
          </Card>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ color: c.textSecondary, textAlign: "center", fontFamily: "Inter_400Regular" }}>No performance ratings yet</Text>
          </Card>
        )}

        {/* Coach info */}
        {coach && (
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[styles.coachAvatar, { backgroundColor: c.primary700 }]}>
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>{coach.name.split(" ").map((w) => w[0]).join("").toUpperCase()}</Text>
              </View>
              <View>
                <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 }}>Your Coach</Text>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>{coach.name}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>{coach.designation}</Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function SkillMini({ label, score, color }: { label: string; score: number; color: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color }}>{score.toFixed(1)}</Text>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: c.textSecondary, marginTop: 2 }}>{label}</Text>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: c.borderSubtle, width: "100%", marginTop: 4, overflow: "hidden" }}>
        <View style={{ height: "100%", borderRadius: 2, backgroundColor: color, width: `${(score / 5) * 100}%` }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  greeting: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 4 },
  statsRow: { flexDirection: "row", borderRadius: 14, padding: 14, marginTop: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
  feeCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  feeIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  remarkBox: { flexDirection: "row", gap: 8, marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  coachAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
