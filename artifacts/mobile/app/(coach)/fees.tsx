import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import { FlatList, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, EmptyState, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { FinancialLog, Student } from "@/types";

const generateRecentMonths = () => {
  const history = [];
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    history.push({ key, label });
  }
  return history;
};

const HISTORY_MONTHS = generateRecentMonths();
const THIS_MONTH = HISTORY_MONTHS[0].key;
const MONTH_LABEL = HISTORY_MONTHS[0].label;
const isWeb = Platform.OS === "web";

export default function FeesScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { settings, getCoachBatches, getPendingReceipts, getDefaulters, verifyReceipt, financialLogs, students } = useData();

  const coachId = currentUser?.linkedId ?? "";
  const coachBatches = getCoachBatches(coachId);
  const primaryBatch = coachBatches[0];

  const [tab, setTab] = useState<"pending" | "defaulters" | "history">("pending");
  const [selectedReceipt, setSelectedReceipt] = useState<{ log: FinancialLog; student: Student } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [historyMonth, setHistoryMonth] = useState("2026-06");

  const pendingReceipts = useMemo(
    () => (primaryBatch ? getPendingReceipts(primaryBatch.id) : []),
    [primaryBatch, getPendingReceipts]
  );
  const defaulters = useMemo(
    () => (primaryBatch ? getDefaulters(primaryBatch.id, THIS_MONTH) : []),
    [primaryBatch, getDefaulters]
  );

  const batchStudents = useMemo(
    () => students.filter((s) => s.batchId === primaryBatch?.id && s.status === "active"),
    [students, primaryBatch]
  );

  const historyRows = useMemo(() => {
    return batchStudents.map((student) => {
      const log = financialLogs.find((f) => f.studentId === student.id && f.billingMonth === historyMonth);
      return { student, log, status: log?.status ?? "Unpaid" };
    });
  }, [batchStudents, financialLogs, historyMonth]);

  const historyStats = useMemo(() => {
    const paid = historyRows.filter((r) => r.status === "Paid").length;
    const pending = historyRows.filter((r) => r.status === "Pending").length;
    const unpaid = historyRows.filter((r) => r.status === "Unpaid" || r.status === "Rejected").length;
    const collected = paid * settings.feeAmount;
    return { paid, pending, unpaid, collected };
  }, [historyRows, settings.feeAmount]);

  const handleApprove = async (logId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await verifyReceipt(logId, true, undefined, coachId);
    setSelectedReceipt(null);
  };

  const handleReject = async () => {
    if (!selectedReceipt || !rejectNote.trim()) return;
    await verifyReceipt(selectedReceipt.log.id, false, rejectNote.trim(), coachId);
    setShowRejectModal(false);
    setSelectedReceipt(null);
    setRejectNote("");
  };

  const sendWhatsApp = (student: Student) => {
    const msg = `Dear Parent,\n\nReminder: ${student.name}'s cricket academy fee for ${MONTH_LABEL} (₹${settings.feeAmount}) is pending.\n\nPlease pay via UPI ID: ${settings.upiId} (${settings.beneficiaryName}) and upload the screenshot in the Cricket360 app.\n\nThank you,\nCricket360 Academy`;
    const phone = student.whatsappNo ?? student.parentMobile;
    const encoded = encodeURIComponent(msg);
    const url = isWeb
      ? `https://wa.me/91${phone}?text=${encoded}`
      : `whatsapp://send?phone=91${phone}&text=${encoded}`;
    Linking.openURL(url).catch(() => {});
  };

  const topPad = isWeb ? 67 : insets.top;

  const statusIcon = (s: string) => {
    if (s === "Paid") return { icon: "check-circle" as const, color: "#34D399" };
    if (s === "Pending") return { icon: "clock" as const, color: "#FBBF24" };
    if (s === "Rejected") return { icon: "alert-circle" as const, color: "#F87171" };
    return { icon: "circle" as const, color: "#6B7280" };
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>Fees</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 }}>
          {primaryBatch?.name ?? "Your Batch"} · {MONTH_LABEL}
        </Text>

        <View style={[styles.tabBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          {[
            { key: "pending", label: `Pending (${pendingReceipts.length})` },
            { key: "defaulters", label: `Defaulters (${defaulters.length})` },
            { key: "history", label: "History" },
          ].map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.tabBtn, tab === key && { backgroundColor: c.primary500 }]}
              onPress={() => setTab(key as typeof tab)}
            >
              <Text style={{ color: tab === key ? "#fff" : "rgba(255,255,255,0.6)", fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Pending Receipts */}
      {tab === "pending" && (
        <FlatList
          data={pendingReceipts}
          keyExtractor={(item) => item.log.id}
          contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90, gap: 10 }}
          ListEmptyComponent={<EmptyState icon="check-circle" title="All caught up!" subtitle="No pending receipts to verify" />}
          renderItem={({ item: { log, student } }) => (
            <View style={[styles.receiptCard, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={student.name} size={44} uri={student.photo} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>{student.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                    Submitted {new Date(log.submittedAt ?? "").toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={{ fontFamily: "Inter_700Bold", color: c.textPrimary, fontSize: 15 }}>₹{log.amount.toLocaleString("en-IN")}</Text>
                  <StatusBadge status="Pending" />
                </View>
              </View>
              {log.receiptUri ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 6 }}>PAYMENT SCREENSHOT</Text>
                  <Image source={{ uri: log.receiptUri }} style={{ width: "100%", height: 200, borderRadius: 10 }} resizeMode="cover" />
                </View>
              ) : (
                <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.primary100, borderRadius: 8, padding: 8 }}>
                  <Feather name="image" size={13} color={c.textDisabled} />
                  <Text style={{ color: c.textDisabled, fontSize: 12, fontFamily: "Inter_400Regular" }}>No screenshot attached</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)" }]}
                  onPress={() => handleApprove(log.id)}
                >
                  <Feather name="check" size={16} color="#059669" />
                  <Text style={{ color: "#059669", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Approve</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" }]}
                  onPress={() => { setSelectedReceipt({ log, student }); setShowRejectModal(true); }}
                >
                  <Feather name="x" size={16} color="#DC2626" />
                  <Text style={{ color: "#DC2626", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Reject</Text>
                </Pressable>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Defaulters */}
      {tab === "defaulters" && (
        <FlatList
          data={defaulters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90, gap: 10 }}
          ListEmptyComponent={<EmptyState icon="check-circle" title="No defaulters!" subtitle="All students have paid or submitted receipts" />}
          renderItem={({ item: student }) => (
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar name={student.name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>{student.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 }}>{student.parentMobile}</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <StatusBadge status="Unpaid" />
                    <Text style={{ color: c.accentRed, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>₹{settings.feeAmount.toLocaleString("en-IN")}</Text>
                  </View>
                </View>
                <Pressable style={[styles.waBtn, { backgroundColor: "#22C55E" }]} onPress={() => sendWhatsApp(student)}>
                  <Feather name="message-circle" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 }}>Remind</Text>
                </Pressable>
              </View>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* History */}
      {tab === "history" && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }} showsVerticalScrollIndicator={false}>
          {/* Month Selector */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {HISTORY_MONTHS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.monthChip, { backgroundColor: historyMonth === key ? c.primary600 : c.primary100, flex: 1 }]}
                onPress={() => setHistoryMonth(key)}
              >
                <Text style={{ color: historyMonth === key ? "#fff" : c.primary700, fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center" }}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Summary Row */}
          <View style={[styles.summaryCapsule, { backgroundColor: c.primary900, borderColor: c.primary700 }]}>
            <View style={styles.summaryItem}>
              <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: "#34D399" }}>{historyStats.paid}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" }}>Paid</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: "#FBBF24" }}>{historyStats.pending}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" }}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: "#F87171" }}>{historyStats.unpaid}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" }}>Unpaid</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={{ fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" }}>₹{(historyStats.collected / 1000).toFixed(1)}K</Text>
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" }}>Collected</Text>
            </View>
          </View>

          {/* Per-student List */}
          <View style={{ gap: 8 }}>
            {historyRows.map(({ student, log, status }) => {
              const { icon, color } = statusIcon(status);
              return (
                <View key={student.id} style={[styles.historyRow, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
                  <Avatar name={student.name} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.textPrimary }}>{student.name}</Text>
                    {status === "Paid" && log?.verifiedAt && (
                      <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                        Verified {new Date(log.verifiedAt).toLocaleDateString("en-IN")}
                      </Text>
                    )}
                    {status === "Pending" && log?.submittedAt && (
                      <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                        Submitted {new Date(log.submittedAt).toLocaleDateString("en-IN")}
                      </Text>
                    )}
                    {(status === "Unpaid" || status === "Rejected") && (
                      <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 }}>
                        {status === "Rejected" ? "Receipt rejected" : "No payment recorded"}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <StatusBadge status={status as any} />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.textSecondary }}>
                      ₹{(log?.amount ?? settings.feeAmount).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <Feather name={icon} size={18} color={color} style={{ marginLeft: 8 }} />
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Reject Modal */}
      <Modal visible={showRejectModal} animationType="slide" presentationStyle="formSheet">
        <View style={{ flex: 1, backgroundColor: c.primary050, padding: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: c.textPrimary }}>Reject Receipt</Text>
            <Pressable onPress={() => setShowRejectModal(false)}>
              <Feather name="x" size={24} color={c.textSecondary} />
            </Pressable>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 16 }}>
            Rejecting receipt for <Text style={{ fontWeight: "700", color: c.textPrimary }}>{selectedReceipt?.student.name}</Text>. Please provide a reason so they can re-submit.
          </Text>
          <View style={{ backgroundColor: c.primary100, borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <TextInput
              value={rejectNote}
              onChangeText={setRejectNote}
              placeholder="e.g. Screenshot unclear, amount mismatch..."
              placeholderTextColor={c.textDisabled}
              multiline
              numberOfLines={4}
              style={{ fontSize: 14, color: c.textPrimary, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top" }}
            />
          </View>
          <Button onPress={handleReject} label="Reject with Note" variant="danger" fullWidth size="lg" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  tabBar: { flexDirection: "row", borderRadius: 10, padding: 4, marginTop: 12 },
  tabBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  receiptCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 10, height: 40 },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  monthChip: { height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  summaryCapsule: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginHorizontal: 4 },
  historyRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12 },
});
