import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import React, { useRef, useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Divider, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

const THIS_MONTH = "2026-06";
const MONTH_LABEL = "June 2026";
const isWeb = Platform.OS === "web";

const HISTORY_MONTHS = [
  { key: "2026-05", label: "May 2026" },
  { key: "2026-04", label: "April 2026" },
];

export default function PaymentScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { settings, getStudentFeeStatus, uploadReceipt } = useData();

  const studentId = currentUser?.linkedId ?? "";
  const feeLog = getStudentFeeStatus(studentId, THIS_MONTH);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inlineMsg, setInlineMsg] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const topPad = isWeb ? 67 : insets.top;

  const showMsg = (type: "info" | "success" | "error", text: string) => {
    setInlineMsg({ type, text });
    setTimeout(() => setInlineMsg(null), 4000);
  };

  const handleUpiPay = () => {
    if (isWeb) {
      showMsg("info", `UPI ID: ${settings.upiId}  |  Pay ₹${settings.feeAmount} to ${settings.beneficiaryName} using any UPI app, then upload your screenshot below.`);
      return;
    }
    const url = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.beneficiaryName)}&am=${settings.feeAmount}&tn=${encodeURIComponent(`Cricket360 Monthly Fee ${MONTH_LABEL}`)}`;
    Linking.openURL(url).catch(() =>
      showMsg("error", `UPI app not found. Pay manually to UPI ID: ${settings.upiId}`)
    );
  };

  const handleWebFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uri = URL.createObjectURL(file);
    setReceiptUri(uri);
    showMsg("success", "Screenshot selected! Tap Submit to send for verification.");
  };

  const handlePickImage = async () => {
    if (isWeb) {
      fileInputRef.current?.click();
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showMsg("error", "Please allow access to your photo library in settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: false });
    if (!result.canceled && result.assets[0]) setReceiptUri(result.assets[0].uri);
  };

  const handleCameraCapture = async () => {
    if (isWeb) {
      showMsg("info", "Camera is not available on web. Use the Gallery button to upload a screenshot.");
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { showMsg("error", "Please allow camera access in settings."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (!result.canceled && result.assets[0]) setReceiptUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!receiptUri && !isWeb) { showMsg("error", "Please upload your payment screenshot first."); return; }
    setUploading(true);
    await uploadReceipt(studentId, THIS_MONTH, settings.feeAmount, receiptUri ?? undefined);
    setUploading(false);
    setSubmitted(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showMsg("success", "Receipt submitted! Your coach will verify it shortly.");
  };

  const status = feeLog?.status ?? "Unpaid";
  const msgColors = {
    info: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#93C5FD", icon: "info" as const },
    success: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#34D399", icon: "check-circle" as const },
    error: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#F87171", icon: "alert-circle" as const },
  };

  const statusIcon = (s: string) => {
    if (s === "Paid") return { icon: "check-circle" as const, color: "#34D399" };
    if (s === "Pending") return { icon: "clock" as const, color: "#FBBF24" };
    if (s === "Rejected") return { icon: "alert-circle" as const, color: "#F87171" };
    return { icon: "circle" as const, color: "#6B7280" };
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      {isWeb && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleWebFileChange as unknown as React.ChangeEventHandler<HTMLInputElement>}
        />
      )}

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>Monthly Fee</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>{MONTH_LABEL}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }} showsVerticalScrollIndicator={false}>

        {inlineMsg && (
          <View style={[styles.msgBanner, { backgroundColor: msgColors[inlineMsg.type].bg, borderColor: msgColors[inlineMsg.type].border }]}>
            <Feather name={msgColors[inlineMsg.type].icon} size={16} color={msgColors[inlineMsg.type].text} />
            <Text style={{ color: msgColors[inlineMsg.type].text, fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 }}>{inlineMsg.text}</Text>
          </View>
        )}

        {/* Current Month Card */}
        <View style={[styles.amountCard, { backgroundColor: c.primary900, borderColor: c.primary700 }]}>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular" }}>Amount Due</Text>
          <Text style={{ color: "#fff", fontSize: 48, fontFamily: "Inter_700Bold", marginTop: 4 }}>₹{settings.feeAmount.toLocaleString("en-IN")}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" }}>
            <StatusBadge status={submitted ? "Pending" : status} size="md" />
            {feeLog?.submittedAt && !submitted && (
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_400Regular" }}>
                Submitted {new Date(feeLog.submittedAt).toLocaleDateString("en-IN")}
              </Text>
            )}
          </View>

          {!submitted && status === "Paid" && (
            <View style={[styles.statusMsg, { backgroundColor: "rgba(16,185,129,0.2)", borderColor: "rgba(16,185,129,0.3)" }]}>
              <Feather name="check-circle" size={16} color="#34D399" />
              <Text style={{ color: "#34D399", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                Payment verified on {feeLog?.verifiedAt ? new Date(feeLog.verifiedAt).toLocaleDateString("en-IN") : "—"}
              </Text>
            </View>
          )}
          {!submitted && status === "Pending" && (
            <View style={[styles.statusMsg, { backgroundColor: "rgba(251,191,36,0.2)", borderColor: "rgba(251,191,36,0.3)" }]}>
              <Feather name="clock" size={16} color="#FBBF24" />
              <Text style={{ color: "#FBBF24", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>Receipt under review by your coach</Text>
            </View>
          )}
          {!submitted && status === "Rejected" && feeLog?.rejectionNote && (
            <View style={[styles.statusMsg, { backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.3)" }]}>
              <Feather name="alert-circle" size={16} color="#F87171" />
              <Text style={{ color: "#F87171", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 }}>Rejected: {feeLog.rejectionNote}</Text>
            </View>
          )}
          {submitted && (
            <View style={[styles.statusMsg, { backgroundColor: "rgba(251,191,36,0.2)", borderColor: "rgba(251,191,36,0.3)" }]}>
              <Feather name="clock" size={16} color="#FBBF24" />
              <Text style={{ color: "#FBBF24", fontSize: 13, fontFamily: "Inter_600SemiBold" }}>Receipt submitted — awaiting coach verification</Text>
            </View>
          )}
        </View>

        {/* Payment Actions */}
        {(status === "Unpaid" || status === "Rejected") && !submitted && (
          <>
            {/* QR Code Card */}
            {settings.qrCodeUrl ? (
              <Card style={{ marginBottom: 14, alignItems: "center" }}>
                <Text style={{ fontFamily: "Inter_700Bold", color: c.textPrimary, fontSize: 16, marginBottom: 4, alignSelf: "flex-start" }}>Scan & Pay</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14, alignSelf: "flex-start" }}>
                  Open any UPI app on another phone and scan this QR code to pay ₹{settings.feeAmount.toLocaleString("en-IN")}.
                </Text>
                <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: c.borderSubtle, padding: 12, backgroundColor: "#fff" }}>
                  <Image source={{ uri: settings.qrCodeUrl }} style={{ width: 220, height: 220 }} resizeMode="contain" />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
                  <Feather name="info" size={13} color={c.textDisabled} />
                  <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular" }}>Pay ₹{settings.feeAmount.toLocaleString("en-IN")} to {settings.beneficiaryName}</Text>
                </View>
              </Card>
            ) : null}

            <Card style={{ marginBottom: 14 }}>
              <Text style={{ fontFamily: "Inter_700Bold", color: c.textPrimary, fontSize: 16, marginBottom: 4 }}>Pay via UPI</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 }}>
                {isWeb ? "Tap below to see the UPI ID. Pay using any UPI app on your phone." : "Tap below to open your UPI app with pre-filled details."}
              </Text>
              <Pressable style={[styles.upiBtn, { backgroundColor: "#4CAF50" }]} onPress={handleUpiPay}>
                <Feather name="smartphone" size={20} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 }}>
                  {isWeb ? "Show UPI Details" : `Pay ₹${settings.feeAmount.toLocaleString("en-IN")} via UPI`}
                </Text>
              </Pressable>
              <Divider />
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" }}>UPI ID</Text>
                  <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_700Bold" }}>{settings.upiId}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" }}>Amount</Text>
                  <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_700Bold" }}>₹{settings.feeAmount.toLocaleString("en-IN")}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" }}>Beneficiary</Text>
                  <Text style={{ color: c.textPrimary, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>{settings.beneficiaryName}</Text>
                </View>
              </View>
            </Card>

            <Card style={{ marginBottom: 14 }}>
              <Text style={{ fontFamily: "Inter_700Bold", color: c.textPrimary, fontSize: 16, marginBottom: 4 }}>Upload Payment Screenshot</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 }}>
                {isWeb ? "After paying, click below to pick your payment screenshot." : "After payment, upload your UPI screenshot for verification."}
              </Text>
              {receiptUri ? (
                <View>
                  <Image source={{ uri: receiptUri }} style={styles.receiptPreview} resizeMode="cover" />
                  <Pressable style={styles.removeReceiptBtn} onPress={() => setReceiptUri(null)}>
                    <Feather name="x" size={16} color="#fff" />
                  </Pressable>
                  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="check-circle" size={14} color={c.accentEmerald} />
                    <Text style={{ color: c.accentEmerald, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>Screenshot selected</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable style={[styles.uploadBtn, { backgroundColor: c.primary100, flex: 1 }]} onPress={handlePickImage}>
                    <Feather name="image" size={20} color={c.primary600} />
                    <Text style={{ color: c.primary700, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{isWeb ? "Choose File" : "Gallery"}</Text>
                  </Pressable>
                  {!isWeb && (
                    <Pressable style={[styles.uploadBtn, { backgroundColor: c.primary100, flex: 1 }]} onPress={handleCameraCapture}>
                      <Feather name="camera" size={20} color={c.primary600} />
                      <Text style={{ color: c.primary700, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Camera</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Card>

            <Button onPress={handleSubmit} label="Submit for Verification" fullWidth size="lg" loading={uploading} icon="send" />
          </>
        )}

        {status === "Paid" && !submitted && (
          <Card accentColor={c.accentEmerald}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Feather name="check-circle" size={32} color={c.accentEmerald} />
              <View>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary }}>Payment Complete</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                  {MONTH_LABEL} fee verified on {feeLog?.verifiedAt ? new Date(feeLog.verifiedAt).toLocaleDateString("en-IN") : "—"}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {submitted && (
          <Card accentColor="#F59E0B">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Feather name="clock" size={32} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary }}>Awaiting Verification</Text>
                <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>Your coach will review and approve your receipt shortly.</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Payment History */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="clock" size={16} color={c.textSecondary} />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary }}>Payment History</Text>
          </View>
          {HISTORY_MONTHS.map(({ key, label }) => {
            const log = getStudentFeeStatus(studentId, key);
            const s = log?.status ?? "Unpaid";
            const { icon, color } = statusIcon(s);
            return (
              <View key={key} style={[styles.historyRow, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.textPrimary }}>{label}</Text>
                  {s === "Paid" && log?.verifiedAt && (
                    <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                      Verified {new Date(log.verifiedAt).toLocaleDateString("en-IN")}
                    </Text>
                  )}
                  {s === "Unpaid" && (
                    <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>No payment recorded</Text>
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.textSecondary }}>₹{(log?.amount ?? settings.feeAmount).toLocaleString("en-IN")}</Text>
                  <Feather name={icon} size={18} color={color} />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  amountCard: { borderRadius: 20, borderWidth: 1, padding: 24, marginBottom: 16 },
  statusMsg: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 12, borderRadius: 10, borderWidth: 1, padding: 12 },
  msgBanner: { flexDirection: "row", gap: 10, alignItems: "flex-start", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  upiBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, height: 56, marginBottom: 14 },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, height: 50 },
  receiptPreview: { width: "100%", height: 200, borderRadius: 12 },
  removeReceiptBtn: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  historyRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
});
