import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { AttendanceLog, AttendanceStatus, Student } from "@/types";

const TODAY = new Date().toISOString().slice(0, 10);
const isWeb = Platform.OS === "web";

type StatusMap = Record<string, AttendanceStatus>;

const STATUS_CYCLE: AttendanceStatus[] = ["Present", "Absent", "Late"];

export default function AttendanceScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { coaches, batches, students, getCoachBatches, getTodayAttendance, submitAttendance } = useData();

  const coachId = currentUser?.linkedId ?? "";
  const coachBatches = getCoachBatches(coachId);
  const [selectedBatchId, setSelectedBatchId] = useState(coachBatches[0]?.id ?? "");
  const batchStudents = useMemo(
    () => students.filter((s) => s.batchId === selectedBatchId && s.status === "active"),
    [students, selectedBatchId]
  );

  const existingLog = getTodayAttendance(selectedBatchId, TODAY);
  const isLocked = existingLog?.isLocked ?? false;

  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initial: StatusMap = {};
    if (existingLog) {
      existingLog.entries.forEach((e) => { initial[e.studentId] = e.status as AttendanceStatus; });
    } else {
      batchStudents.forEach((s) => { initial[s.id] = "Present"; });
    }
    setStatusMap(initial);
  }, [batchStudents, selectedBatchId]);

  const toggleStatus = useCallback((studentId: string) => {
    if (isLocked) return;
    setStatusMap((prev) => {
      const current = prev[studentId] ?? "Present";
      const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
      const next = STATUS_CYCLE[nextIdx];
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { ...prev, [studentId]: next };
    });
  }, [isLocked]);

  const presentCount = Object.values(statusMap).filter((s) => s === "Present").length;
  const absentCount = Object.values(statusMap).filter((s) => s === "Absent").length;
  const lateCount = Object.values(statusMap).filter((s) => s === "Late").length;

  const handleSubmit = async () => {
    if (batchStudents.length === 0) { Alert.alert("No Students", "No students in this batch."); return; }
    setSubmitting(true);
    const log: AttendanceLog = {
      id: existingLog?.id ?? `att-${TODAY}-${selectedBatchId}`,
      batchId: selectedBatchId,
      coachId,
      date: TODAY,
      isLocked: true,
      entries: batchStudents.map((s) => ({ studentId: s.id, status: statusMap[s.id] ?? "Present" })),
    };
    await submitAttendance(log);
    setSubmitting(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Submitted", `Attendance marked for ${batchStudents.length} students.`);
  };

  const statusColor: Record<AttendanceStatus, string> = {
    Present: "#22C55E",
    Absent: "#F87171",
    Late: "#FBBF24",
    Unmarked: "#94A3B8",
  };

  const batch = batches.find((b) => b.id === selectedBatchId);
  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: "#0A1628" }}>
      {/* Outdoor Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text style={styles.screenLabel}>ATTENDANCE</Text>
            <Text style={styles.dateText}>
              {new Date(TODAY).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </Text>
          </View>
          {isLocked && (
            <View style={[styles.lockedBadge]}>
              <Feather name="lock" size={12} color="#FBBF24" />
              <Text style={{ color: "#FBBF24", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>Locked</Text>
            </View>
          )}
        </View>

        {/* Batch selector */}
        {coachBatches.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {coachBatches.map((b) => (
                <Pressable
                  key={b.id}
                  style={[styles.batchChip, { backgroundColor: selectedBatchId === b.id ? "#2563EB" : "rgba(255,255,255,0.12)" }]}
                  onPress={() => setSelectedBatchId(b.id)}
                >
                  <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{b.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Progress row */}
        <View style={styles.progressRow}>
          <AttStat label="Present" count={presentCount} color="#22C55E" />
          <AttStat label="Absent" count={absentCount} color="#F87171" />
          <AttStat label="Late" count={lateCount} color="#FBBF24" />
          <AttStat label="Total" count={batchStudents.length} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {batchStudents.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Feather name="users" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, fontFamily: "Inter_500Medium", marginTop: 12 }}>No students in this batch</Text>
          </View>
        ) : (
          batchStudents.map((student) => {
            const status = statusMap[student.id] ?? "Present";
            const color = statusColor[status];
            return (
              <StudentAttCard
                key={student.id}
                student={student}
                status={status}
                color={color}
                onToggle={() => toggleStatus(student.id)}
                statusColors={statusColor}
                isLocked={isLocked}
              />
            );
          })
        )}
      </ScrollView>

      {/* Fixed Submit Button */}
      <View style={[styles.submitArea, { paddingBottom: Math.max(insets.bottom + 16, isWeb ? 100 : 80) }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting || batchStudents.length === 0}
          style={({ pressed }) => [
            styles.submitBtn,
            { opacity: pressed || submitting || batchStudents.length === 0 ? 0.7 : 1 },
          ]}
        >
          {submitting ? (
            <Text style={styles.submitText}>Submitting...</Text>
          ) : isLocked ? (
            <>
              <Feather name="refresh-cw" size={18} color="#000" />
              <Text style={styles.submitText}>Re-Submit</Text>
            </>
          ) : (
            <>
              <Feather name="send" size={18} color="#000" />
              <Text style={styles.submitText}>Submit Attendance</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function AttStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color, fontSize: 24, fontFamily: "Inter_700Bold" }}>{count}</Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "Inter_400Regular" }}>{label}</Text>
    </View>
  );
}

function StudentAttCard({
  student, status, color, onToggle, statusColors, isLocked,
}: {
  student: Student;
  status: AttendanceStatus;
  color: string;
  onToggle: () => void;
  statusColors: Record<string, string>;
  isLocked: boolean;
}) {
  const initials = student.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <View style={[styles.studentCard, { borderLeftColor: color }]}>
      <View style={[styles.studentAvatar, { backgroundColor: `${color}25` }]}>
        <Text style={{ color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.studentSub}>{student.playingRole ?? "Player"}</Text>
      </View>
      {/* Quick status buttons */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {(["Present", "Absent", "Late"] as AttendanceStatus[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              if (!isLocked) {
                const e = require("expo-haptics");
                if (Platform.OS !== "web") e.default?.impactAsync(e.default?.ImpactFeedbackStyle?.Light);
              }
              if (!isLocked && status !== s) onToggle();
            }}
            style={[
              styles.attBtn,
              {
                backgroundColor: status === s ? statusColors[s] : "transparent",
                borderColor: statusColors[s],
              },
            ]}
          >
            <Text style={{ color: status === s ? "#000" : statusColors[s], fontFamily: "Inter_700Bold", fontSize: 11 }}>
              {s[0]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#0A1628", paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" },
  screenLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, textTransform: "uppercase" },
  dateText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 2 },
  lockedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(251,191,36,0.15)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" },
  batchChip: { paddingHorizontal: 14, height: 34, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  progressRow: { flexDirection: "row", marginTop: 16, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 },
  studentCard: { backgroundColor: "#1A3A6E", borderRadius: 14, borderLeftWidth: 4, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  studentName: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  studentSub: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  attBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  submitArea: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#0A1628", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  submitBtn: { backgroundColor: "#22C55E", borderRadius: 14, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  submitText: { color: "#000", fontFamily: "Inter_700Bold", fontSize: 17 },
});
