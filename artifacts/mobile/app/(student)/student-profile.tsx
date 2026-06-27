import { Feather } from "@expo/vector-icons";
import { prettyDate, getAge } from "@/utils/dateUtils";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, Divider } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { PlayingRole } from "@/types";

const isWeb = Platform.OS === "web";
const PLAYING_ROLES: PlayingRole[] = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];


export default function StudentProfileScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { students, batches, coaches, updateStudent } = useData();

  const studentId = currentUser?.linkedId ?? "";
  const student = students.find((s) => s.id === studentId);
  const batch = student ? batches.find((b) => b.id === student.batchId) : undefined;
  const coach = batch ? coaches.find((c) => batch.coachIds.includes(c.id)) : undefined;

  const [editMode, setEditMode] = useState(false);
  const [height, setHeight] = useState(student?.height?.toString() ?? "");
  const [weight, setWeight] = useState(student?.weight?.toString() ?? "");
  const [playingRole, setPlayingRole] = useState<PlayingRole | undefined>(student?.playingRole);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) {
      setHeight(student.height?.toString() ?? "");
      setWeight(student.weight?.toString() ?? "");
      setPlayingRole(student.playingRole);
    }
  }, [student]);

  const handleSave = async () => {
    if (!student) return;
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (height && isNaN(h)) { Alert.alert("Invalid", "Height must be a number (cm)"); return; }
    if (weight && isNaN(w)) { Alert.alert("Invalid", "Weight must be a number (kg)"); return; }
    setSaving(true);
    await updateStudent(studentId, {
      height: height ? h : undefined,
      weight: weight ? w : undefined,
      playingRole,
    });
    setSaving(false);
    setEditMode(false);
  };

  const topPad = isWeb ? 67 : insets.top;

  if (!student) return null;

  const readOnlyRows = [
    { icon: "user" as const, label: "Father's Name", value: student.fatherName },
    { icon: "calendar" as const, label: "Date of Birth", value: `${prettyDate(student.dateOfBirth)} (Age ${getAge(student.dateOfBirth)})` },
    { icon: "phone" as const, label: "Parent Mobile", value: student.parentMobile },
    { icon: "layers" as const, label: "Batch", value: batch ? `${batch.name} - ${batch.ageRange}` : "—" },
    { icon: "user-check" as const, label: "Coach", value: coach?.name ?? "—" },
    { icon: "shield" as const, label: "Railway Staff", value: student.isRailway ? `Yes (${student.designation ?? "Staff"})` : "No" },
    { icon: "home" as const, label: "Address", value: student.address || "—" },
    { icon: "credit-card" as const, label: "Admission Date", value: prettyDate(student.dateOfAdmission) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <LinearGradient
        colors={["#0A1628", "#1A3A6E"]}
        style={[styles.header, { paddingTop: topPad + 24 }]}
      >
        <Avatar name={student.name} size={80} uri={student.photo} />
        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.batchLabel}>{batch?.name} - {batch?.ageRange}</Text>
        <View style={[styles.idChip, { borderColor: "rgba(245,158,11,0.3)", backgroundColor: "rgba(245,158,11,0.15)" }]}>
          <Text style={{ color: "#F59E0B", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
            Login: {currentUser?.loginId}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }} showsVerticalScrollIndicator={false}>
        {/* Editable Section */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary }}>My Details</Text>
          <Pressable
            style={[styles.editBtn, { backgroundColor: editMode ? c.primary500 : c.primary100 }]}
            onPress={() => { if (editMode) handleSave(); else setEditMode(true); }}
          >
            <Feather name={editMode ? "check" : "edit-2"} size={14} color={editMode ? "#fff" : c.primary700} />
            <Text style={{ color: editMode ? "#fff" : c.primary700, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
              {editMode ? "Save" : "Edit"}
            </Text>
          </Pressable>
        </View>

        <Card style={{ marginBottom: 14 }}>
          {/* Playing Role */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Playing Role</Text>
            {editMode ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PLAYING_ROLES.map((role) => (
                  <Pressable
                    key={role}
                    style={{ borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: playingRole === role ? c.primary600 : c.primary100 }}
                    onPress={() => setPlayingRole(role)}
                  >
                    <Text style={{ color: playingRole === role ? "#fff" : c.primary700, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                      {role}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: c.textPrimary }}>{student.playingRole ?? "Not set"}</Text>
            )}
          </View>

          <Divider />

          {/* Height */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 }}>
            <View>
              <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 }}>Height</Text>
              {editMode ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <View style={{ backgroundColor: c.primary100, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, width: 90 }}>
                    <Text
                      style={{ color: c.textPrimary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}
                      suppressHighlighting
                    >
                      {height || "—"}
                    </Text>
                  </View>
                  <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>cm</Text>
                </View>
              ) : (
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: c.textPrimary, marginTop: 2 }}>
                  {student.height ? `${student.height} cm` : "Not set"}
                </Text>
              )}
            </View>
            {editMode && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[140, 150, 160, 170].map((h) => (
                  <Pressable key={h} style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: parseInt(height) === h ? c.primary600 : c.primary100 }} onPress={() => setHeight(h.toString())}>
                    <Text style={{ color: parseInt(height) === h ? "#fff" : c.primary700, fontFamily: "Inter_500Medium", fontSize: 12 }}>{h}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Divider />

          {/* Weight */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 }}>
            <View>
              <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 }}>Weight</Text>
              {editMode ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <View style={{ backgroundColor: c.primary100, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, width: 90 }}>
                    <Text style={{ color: c.textPrimary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>{weight || "—"}</Text>
                  </View>
                  <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>kg</Text>
                </View>
              ) : (
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: c.textPrimary, marginTop: 2 }}>
                  {student.weight ? `${student.weight} kg` : "Not set"}
                </Text>
              )}
            </View>
            {editMode && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[30, 40, 50, 60].map((w) => (
                  <Pressable key={w} style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: parseInt(weight) === w ? c.primary600 : c.primary100 }} onPress={() => setWeight(w.toString())}>
                    <Text style={{ color: parseInt(weight) === w ? "#fff" : c.primary700, fontFamily: "Inter_500Medium", fontSize: 12 }}>{w}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </Card>

        {/* Contact admin notice */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.primary100, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: c.primary300 }}>
          <Feather name="info" size={16} color={c.primary600} />
          <Text style={{ flex: 1, color: c.primary700, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18 }}>
            To update your details or profile photo, please contact your admin.
          </Text>
        </View>

        {/* Read-only info */}
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary, marginBottom: 10 }}>Academic Info</Text>
        <Card style={{ marginBottom: 14 }}>
          {readOnlyRows.map((row, i) => (
            <View key={i}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 }}>
                <View style={[styles.rowIcon, { backgroundColor: c.primary100 }]}>
                  <Feather name={row.icon} size={14} color={c.primary600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 }}>{row.label}</Text>
                  <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 }}>{row.value}</Text>
                </View>
              </View>
              {i < readOnlyRows.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        <View style={{ marginTop: 8 }}>
          <Button onPress={() => logout()} label="Sign Out" variant="danger" fullWidth icon="log-out" />
        </View>
        <Text style={{ textAlign: "center", color: c.textDisabled, fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 20 }}>Cricket360 v1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 32, alignItems: "center" },
  name: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 14 },
  batchLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  idChip: { marginTop: 10, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
