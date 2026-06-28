import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, Divider, EmptyState, FormInput, StatusBadge } from "@/components/ui";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { Student } from "@/types";
import { fromDisplayDate, toDisplayDate, getAge } from "@/utils/dateUtils";

const isWeb = Platform.OS === "web";



export default function StudentsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { students, batches, deactivateStudent, reactivateStudent, transferBatch, addStudent, updateStudent, uploadStudentPhoto, isStudentOverAge } = useData();

  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState<string | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"active" | "inactive" | "all">("active");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterBatch !== "all" && s.batchId !== filterBatch) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.parentMobile.includes(search)) return false;
      return true;
    });
  }, [students, search, filterBatch, filterStatus]);

  const topPad = isWeb ? 67 : insets.top;

  const StudentCard = ({ item }: { item: Student }) => {
    const batch = batches.find((b) => b.id === item.batchId);
    const overAge = isStudentOverAge(item);
    return (
      <Pressable
        style={({ pressed }) => [styles.studentCard, { backgroundColor: c.surfaceWhite, borderColor: overAge ? c.accentRed : c.borderSubtle, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => setSelectedStudent(item)}
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar name={item.name} size={44} uri={item.photo} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: c.textPrimary }}>{item.name}</Text>
              {item.isRailway && <Feather name="shield" size={12} color={c.primary500} />}
            </View>
            <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 }}>
              Age {getAge(item.dateOfBirth)} · {batch?.name} - {batch?.ageRange} · {item.playingRole ?? "Role N/A"}
            </Text>
            <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 }}>
              {item.parentMobile}
            </Text>
            {overAge && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                <Feather name="alert-triangle" size={11} color={c.accentRed} />
                <Text style={{ color: c.accentRed, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                  Over-age — transfer recommended
                </Text>
              </View>
            )}
          </View>
          <StatusBadge status={item.status === "active" ? "Active" : "Inactive"} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.title}>Students</Text>
          <Pressable
            style={[styles.addBtn, { backgroundColor: c.accentGold }]}
            onPress={() => setShowAddModal(true)}
          >
            <Feather name="user-plus" size={16} color="#000" />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13 }}>Admit</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or mobile..."
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        {/* Filter row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["all", ...batches.map((b) => b.id)].map((id) => {
              const label = id === "all" ? "All Batches" : batches.find((b) => b.id === id)?.name ?? id;
              return (
                <Pressable
                  key={id}
                  style={[styles.filterChip, { backgroundColor: filterBatch === id ? c.accentGold : "rgba(255,255,255,0.12)", borderColor: filterBatch === id ? c.accentGold : "transparent" }]}
                  onPress={() => setFilterBatch(id)}
                >
                  <Text style={[styles.filterChipText, { color: filterBatch === id ? "#000" : "rgba(255,255,255,0.8)" }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
            {["all", "active", "inactive"].map((s) => (
              <Pressable
                key={s + "-status"}
                style={[styles.filterChip, { backgroundColor: filterStatus === s ? c.primary400 : "rgba(255,255,255,0.12)" }]}
                onPress={() => setFilterStatus(s as any)}
              >
                <Text style={[styles.filterChipText, { color: filterStatus === s ? "#fff" : "rgba(255,255,255,0.8)" }]}>
                  {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Student count */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium" }}>
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: isWeb ? 100 : 90, gap: 10 }}
        renderItem={({ item }) => <StudentCard item={item} />}
        ListEmptyComponent={
          <EmptyState icon="users" title="No students found" subtitle="Try adjusting your search or filters" />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled
      />

      {/* Student Detail Modal */}
      <Modal visible={!!selectedStudent} animationType="slide" presentationStyle="pageSheet">
        {selectedStudent && (
          <StudentDetailModal
            student={selectedStudent}
            batches={batches}
            onClose={() => setSelectedStudent(null)}
            onEdit={() => { setEditingStudent(selectedStudent); setSelectedStudent(null); }}
            onDeactivate={() => {
              deactivateStudent(selectedStudent.id);
              setSelectedStudent(null);
            }}
            onReactivate={() => {
              reactivateStudent(selectedStudent.id);
              setSelectedStudent(null);
            }}
            onTransfer={(batchId: string) => {
              transferBatch(selectedStudent.id, batchId);
              setSelectedStudent(null);
            }}
          />
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal visible={!!editingStudent} animationType="slide" presentationStyle="pageSheet">
        {editingStudent && (
          <EditStudentModal
            student={editingStudent}
            batches={batches}
            onClose={() => setEditingStudent(null)}
            onSave={async (updates: Partial<Student>) => {
              await updateStudent(editingStudent.id, updates);
              setEditingStudent(null);
            }}
            uploadStudentPhoto={uploadStudentPhoto}
          />
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <AddStudentModal
          batches={batches}
          onClose={() => setShowAddModal(false)}
          onSave={(student: Student, user: any) => {
            addStudent(student, user);
            setShowAddModal(false);
          }}
          uploadStudentPhoto={uploadStudentPhoto}
        />
      </Modal>
    </View>
  );
}

function StudentDetailModal({ student, batches, onClose, onDeactivate, onReactivate, onTransfer, onEdit }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { resetPassword, deleteStudent } = useData();
  const [showTransfer, setShowTransfer] = useState(false);

  const handleResetPassword = () => {
    Alert.alert(
      "Reset Password",
      `Reset ${student.name}'s password to Student@123? They will be asked to change it on next login.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetPassword(student.userId, "student");
              Alert.alert("Done", "Password reset to Student@123. Student must change it on next login.");
            } catch (e) {
              Alert.alert("Error", "Could not reset password. Please try again.");
            }
          },
        },
      ]
    );
  };
  const batch = batches.find((b: any) => b.id === student.batchId);

  const rows = [
    { label: "Father's Name", value: student.fatherName },
    { label: "Date of Birth", value: student.dateOfBirth },
    { label: "Age", value: `${getAge(student.dateOfBirth)} years` },
    { label: "Gender", value: student.gender },
    { label: "Parent Mobile", value: student.parentMobile },
    student.whatsappNo ? { label: "WhatsApp No.", value: student.whatsappNo } : null,
    student.email ? { label: "Email", value: student.email } : null,
    { label: "Address", value: student.address },
    { label: "Batch", value: batch ? `${batch.name} - ${batch.ageRange}` : "—" },
    { label: "Playing Role", value: student.playingRole ?? "Not set" },
    { label: "Railway Staff", value: student.isRailway ? "Yes" : "No" },
    student.isRailway && student.designation ? { label: "Designation", value: student.designation } : null,
    student.isRailway && student.department ? { label: "Department", value: student.department } : null,
    student.isRailway && student.pfNo ? { label: "PF No.", value: student.pfNo } : null,
    { label: "Date of Registration", value: student.dateOfRegistration },
    { label: "Registration Fees", value: `₹${student.registrationFees}` },
    { label: "Date of Admission", value: student.dateOfAdmission },
    { label: "Admission Fees", value: `₹${student.admissionFees}` },
    { label: "Status", value: student.status },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.modalHeader, { paddingTop: insets.top + 16, backgroundColor: c.primary900 }]}>
        <Pressable onPress={onClose} style={{ padding: 4 }}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>
          Student Profile
        </Text>
        <Pressable onPress={onEdit} style={{ padding: 4 }}>
          <Feather name="edit-2" size={20} color="#F59E0B" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Avatar name={student.name} size={80} uri={student.photo} />
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: c.textPrimary, marginTop: 12 }}>
            {student.name}
          </Text>
          <StatusBadge status={student.status === "active" ? "Active" : "Inactive"} size="md" />
        </View>

        <Card>
          {rows.map((row, i) => (
            <View key={i}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 }}>
                  {row.label}
                </Text>
                <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" }}>
                  {row.value}
                </Text>
              </View>
              {i < rows.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        <View style={{ gap: 10, marginTop: 20 }}>
          <Button onPress={handleResetPassword} label="Reset Password" variant="secondary" fullWidth icon="key" />
          {student.status === "active" ? (
            <>
              <Button onPress={() => setShowTransfer(true)} label="Transfer Batch" variant="secondary" fullWidth icon="repeat" />
              <Button onPress={onDeactivate} label="Deactivate Student" variant="danger" fullWidth icon="user-x" />
            </>
          ) : (
            <Button onPress={onReactivate} label="Reactivate Student" variant="primary" fullWidth icon="user-check" />
          )}
          <Button
            onPress={() => Alert.alert(
              "Delete Student Permanently",
              `This will permanently delete ${student.name} and all their data. This cannot be undone.\n\nType DELETE to confirm.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Permanently",
                  style: "destructive",
                  onPress: async () => {
                    await deleteStudent(student.id);
                    onClose();
                  },
                },
              ]
            )}
            label="Delete Permanently"
            variant="danger"
            fullWidth
            icon="trash-2"
          />
        </View>

        {showTransfer && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", color: c.textPrimary, marginBottom: 8 }}>Transfer to:</Text>
            {batches.filter((b: any) => b.id !== student.batchId).map((b: any) => (
              <Pressable
                key={b.id}
                style={[styles.batchOption, { borderColor: c.borderSubtle, backgroundColor: c.surfaceWhite }]}
                onPress={() => { onTransfer(b.id); setShowTransfer(false); }}
              >
                <Text style={{ fontFamily: "Inter_600SemiBold", color: c.primary700 }}>{b.name} - {b.ageRange}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>{label}</Text>
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

function AddStudentModal({ batches, onClose, onSave, uploadStudentPhoto }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().slice(0, 10);

  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({
    name: "", dob: "", fatherName: "", gender: "Male",
    parentMobile: "", whatsappNo: "", email: "", address: "",
    batchId: batches[0]?.id ?? "", isRailway: false,
    designation: "", department: "", pfNo: "",
    dateOfRegistration: toDisplayDate(today), registrationFees: "500",
    dateOfAdmission: toDisplayDate(today), admissionFees: "1000",
    playingRole: "Batsman",
  });

  const set = (key: string, val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name || !form.dob || !form.parentMobile || !form.fatherName) {
      Alert.alert("Required", "Name, Date of Birth, Father's Name, and Parent Mobile are required.");
      return;
    }
    if (!form.batchId) {
      Alert.alert("Required", "Please select a batch.");
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
      dateOfBirth: form.dob.trim(),
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
      batchId: form.batchId,
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
      <View style={[styles.modalHeader, { paddingTop: insets.top + 16, backgroundColor: c.primary900 }]}>
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
        <FormInput label="Date of Birth * (DD/MM/YYYY)" value={form.dob} onChangeText={(v) => set("dob", v)} placeholder="e.g. 15/03/2016" icon="calendar" keyboardType="numbers-and-punctuation" />
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
        <FormInput label="Date of Registration * (DD/MM/YYYY)" value={form.dateOfRegistration} onChangeText={(v) => set("dateOfRegistration", v)} icon="calendar" keyboardType="numbers-and-punctuation" placeholder="e.g. 01/07/2026" />
        <FormInput label="Registration Fees (₹)" value={form.registrationFees} onChangeText={(v) => set("registrationFees", v)} keyboardType="number-pad" icon="credit-card" />
        <FormInput label="Date of Admission * (DD/MM/YYYY)" value={form.dateOfAdmission} onChangeText={(v) => set("dateOfAdmission", v)} icon="calendar" keyboardType="numbers-and-punctuation" placeholder="e.g. 01/07/2026" />
        <FormInput label="Admission Fees (₹)" value={form.admissionFees} onChangeText={(v) => set("admissionFees", v)} keyboardType="number-pad" icon="credit-card" />

        <SectionLabel label="Batch Assignment" />
        {batches.map((b: any) => (
          <Pressable
            key={b.id}
            style={[styles.batchOption, { borderColor: form.batchId === b.id ? c.primary500 : c.borderSubtle, backgroundColor: form.batchId === b.id ? c.primary050 : c.surfaceWhite }]}
            onPress={() => set("batchId", b.id)}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", color: form.batchId === b.id ? c.primary700 : c.textPrimary }}>{b.name} - {b.ageRange}</Text>
          </Pressable>
        ))}

        <Button onPress={handleSave} label="Save & Admit" fullWidth size="lg" />
      </ScrollView>
    </View>
  );
}

function EditStudentModal({ student, batches, onClose, onSave, uploadStudentPhoto }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [photo, setPhoto] = useState<string | undefined>(student.photo);
  const [form, setForm] = useState({
    name: student.name ?? "",
    dob: toDisplayDate(student.dateOfBirth ?? ""),
    fatherName: student.fatherName ?? "",
    gender: student.gender ?? "Male",
    parentMobile: student.parentMobile ?? "",
    whatsappNo: student.whatsappNo ?? "",
    email: student.email ?? "",
    address: student.address ?? "",
    batchId: student.batchId ?? batches[0]?.id ?? "",
    isRailway: student.isRailway ?? false,
    designation: student.designation ?? "",
    department: student.department ?? "",
    pfNo: student.pfNo ?? "",
    dateOfRegistration: toDisplayDate(student.dateOfRegistration ?? ""),
    registrationFees: String(student.registrationFees ?? 500),
    dateOfAdmission: toDisplayDate(student.dateOfAdmission ?? ""),
    admissionFees: String(student.admissionFees ?? 1000),
    playingRole: student.playingRole ?? "Batsman",
  });

  const set = (key: string, val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name || !form.dob || !form.parentMobile || !form.fatherName) {
      Alert.alert("Required", "Name, Date of Birth, Father's Name, and Parent Mobile are required.");
      return;
    }
    let photoUrl: string | null = photo ?? null;
    if (photo && photo.startsWith("data:image") && photo !== student.photo) {
      photoUrl = await uploadStudentPhoto(student.id, photo);
    } else if (photo && !photo.startsWith("data:image")) {
      photoUrl = photo;
    }
    await onSave({
      name: form.name.trim(),
      dateOfBirth: form.dob.trim(),
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
      batchId: form.batchId,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.modalHeader, { paddingTop: insets.top + 16, backgroundColor: c.primary900 }]}>
        <Pressable onPress={onClose}><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>Edit Student</Text>
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
                <Text style={{ color: c.primary600, fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 4 }}>Update Photo</Text>
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
        <FormInput label="Date of Birth * (DD/MM/YYYY)" value={form.dob} onChangeText={(v) => set("dob", v)} placeholder="e.g. 15/03/2016" icon="calendar" keyboardType="numbers-and-punctuation" />
        <FormInput label="Father's Name *" value={form.fatherName} onChangeText={(v) => set("fatherName", v)} icon="users" />
        <RadioGroup label="Gender" options={["Male", "Female", "Other"]} value={form.gender} onChange={(v) => set("gender", v)} />

        <SectionLabel label="Contact Details" />
        <FormInput label="Parent Mobile * (Login ID)" value={form.parentMobile} onChangeText={(v) => set("parentMobile", v)} keyboardType="phone-pad" icon="phone" />
        <FormInput label="WhatsApp No." value={form.whatsappNo} onChangeText={(v) => set("whatsappNo", v)} keyboardType="phone-pad" icon="message-circle" />
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
        <FormInput label="Date of Registration (DD/MM/YYYY)" value={form.dateOfRegistration} onChangeText={(v) => set("dateOfRegistration", v)} icon="calendar" keyboardType="numbers-and-punctuation" placeholder="e.g. 01/07/2026" />
        <FormInput label="Registration Fees (₹)" value={form.registrationFees} onChangeText={(v) => set("registrationFees", v)} keyboardType="number-pad" icon="credit-card" />
        <FormInput label="Date of Admission (DD/MM/YYYY)" value={form.dateOfAdmission} onChangeText={(v) => set("dateOfAdmission", v)} icon="calendar" keyboardType="numbers-and-punctuation" placeholder="e.g. 01/07/2026" />
        <FormInput label="Admission Fees (₹)" value={form.admissionFees} onChangeText={(v) => set("admissionFees", v)} keyboardType="number-pad" icon="credit-card" />

        <SectionLabel label="Batch Assignment" />
        {batches.map((b: any) => (
          <Pressable
            key={b.id}
            style={[styles.batchOption, { borderColor: form.batchId === b.id ? c.primary500 : c.borderSubtle, backgroundColor: form.batchId === b.id ? c.primary050 : c.surfaceWhite }]}
            onPress={() => set("batchId", b.id)}
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", color: form.batchId === b.id ? c.primary700 : c.textPrimary }}>{b.name} - {b.ageRange}</Text>
          </Pressable>
        ))}

        <Button onPress={handleSave} label="Save Changes" fullWidth size="lg" />
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
  filterChip: { paddingHorizontal: 12, height: 30, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  studentCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  batchOption: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 8 },
});
