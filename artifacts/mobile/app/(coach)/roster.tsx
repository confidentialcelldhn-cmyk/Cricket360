import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, EmptyState, FormInput, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { Student } from "@/types";
import { fromDisplayDate, getAge, toDisplayDate } from "@/utils/dateUtils";

const isWeb = Platform.OS === "web";

async function pickPhoto(onPicked: (uri: string) => void) {
  if (Platform.OS === "web") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === "string") onPicked(result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPicked(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  }
}

function SectionLabel({ label }: { label: string }) {
  const c = useColors();
  return (
    <Text style={{ color: c.primary700, fontFamily: "Inter_700Bold", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8, marginBottom: 4 }}>
      {label}
    </Text>
  );
}

function RadioGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const c = useColors();
  return (
    <View>
      {label ? <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>{label}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: value === opt ? c.primary500 : c.borderSubtle, backgroundColor: value === opt ? c.primary050 : c.surfaceWhite }}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: value === opt ? c.primary700 : c.textSecondary }}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function RosterScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { students, batches, coaches, addStudent, getCoachBatches, uploadStudentPhoto } = useData();

  const coachId = currentUser?.linkedId ?? "";
  const coachBatches = getCoachBatches(coachId);
  const primaryBatch = coachBatches[0];

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const batchStudents = useMemo(() => {
    return students.filter((s) => {
      if (primaryBatch && s.batchId !== primaryBatch.id) return false;
      if (s.status !== "active") return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [students, primaryBatch, search]);

  const topPad = isWeb ? 67 : insets.top;

  const StudentCard = ({ item }: { item: Student }) => (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => setSelectedStudent(item)}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={item.name} size={44} uri={item.photo} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>{item.name}</Text>
            {item.isRailway && <Feather name="shield" size={12} color={c.primary500} />}
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 }}>
            Age {getAge(item.dateOfBirth)} · {item.playingRole ?? "Role N/A"}
          </Text>
          <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 }}>
            {item.parentMobile}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={c.textDisabled} />
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={styles.title}>My Students</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 }}>
              {primaryBatch?.name} - {primaryBatch?.ageRange} · {batchStudents.length} active
            </Text>
          </View>
          <Pressable style={[styles.addBtn, { backgroundColor: c.accentGold }]} onPress={() => setShowAdd(true)}>
            <Feather name="user-plus" size={16} color="#000" />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13 }}>Admit</Text>
          </Pressable>
        </View>

        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search students..."
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={batchStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90, gap: 10 }}
        renderItem={({ item }) => <StudentCard item={item} />}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={search ? "No results" : "No students yet"}
            subtitle={search ? "Try a different name" : "Admit your first student"}
            actionLabel={!search ? "Admit Student" : undefined}
            onAction={!search ? () => setShowAdd(true) : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <AddStudentModal
          batchId={primaryBatch?.id ?? ""}
          onClose={() => setShowAdd(false)}
          onSave={(student: Student, user: any) => { addStudent(student, user); setShowAdd(false); }}
          uploadStudentPhoto={uploadStudentPhoto}
        />
      </Modal>

      <Modal visible={!!selectedStudent} animationType="slide" presentationStyle="pageSheet">
        {selectedStudent && (
          <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </Modal>
    </View>
  );
}

function AddStudentModal({ batchId, onClose, onSave, uploadStudentPhoto }: { batchId: string; onClose: () => void; onSave: (s: Student, u: any) => void; uploadStudentPhoto: (id: string, photo: string) => Promise<string | null> }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayDisplay = toDisplayDate(todayIso);

  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({
    name: "", dob: "", fatherName: "", gender: "Male",
    parentMobile: "", whatsappNo: "", email: "", address: "",
    isRailway: false, designation: "", department: "", pfNo: "",
    dateOfRegistration: todayDisplay, registrationFees: "500",
    dateOfAdmission: todayDisplay, admissionFees: "1000",
    playingRole: "Batsman",
  });

  const set = (key: string, val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name || !form.dob || !form.parentMobile || !form.fatherName) {
      Alert.alert("Required", "Name, Date of Birth, Father's Name, and Parent Mobile are required.");
      return;
    }
    const id = `stu-${Date.now()}`;
    let photoUrl: string | null = photo ?? null;
    if (photo && photo.startsWith("data:image")) {
      photoUrl = await uploadStudentPhoto(id, photo);
    }
    const student: Student = {
      id,
      userId: `user-${id}`,
      name: form.name.trim(),
      dateOfBirth: fromDisplayDate(form.dob.trim()),
      fatherName: form.fatherName.trim(),
      isRailway: form.isRailway,
      designation: form.isRailway ? form.designation.trim() : undefined,
      department: form.isRailway ? form.department.trim() : undefined,
      pfNo: form.isRailway ? form.pfNo.trim() : undefined,
      gender: form.gender as any,
      parentMobile: form.parentMobile.trim(),
      whatsappNo: form.whatsappNo.trim() || form.parentMobile.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      dateOfRegistration: fromDisplayDate(form.dateOfRegistration),
      registrationFees: parseFloat(form.registrationFees) || 500,
      dateOfAdmission: fromDisplayDate(form.dateOfAdmission),
      admissionFees: parseFloat(form.admissionFees) || 1000,
      playingRole: form.playingRole as any,
      photo: photoUrl ?? undefined,
      batchId,
      status: "active",
    };
    onSave(student, {
      id: `user-${id}`,
      name: form.name.trim(),
      role: "student",
      loginId: form.parentMobile.trim(),
      password: "Student@123",
      isFirstLogin: true,
      status: "active",
      linkedId: id,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, paddingTop: insets.top + 16, backgroundColor: c.primary900, gap: 8 }}>
        <Pressable onPress={onClose}><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>Admit New Student</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80, gap: 14 }}>

        {/* Photo */}
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <Pressable onPress={() => pickPhoto(setPhoto)}>
            {photo ? (
              <View style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", borderWidth: 3, borderColor: c.primary300 }}>
                <Image source={{ uri: photo }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              </View>
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.primary100, borderWidth: 2, borderColor: c.primary300, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }}>
                <Feather name="camera" size={28} color={c.primary500} />
                <Text style={{ color: c.primary600, fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 4 }}>Add Photo</Text>
              </View>
            )}
          </Pressable>
          {photo && (
            <Pressable onPress={() => setPhoto(undefined)} style={{ marginTop: 6 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>Remove photo</Text>
            </Pressable>
          )}
        </View>

        <SectionLabel label="Personal Details" />
        <FormInput label="Full Name *" value={form.name} onChangeText={(v) => set("name", v)} icon="user" />
        <FormInput label="Date of Birth * (DD/MM/YYYY)" value={form.dob} onChangeText={(v) => set("dob", v)} placeholder="e.g. 15/03/2016" icon="calendar" />
        <FormInput label="Father's Name *" value={form.fatherName} onChangeText={(v) => set("fatherName", v)} icon="users" />
        <RadioGroup label="Gender" options={["Male", "Female", "Other"]} value={form.gender} onChange={(v) => set("gender", v)} />

        <SectionLabel label="Contact Details" />
        <FormInput label="Parent Mobile * (Login ID)" value={form.parentMobile} onChangeText={(v) => set("parentMobile", v)} keyboardType="phone-pad" icon="phone" />
        <FormInput label="WhatsApp No." value={form.whatsappNo} onChangeText={(v) => set("whatsappNo", v)} keyboardType="phone-pad" icon="message-circle" placeholder="Same as mobile if blank" />
        <FormInput label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" icon="mail" />
        <FormInput label="Residential Address" value={form.address} onChangeText={(v) => set("address", v)} icon="map-pin" />

        <SectionLabel label="Railway Details" />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: c.surfaceWhite, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.borderSubtle }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Feather name="shield" size={16} color={form.isRailway ? c.primary500 : c.textDisabled} />
            <Text style={{ fontFamily: "Inter_600SemiBold", color: form.isRailway ? c.primary700 : c.textPrimary, fontSize: 14 }}>Railway Staff</Text>
          </View>
          <Pressable
            onPress={() => set("isRailway", !form.isRailway)}
            style={{ width: 48, height: 26, borderRadius: 13, backgroundColor: form.isRailway ? c.primary500 : c.borderSubtle, justifyContent: "center", paddingHorizontal: 2 }}
          >
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: form.isRailway ? "flex-end" : "flex-start" }} />
          </Pressable>
        </View>
        {form.isRailway && (
          <>
            <FormInput label="Designation" value={form.designation} onChangeText={(v) => set("designation", v)} icon="briefcase" />
            <FormInput label="Department" value={form.department} onChangeText={(v) => set("department", v)} icon="grid" />
            <FormInput label="PF No." value={form.pfNo} onChangeText={(v) => set("pfNo", v)} icon="hash" />
          </>
        )}

        <SectionLabel label="Playing Role" />
        <RadioGroup label="" options={["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"]} value={form.playingRole} onChange={(v) => set("playingRole", v)} />

        <SectionLabel label="Admission Details" />
        <FormInput label="Date of Registration * (DD/MM/YYYY)" value={form.dateOfRegistration} onChangeText={(v) => set("dateOfRegistration", v)} placeholder="e.g. 01/06/2026" icon="calendar" />
        <FormInput label="Registration Fees (₹)" value={form.registrationFees} onChangeText={(v) => set("registrationFees", v)} keyboardType="number-pad" icon="credit-card" />
        <FormInput label="Date of Admission * (DD/MM/YYYY)" value={form.dateOfAdmission} onChangeText={(v) => set("dateOfAdmission", v)} placeholder="e.g. 01/06/2026" icon="calendar" />
        <FormInput label="Admission Fees (₹)" value={form.admissionFees} onChangeText={(v) => set("admissionFees", v)} keyboardType="number-pad" icon="credit-card" />

        <Button onPress={handleSave} label="Save & Admit" fullWidth size="lg" />
      </ScrollView>
    </View>
  );
}

function StudentDetailModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { batches, coaches } = useData();

  const batch = batches.find((b) => b.id === student.batchId);
  const coach = batch ? coaches.find((c) => batch.coachIds.includes(c.id)) : undefined;

  const rows = [
    { label: "Father's Name", value: student.fatherName },
    { label: "Date of Birth", value: toDisplayDate(student.dateOfBirth) },
    { label: "Age", value: `${getAge(student.dateOfBirth)} years` },
    { label: "Parent Mobile", value: student.parentMobile },
    { label: "Playing Role", value: student.playingRole ?? "Not set" },
    { label: "Coach", value: coach?.name ?? "Not assigned" },
    { label: "Batch", value: batch ? `${batch.name} - ${batch.ageRange}` : "—" },
    { label: "Height", value: student.height ? `${student.height} cm` : "Not set" },
    { label: "Weight", value: student.weight ? `${student.weight} kg` : "Not set" },
    { label: "Railway Staff", value: student.isRailway ? "Yes" : "No" },
    { label: "Date of Admission", value: student.dateOfAdmission ? toDisplayDate(student.dateOfAdmission) : "—" },
    { label: "Admission Fees", value: student.admissionFees ? `₹${student.admissionFees}` : "—" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, paddingTop: insets.top + 16, backgroundColor: c.primary900, gap: 8 }}>
        <Pressable onPress={onClose}><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>Student Profile</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Avatar name={student.name} size={72} uri={student.photo} />
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: c.textPrimary, marginTop: 12 }}>{student.name}</Text>
          <StatusBadge status={student.playingRole ?? "Player"} size="md" />
        </View>
        <Card>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.borderSubtle }}>
              <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 }}>{row.label}</Text>
              <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" }}>{row.value}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, paddingHorizontal: 12, height: 42, marginTop: 12 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
});
