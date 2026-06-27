import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, SectionHeader, StarRating } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { PerformanceLog } from "@/types";

const TODAY = new Date().toISOString().slice(0, 10);
const isWeb = Platform.OS === "web";

interface DisciplineState {
  na: boolean;
  skill1: number;
  skill2: number;
  skill3: number;
}

const DEFAULT_DISCIPLINE: DisciplineState = { na: false, skill1: 3, skill2: 3, skill3: 3 };

export default function PerformanceScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { coaches, students, getCoachBatches, savePerformance, getStudentPerformance } = useData();

  const coachId = currentUser?.linkedId ?? "";
  const coachBatches = getCoachBatches(coachId);
  const [selectedBatchId] = useState(coachBatches[0]?.id ?? "");
  const batchStudents = useMemo(
    () => students.filter((s) => s.batchId === selectedBatchId && s.status === "active"),
    [students, selectedBatchId]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [batting, setBatting] = useState<DisciplineState>({ ...DEFAULT_DISCIPLINE });
  const [bowling, setBowling] = useState<DisciplineState>({ ...DEFAULT_DISCIPLINE });
  const [fielding, setFielding] = useState<DisciplineState>({ ...DEFAULT_DISCIPLINE });
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedStudent = batchStudents.find((s) => s.id === selectedStudentId);
  const recentEntries = selectedStudentId ? getStudentPerformance(selectedStudentId).slice(0, 2) : [];

  const selectStudent = (id: string) => {
    setSelectedStudentId(id);
    setBatting({ ...DEFAULT_DISCIPLINE });
    setBowling({ ...DEFAULT_DISCIPLINE });
    setFielding({ ...DEFAULT_DISCIPLINE });
    setRemarks("");
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedStudentId) { Alert.alert("Select a student first"); return; }
    if (batting.na && bowling.na && fielding.na) { Alert.alert("At least one discipline must have ratings"); return; }
    setSaving(true);
    const log: PerformanceLog = {
      id: `perf-${Date.now()}`,
      studentId: selectedStudentId,
      batchId: selectedBatchId,
      coachId,
      date: TODAY,
      battingNA: batting.na,
      footwork: batting.skill1,
      shotSelection: batting.skill2,
      timing: batting.skill3,
      bowlingNA: bowling.na,
      lineAndLength: bowling.skill1,
      action: bowling.skill2,
      paceAndVariation: bowling.skill3,
      fieldingNA: fielding.na,
      catching: fielding.skill1,
      groundFielding: fielding.skill2,
      throwing: fielding.skill3,
      remarks,
    };
    await savePerformance(log);
    setSaving(false);
    setSaved(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSaved(false), 2000);
  };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>Performance Entry</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 }}>
          {new Date(TODAY).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }} keyboardShouldPersistTaps="handled">
        {/* Student Selector */}
        <SectionHeader title="Select Student" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {batchStudents.map((student) => (
              <Pressable
                key={student.id}
                onPress={() => selectStudent(student.id)}
                style={[
                  styles.studentPill,
                  { backgroundColor: selectedStudentId === student.id ? c.primary600 : c.surfaceWhite, borderColor: selectedStudentId === student.id ? c.primary500 : c.borderSubtle },
                ]}
              >
                <Avatar name={student.name} size={32} />
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: selectedStudentId === student.id ? "#fff" : c.textPrimary }}>
                  {student.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {selectedStudent && (
          <>
            {/* Batting */}
            <DisciplineSection
              title="Batting"
              icon="target"
              color={c.primary500}
              state={batting}
              onToggleNA={() => setBatting((s) => ({ ...s, na: !s.na }))}
              skills={[
                { label: "Footwork", key: "skill1" },
                { label: "Shot Selection", key: "skill2" },
                { label: "Timing", key: "skill3" },
              ]}
              onChange={(key, val) => setBatting((s) => ({ ...s, [key]: val }))}
            />

            {/* Bowling */}
            <DisciplineSection
              title="Bowling"
              icon="wind"
              color={c.accentViolet}
              state={bowling}
              onToggleNA={() => setBowling((s) => ({ ...s, na: !s.na }))}
              skills={[
                { label: "Line & Length", key: "skill1" },
                { label: "Action", key: "skill2" },
                { label: "Pace & Variation", key: "skill3" },
              ]}
              onChange={(key, val) => setBowling((s) => ({ ...s, [key]: val }))}
            />

            {/* Fielding */}
            <DisciplineSection
              title="Fielding"
              icon="shield"
              color={c.accentEmerald}
              state={fielding}
              onToggleNA={() => setFielding((s) => ({ ...s, na: !s.na }))}
              skills={[
                { label: "Catching", key: "skill1" },
                { label: "Ground Fielding", key: "skill2" },
                { label: "Throwing", key: "skill3" },
              ]}
              onChange={(key, val) => setFielding((s) => ({ ...s, [key]: val }))}
            />

            {/* Remarks */}
            <SectionHeader title="Coach Remarks" />
            <Card style={{ marginBottom: 20 }}>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Add coaching feedback for this student..."
                placeholderTextColor={c.textDisabled}
                multiline
                numberOfLines={4}
                style={{ fontSize: 14, color: c.textPrimary, fontFamily: "Inter_400Regular", minHeight: 90, textAlignVertical: "top" }}
              />
            </Card>

            {/* Recent entries */}
            {recentEntries.length > 0 && (
              <>
                <SectionHeader title="Recent Entries" />
                {recentEntries.map((entry) => (
                  <Card key={entry.id} style={{ marginBottom: 10 }} accentColor={c.primary300}>
                    <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 }}>
                      {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </Text>
                    {!entry.battingNA && (
                      <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_400Regular" }}>
                        Batting: Footwork {entry.footwork}/5 · Shot {entry.shotSelection}/5 · Timing {entry.timing}/5
                      </Text>
                    )}
                    {!entry.bowlingNA && (
                      <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_400Regular" }}>
                        Bowling: L&L {entry.lineAndLength}/5 · Action {entry.action}/5
                      </Text>
                    )}
                    {entry.remarks ? (
                      <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, fontStyle: "italic" }}>
                        "{entry.remarks}"
                      </Text>
                    ) : null}
                  </Card>
                ))}
              </>
            )}

            <Button
              onPress={handleSave}
              label={saved ? "Saved!" : "Save Performance"}
              fullWidth
              size="lg"
              loading={saving}
              icon={saved ? "check" : "save"}
            />
          </>
        )}

        {!selectedStudent && (
          <Card>
            <View style={{ alignItems: "center", padding: 24 }}>
              <Feather name="star" size={36} color={c.primary300} />
              <Text style={{ color: c.textSecondary, fontSize: 15, fontFamily: "Inter_500Medium", marginTop: 12, textAlign: "center" }}>
                Select a student above to start recording their performance
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function DisciplineSection({ title, icon, color, state, onToggleNA, skills, onChange }: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  state: DisciplineState;
  onToggleNA: () => void;
  skills: { label: string; key: "skill1" | "skill2" | "skill3" }[];
  onChange: (key: "skill1" | "skill2" | "skill3", val: number) => void;
}) {
  const c = useColors();

  return (
    <Card accentColor={color} style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.disciplineIcon, { backgroundColor: `${color}18` }]}>
            <Feather name={icon} size={16} color={color} />
          </View>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary }}>{title}</Text>
        </View>
        <Pressable
          onPress={onToggleNA}
          style={[styles.naToggle, { backgroundColor: state.na ? c.primary600 : c.primary100 }]}
        >
          <Text style={{ color: state.na ? "#fff" : c.primary700, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
            {state.na ? "N/A ✓" : "N/A"}
          </Text>
        </Pressable>
      </View>

      {!state.na && skills.map(({ label, key }) => (
        <View key={key} style={styles.skillRow}>
          <Text style={[styles.skillLabel, { color: c.textSecondary }]}>{label}</Text>
          <StarRating value={state[key]} onChange={(v) => onChange(key, v)} size={28} />
          <Text style={[styles.skillValue, { color: c.primary600 }]}>{state[key]}/5</Text>
        </View>
      ))}

      {state.na && (
        <View style={[styles.naPlaceholder, { backgroundColor: c.primary050 }]}>
          <Text style={{ color: c.textDisabled, fontFamily: "Inter_500Medium", fontSize: 13 }}>
            Not applicable for this session
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  studentPill: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  disciplineIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  naToggle: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  skillRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  skillLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  skillValue: { width: 28, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" },
  naPlaceholder: { borderRadius: 8, padding: 12, alignItems: "center" },
});
