import { Feather } from "@expo/vector-icons";
import { fromDisplayDate } from "@/utils/dateUtils";
import React, { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Divider, EmptyState, FormInput, SectionHeader, StatusBadge } from "@/components/ui";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { Schedule } from "@/types";

const isWeb = Platform.OS === "web";
const SESSION_TYPES: Schedule["type"][] = ["Practice", "Match", "Tournament"];

export default function BatchesScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { batches, students, coaches, schedules, attendanceLogs, addSchedule, deleteSchedule, unlockAttendance } = useData();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const topPad = isWeb ? 67 : insets.top;

  const getBatchData = (batchId: string) => ({
    studentCount: students.filter((s) => s.batchId === batchId && s.status === "active").length,
    coach: coaches.find((c) => batches.find((b) => b.id === batchId)?.coachIds.includes(c.id)),
    upcomingSchedules: schedules
      .filter((s) => s.batchId === batchId && s.date >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date)),
  });

  const batchColors = {
    "batch-a": c.accentEmerald,
    "batch-b": c.primary500,
    "batch-c": c.accentViolet,
  } as Record<string, string>;

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>Batches & Schedule</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 }}>
          {batches.length} training groups
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }}>
        {batches.map((batch) => {
          const { studentCount, coach, upcomingSchedules } = getBatchData(batch.id);
          const color = batchColors[batch.id] ?? c.primary500;
          const isSelected = selectedBatch === batch.id;

          return (
            <View key={batch.id} style={{ marginBottom: 16 }}>
              <Pressable
                style={({ pressed }) => [styles.batchCard, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, borderLeftColor: color, opacity: pressed ? 0.9 : 1 }]}
                onPress={() => setSelectedBatch(isSelected ? null : batch.id)}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 17, color: c.textPrimary }}>{batch.name} — {batch.label}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                      {batch.ageRange} · {coach?.name ?? "No coach"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color }}>
                      {studentCount}
                    </Text>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>students</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <Text style={{ color: c.textDisabled, fontSize: 12, fontFamily: "Inter_400Regular" }}>
                    {upcomingSchedules.length} upcoming session{upcomingSchedules.length !== 1 ? "s" : ""}
                  </Text>
                  <Feather name={isSelected ? "chevron-up" : "chevron-down"} size={16} color={c.textDisabled} />
                </View>
              </Pressable>

              {isSelected && (
                <View style={[styles.schedulePanel, { backgroundColor: c.surfaceCard, borderColor: c.borderSubtle }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <SectionHeader title="Upcoming Sessions" />
                    <Pressable
                      style={[styles.addSessionBtn, { backgroundColor: color }]}
                      onPress={() => { setSelectedBatch(batch.id); setShowAddSession(true); }}
                    >
                      <Feather name="plus" size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Add</Text>
                    </Pressable>
                  </View>

                  {upcomingSchedules.length === 0 ? (
                    <EmptyState icon="calendar" title="No upcoming sessions" />
                  ) : (
                    upcomingSchedules.map((session, i) => (
                      <View key={session.id}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <StatusBadge status={session.type} />
                            </View>
                            <Text style={{ color: c.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 4 }}>
                              {new Date(session.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {session.time}
                            </Text>
                            <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                              {session.venue}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => Alert.alert("Delete Session", "Remove this session?", [
                              { text: "Cancel" },
                              { text: "Delete", style: "destructive", onPress: () => deleteSchedule(session.id) },
                            ])}
                          >
                            <Feather name="trash-2" size={16} color={c.accentRed} />
                          </Pressable>
                        </View>
                        {i < upcomingSchedules.length - 1 && <Divider />}
                      </View>
                    ))
                  )}

                  {/* Attendance Logs */}
                  {(() => {
                    const batchLogs = attendanceLogs
                      .filter((a) => a.batchId === batch.id)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 7);
                    if (batchLogs.length === 0) return null;
                    return (
                      <View style={{ marginTop: 16 }}>
                        <Divider />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, marginBottom: 10 }}>
                          <Feather name="check-square" size={14} color={c.textSecondary} />
                          <Text style={{ color: c.textSecondary, fontFamily: "Inter_700Bold", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.4 }}>Attendance Logs</Text>
                        </View>
                        {batchLogs.map((log, i) => {
                          const presentCount = log.entries.filter((e) => e.status === "Present").length;
                          return (
                            <View key={log.id}>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: c.textPrimary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                                    {new Date(log.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                  </Text>
                                  <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                                    {presentCount}/{log.entries.length} present
                                  </Text>
                                </View>
                                {log.isLocked ? (
                                  <Pressable
                                    style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.4)", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                                    onPress={() => Alert.alert("Unlock Attendance", `Unlock attendance for ${new Date(log.date).toLocaleDateString("en-IN")}? The coach will be able to edit it again.`, [
                                      { text: "Cancel" },
                                      { text: "Unlock", onPress: () => unlockAttendance(log.id) },
                                    ])}
                                  >
                                    <Feather name="unlock" size={13} color="#D97706" />
                                    <Text style={{ color: "#D97706", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>Unlock</Text>
                                  </Pressable>
                                ) : (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                    <Feather name="edit-2" size={13} color={c.accentEmerald} />
                                    <Text style={{ color: c.accentEmerald, fontFamily: "Inter_500Medium", fontSize: 12 }}>Editable</Text>
                                  </View>
                                )}
                              </View>
                              {i < batchLogs.length - 1 && <Divider />}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showAddSession} animationType="slide" presentationStyle="formSheet">
        <AddSessionModal
          batchId={selectedBatch ?? ""}
          onClose={() => setShowAddSession(false)}
          onSave={(session) => { addSchedule(session); setShowAddSession(false); }}
        />
      </Modal>
    </View>
  );
}

function AddSessionModal({ batchId, onClose, onSave }: { batchId: string; onClose: () => void; onSave: (s: Schedule) => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<Schedule["type"]>("Practice");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("06:00 AM");
  const [venue, setVenue] = useState("Main Ground, DSA");

  const handleSave = () => {
    if (!date || !time) { Alert.alert("Required", "Date and time are required."); return; }
    const session: Schedule = {
      id: `sch-${Date.now()}`,
      batchId,
      type,
      date: fromDisplayDate(date),
      time,
      venue,
      isRecurring: false,
    };
    onSave(session);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.modalHeader, { paddingTop: insets.top + 16, backgroundColor: c.primary900 }]}>
        <Pressable onPress={onClose}><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>Add Session</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 14 }}>
        <View>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>Session Type</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {SESSION_TYPES.map((t) => (
              <Pressable key={t} style={[styles.typeChip, { backgroundColor: type === t ? c.primary600 : c.primary100 }]} onPress={() => setType(t)}>
                <Text style={{ color: type === t ? "#fff" : c.primary700, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <FormInput label="Date (DD/MM/YYYY) *" value={date} onChangeText={setDate} placeholder="e.g. 01/07/2026" icon="calendar" />
        <FormInput label="Time" value={time} onChangeText={setTime} placeholder="e.g. 06:00 AM" icon="clock" />
        <FormInput label="Venue" value={venue} onChangeText={setVenue} icon="map-pin" />
        <Button onPress={handleSave} label="Save Session" fullWidth size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  batchCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, padding: 16, marginBottom: 4 },
  schedulePanel: { borderWidth: 1, borderTopWidth: 0, borderRadius: 14, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 16 },
  addSessionBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  typeChip: { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
});
