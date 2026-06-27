import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, FormInput, SectionHeader } from "@/components/ui";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

const isWeb = Platform.OS === "web";

export default function SettingsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, uploadQrPhoto, isOnline, useSupabase, toggleSupabase } = useData();
  const [form, setForm] = useState({ ...settings });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const topPad = isWeb ? 67 : insets.top;

  useEffect(() => { setForm({ ...settings }); }, [settings]);

  const set = (key: keyof typeof form) => (val: string | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.upiId || !form.feeAmount) {
      Alert.alert("Required", "UPI ID and Fee Amount are required.");
      return;
    }
    setLoading(true);
    await updateSettings(form);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePickQr = async () => {
    if (isWeb) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const result = ev.target?.result;
          if (typeof result === "string") {
            setQrLoading(true);
            const url = await uploadQrPhoto(result);
            if (url) await updateSettings({ ...form, qrCodeUrl: url });
            setQrLoading(false);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow photo library access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setQrLoading(true);
      const url = await uploadQrPhoto(dataUri);
      if (url) await updateSettings({ ...form, qrCodeUrl: url });
      setQrLoading(false);
    }
  };

  const handleRemoveQr = async () => {
    await updateSettings({ ...form, qrCodeUrl: undefined });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>Settings</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 }}>
          System configuration
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }}>
        {/* Supabase Toggle */}
        <SectionHeader title="Database Mode" />
        <View style={[styles.section, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>
                {useSupabase ? "Supabase Cloud" : "Local Storage"}
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
                {useSupabase
                  ? `Connected ${isOnline ? "(Online)" : "(Offline — local fallback)"}`
                  : "All data stored on this device only"}
              </Text>
            </View>
            <Switch
              value={useSupabase}
              onValueChange={toggleSupabase}
              trackColor={{ false: c.borderSubtle, true: c.primary500 }}
              thumbColor="#fff"
            />
          </View>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: c.textDisabled }}>
            {useSupabase
              ? "Data is synced to the Supabase cloud database. Photos upload to cloud storage."
              : "All data stays on this device. No internet required. Good for testing."}
          </Text>
        </View>

        {/* Academy Info */}
        <SectionHeader title="Academy Information" />
        <View style={[styles.section, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
          <FormInput label="Academy Name" value={form.academyName} onChangeText={set("academyName")} icon="home" />
          <FormInput label="Address" value={form.academyAddress} onChangeText={set("academyAddress")} icon="map-pin" multiline />
          <FormInput label="Phone" value={form.academyPhone} onChangeText={set("academyPhone")} keyboardType="phone-pad" icon="phone" />
          <FormInput label="Email" value={form.academyEmail} onChangeText={set("academyEmail")} keyboardType="email-address" autoCapitalize="none" icon="mail" />
        </View>

        {/* Fee Settings */}
        <SectionHeader title="Fee Configuration" />
        <View style={[styles.section, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
          <View>
            <Text style={{ fontSize: 12, color: c.textSecondary, fontFamily: "Inter_500Medium", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
              MONTHLY FEE AMOUNT (₹)
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.primary100, borderRadius: 12, paddingHorizontal: 14, height: 52 }}>
              <Feather name="dollar-sign" size={18} color={c.textDisabled} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.textPrimary }}>{form.feeAmount}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {[1000, 1500, 2000].map((amt) => (
                <Button key={amt} onPress={() => setForm((f) => ({ ...f, feeAmount: amt }))} label={`₹${amt}`} variant={form.feeAmount === amt ? "primary" : "secondary"} size="sm" />
              ))}
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: c.borderSubtle, marginVertical: 8 }} />

          <FormInput label="UPI ID" value={form.upiId} onChangeText={set("upiId")} autoCapitalize="none" icon="credit-card" />
          <FormInput label="Beneficiary Name" value={form.beneficiaryName} onChangeText={set("beneficiaryName")} icon="user" />
        </View>

        {/* Payment QR Code */}
        <SectionHeader title="Payment QR Code" />
        <View style={[styles.section, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
          <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12 }}>
            Upload your UPI QR code so students can scan and pay directly from the app.
          </Text>
          {settings.qrCodeUrl ? (
            <View style={{ alignItems: "center", gap: 12 }}>
              <View style={{ borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: c.borderSubtle }}>
                <Image source={{ uri: settings.qrCodeUrl }} style={{ width: 200, height: 200 }} resizeMode="contain" />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button onPress={handlePickQr} label="Change QR" variant="secondary" size="sm" icon="refresh-cw" loading={qrLoading} />
                <Button onPress={handleRemoveQr} label="Remove" variant="danger" size="sm" icon="trash-2" />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handlePickQr}
              style={{ borderRadius: 14, borderWidth: 2, borderColor: c.primary300, borderStyle: "dashed", alignItems: "center", padding: 28, gap: 10 }}
            >
              {qrLoading ? (
                <Text style={{ color: c.primary500, fontFamily: "Inter_500Medium", fontSize: 14 }}>Uploading…</Text>
              ) : (
                <>
                  <Feather name="upload" size={28} color={c.primary400} />
                  <Text style={{ color: c.primary600, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Upload QR Code Image</Text>
                  <Text style={{ color: c.textDisabled, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                    Tap to select your UPI QR code from gallery
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* WhatsApp */}
        <SectionHeader title="Communication" />
        <View style={[styles.section, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
          <FormInput label="WhatsApp Group Invite Link" value={form.whatsappGroupLink ?? ""} onChangeText={set("whatsappGroupLink")} autoCapitalize="none" icon="message-circle" />
        </View>

        {/* Save */}
        <View style={{ marginTop: 8 }}>
          <Button onPress={handleSave} label={saved ? "Saved!" : "Save Settings"} fullWidth size="lg" loading={loading} icon={saved ? "check" : "save"} />
        </View>

        {/* Version info */}
        <View style={{ alignItems: "center", marginTop: 24, gap: 4 }}>
          <Feather name="activity" size={24} color={c.primary400} />
          <Text style={{ color: c.textDisabled, fontFamily: "Inter_400Regular", fontSize: 12 }}>Cricket360 v1.0</Text>
          <Text style={{ color: c.textDisabled, fontFamily: "Inter_400Regular", fontSize: 11 }}>DSA Dhanbad — Powered by ❤️</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14, marginBottom: 16 },
});
