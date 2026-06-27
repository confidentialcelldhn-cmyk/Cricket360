import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, Divider, EmptyState, FormInput, StatusBadge } from "@/components/ui";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { Coach } from "@/types";

const isWeb = Platform.OS === "web";

export default function CoachesScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { coaches, batches, deactivateCoach, addCoach, updateCoach, uploadStudentPhoto } = useData();
  const [selected, setSelected] = useState<Coach | null>(null);
  const [editTarget, setEditTarget] = useState<Coach | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const topPad = isWeb ? 67 : insets.top;

  const CoachCard = ({ item }: { item: Coach }) => {
    const coachBatches = batches.filter((b) => item.batchIds.includes(b.id));
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => setSelected(item)}
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar name={item.name} size={48} uri={item.photo} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary }}>{item.name}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 }}>{item.designation}</Text>
            <Text style={{ color: c.textDisabled, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 }}>
              {coachBatches.map((b) => b.name).join(", ") || "No batch"}
            </Text>
          </View>
          <StatusBadge status={item.status === "active" ? "Active" : "Inactive"} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.title}>Coaches</Text>
          <Pressable style={[styles.addBtn, { backgroundColor: c.accentGold }]} onPress={() => setShowAdd(true)}>
            <Feather name="user-plus" size={16} color="#000" />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13 }}>Add</Text>
          </Pressable>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 }}>
          {coaches.filter((c) => c.status === "active").length} active coaches
        </Text>
      </View>

      <FlatList
        data={coaches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90, gap: 10 }}
        renderItem={({ item }) => <CoachCard item={item} />}
        ListEmptyComponent={<EmptyState icon="user-check" title="No coaches yet" subtitle="Add your first coach" onAction={() => setShowAdd(true)} actionLabel="Add Coach" />}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <CoachDetailModal
            coach={selected}
            batches={batches}
            onClose={() => setSelected(null)}
            onEdit={() => { setEditTarget(selected); setSelected(null); }}
            onDeactivate={() => { deactivateCoach(selected.id); setSelected(null); }}
          />
        )}
      </Modal>

      <Modal visible={!!editTarget} animationType="slide" presentationStyle="pageSheet">
        {editTarget && (
          <EditCoachModal
            coach={editTarget}
            batches={batches}
            onClose={() => setEditTarget(null)}
            onSave={async (updates: Partial<Coach>) => { await updateCoach(editTarget.id, updates); setEditTarget(null); }}
            uploadStudentPhoto={uploadStudentPhoto}
          />
        )}
      </Modal>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <AddCoachModal
          batches={batches}
          onClose={() => setShowAdd(false)}
          onSave={(coach: Coach, user: any) => { addCoach(coach, user); setShowAdd(false); }}
          uploadStudentPhoto={uploadStudentPhoto}
        />
      </Modal>
    </View>
  );
}

function CoachDetailModal({ coach, batches, onClose, onEdit, onDeactivate }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useData();
  const coachBatches = batches.filter((b: any) => coach.batchIds.includes(b.id));

  const handleResetPassword = () => {
    Alert.alert(
      "Reset Password",
      `Reset ${coach.name}'s password to Coach@123? They will be asked to change it on next login.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetPassword(coach.userId, "coach");
              Alert.alert("Done", "Password reset to Coach@123. Coach must change it on next login.");
            } catch (e) {
              Alert.alert("Error", "Could not reset password. Please try again.");
            }
          },
        },
      ]
    );
  };
  const rows = [
    { label: "HRMS ID", value: coach.hrmsId },
    { label: "Designation", value: coach.designation },
    { label: "Mobile", value: coach.mobile },
    { label: "Email", value: coach.email || "—" },
    { label: "Batches", value: coachBatches.map((b: any) => `${b.name} (${b.ageRange})`).join(", ") || "None" },
    { label: "Member Since", value: new Date(coach.createdAt).toLocaleDateString("en-IN") },
    { label: "Status", value: coach.status === "active" ? "Active" : "Inactive" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.modalHeader, { paddingTop: insets.top + 16, backgroundColor: c.primary900 }]}>
        <Pressable onPress={onClose}><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>Coach Profile</Text>
        <Pressable onPress={onEdit} style={{ width: 32, alignItems: "center" }}>
          <Feather name="edit-2" size={18} color={c.accentGold} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Avatar name={coach.name} size={72} uri={coach.photo} />
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: c.textPrimary, marginTop: 12 }}>{coach.name}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 }}>{coach.designation}</Text>
        </View>
        <Card>
          {rows.map((row, i) => (
            <View key={i}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 }}>{row.label}</Text>
                <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" }}>{row.value}</Text>
              </View>
              {i < rows.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
        <View style={{ marginTop: 20, gap: 10 }}>
          <Button onPress={onEdit} label="Edit Coach Details" variant="secondary" fullWidth icon="edit-2" />
          <Button onPress={handleResetPassword} label="Reset Password" variant="secondary" fullWidth icon="key" />
          {coach.status === "active" && (
            <Button onPress={onDeactivate} label="Deactivate Coach" variant="danger" fullWidth icon="user-x" />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function EditCoachModal({ coach, batches, onClose, onSave, uploadStudentPhoto }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | undefined>(coach.photo);
  const [form, setForm] = useState({
    name: coach.name,
    designation: coach.designation,
    hrmsId: coach.hrmsId,
    mobile: coach.mobile,
    email: coach.email ?? "",
    batchId: coach.batchIds[0] ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.mobile || !form.hrmsId) {
      Alert.alert("Required", "Name, Mobile, and HRMS ID are required.");
      return;
    }
    setSaving(true);
    let photoUrl: string | undefined = photo;
    if (photo && photo !== coach.photo && photo.startsWith("data:image")) {
      const uploaded = await uploadStudentPhoto(coach.id, photo);
      photoUrl = uploaded ?? photo;
    }
    await onSave({
      name: form.name.trim(),
      designation: form.designation.trim(),
      hrmsId: form.hrmsId.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim() || undefined,
      photo: photoUrl,
      batchIds: form.batchId ? [form.batchId] : [],
    });
    setSaving(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.modalHeader, { paddingTop: insets.top + 16, backgroundColor: c.primary900 }]}>
        <Pressable onPress={onClose}><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>Edit Coach</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80, gap: 14 }}>
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <Pressable onPress={() => pickCoachPhoto(setPhoto)}>
            {photo ? (
              <View style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", borderWidth: 3, borderColor: c.primary300 }}>
                <Image source={{ uri: photo }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              </View>
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.primary100, borderWidth: 2, borderColor: c.primary300, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }}>
                <Feather name="camera" size={28} color={c.primary500} />
                <Text style={{ color: c.primary600, fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 4 }}>Change Photo</Text>
              </View>
            )}
          </Pressable>
          {photo && (
            <Pressable onPress={() => setPhoto(undefined)} style={{ marginTop: 6 }}>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>Remove photo</Text>
            </Pressable>
          )}
        </View>

        <FormInput label="Full Name *" value={form.name} onChangeText={(v) => set("name", v)} icon="user" />
        <FormInput label="Designation" value={form.designation} onChangeText={(v) => set("designation", v)} icon="briefcase" />
        <FormInput label="HRMS ID *" value={form.hrmsId} onChangeText={(v) => set("hrmsId", v)} icon="hash" />
        <FormInput label="Mobile * (Login ID)" value={form.mobile} onChangeText={(v) => set("mobile", v)} keyboardType="phone-pad" icon="phone" />
        <FormInput label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" icon="mail" />
        <View>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>Assign Batch</Text>
          {batches.map((b: any) => (
            <Pressable key={b.id} style={[styles.batchOption, { borderColor: form.batchId === b.id ? c.primary500 : c.borderSubtle, backgroundColor: form.batchId === b.id ? c.primary050 : c.surfaceWhite }]} onPress={() => set("batchId", b.id)}>
              <Text style={{ fontFamily: "Inter_600SemiBold", color: form.batchId === b.id ? c.primary700 : c.textPrimary }}>{b.name} - {b.ageRange}</Text>
            </Pressable>
          ))}
        </View>
        <Button onPress={handleSave} label="Save Changes" fullWidth size="lg" loading={saving} />
      </ScrollView>
    </View>
  );
}

async function pickCoachPhoto(onPicked: (uri: string) => void) {
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

function AddCoachModal({ batches, onClose, onSave, uploadStudentPhoto }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({ name: "", designation: "Coach", hrmsId: "", mobile: "", email: "", batchId: batches[0]?.id ?? "" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.mobile || !form.hrmsId) {
      Alert.alert("Required", "Name, Mobile, and HRMS ID are required.");
      return;
    }
    const id = `coach-${Date.now()}`;
    let photoUrl: string | null = photo ?? null;
    if (photo && photo.startsWith("data:image")) {
      photoUrl = await uploadStudentPhoto(id, photo);
    }
    const coach: Coach = {
      id, userId: `user-${id}`, name: form.name.trim(), designation: form.designation.trim(),
      hrmsId: form.hrmsId.trim(), mobile: form.mobile.trim(), email: form.email.trim(),
      photo: photoUrl ?? undefined,
      batchIds: form.batchId ? [form.batchId] : [], status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onSave(coach, { id: `user-${id}`, name: form.name.trim(), role: "coach", loginId: form.mobile.trim(), password: "Coach@123", isFirstLogin: true, status: "active", linkedId: id });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.modalHeader, { paddingTop: insets.top + 16, backgroundColor: c.primary900 }]}>
        <Pressable onPress={onClose}><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 17, flex: 1, textAlign: "center" }}>Add Coach</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80, gap: 14 }}>

        {/* Photo */}
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <Pressable onPress={() => pickCoachPhoto(setPhoto)}>
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

        <FormInput label="Full Name *" value={form.name} onChangeText={(v) => set("name", v)} icon="user" />
        <FormInput label="Designation" value={form.designation} onChangeText={(v) => set("designation", v)} icon="briefcase" />
        <FormInput label="HRMS ID *" value={form.hrmsId} onChangeText={(v) => set("hrmsId", v)} icon="hash" />
        <FormInput label="Mobile * (Login ID)" value={form.mobile} onChangeText={(v) => set("mobile", v)} keyboardType="phone-pad" icon="phone" />
        <FormInput label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" icon="mail" />
        <View>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>Assign Batch</Text>
          {batches.map((b: any) => (
            <Pressable key={b.id} style={[styles.batchOption, { borderColor: form.batchId === b.id ? c.primary500 : c.borderSubtle, backgroundColor: form.batchId === b.id ? c.primary050 : c.surfaceWhite }]} onPress={() => set("batchId", b.id)}>
              <Text style={{ fontFamily: "Inter_600SemiBold", color: form.batchId === b.id ? c.primary700 : c.textPrimary }}>{b.name} - {b.ageRange}</Text>
            </Pressable>
          ))}
        </View>
        <Button onPress={handleSave} label="Save Coach" fullWidth size="lg" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  batchOption: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 8 },
});
