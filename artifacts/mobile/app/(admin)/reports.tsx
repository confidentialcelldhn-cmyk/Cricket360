import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, SectionHeader, StatCard } from "@/components/ui";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import {
  AttendanceReportRow,
  FinancialReportRow,
  exportAttendanceCSV,
  exportAttendancePDF,
  exportFinancialCSV,
  exportFinancialPDF,
} from "@/utils/reportExport";

const isWeb = Platform.OS === "web";
const MONTHS = ["2026-06", "2026-05", "2026-04"];
const MONTH_LABELS: Record<string, string> = {
  "2026-06": "June 2026",
  "2026-05": "May 2026",
  "2026-04": "April 2026",
};

type ReportType = "financial" | "attendance" | "performance";
type ExportMode = "csv" | "pdf";

export default function ReportsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { students, batches, attendanceLogs, performanceLogs, financialLogs, settings } = useData();
  const [reportType, setReportType] = useState<ReportType>("financial");
  const [selectedMonth, setSelectedMonth] = useState("2026-06");
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportMode | null>(null);
  const topPad = isWeb ? 67 : insets.top;

  // ── Financial data ─────────────────────────────────────────────────────────
  const financialSummary = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "active");
    const monthLogs = financialLogs.filter((f) => f.billingMonth === selectedMonth);
    const paid = monthLogs.filter((f) => f.status === "Paid").length;
    const pending = monthLogs.filter((f) => f.status === "Pending").length;
    const rejected = monthLogs.filter((f) => f.status === "Rejected").length;
    const unpaid = activeStudents.length - paid - pending - rejected;
    const collected = paid * 1500;
    const expected = activeStudents.length * 1500;
    return { paid, pending, rejected, unpaid: Math.max(0, unpaid), collected, expected, total: activeStudents.length };
  }, [students, financialLogs, selectedMonth]);

  const financialReportRows = useMemo((): FinancialReportRow[] => {
    const activeStudents = students.filter((s) => s.status === "active");
    return activeStudents.map((student) => {
      const batch = batches.find((b) => b.id === student.batchId);
      const log = financialLogs.find((f) => f.studentId === student.id && f.billingMonth === selectedMonth);
      return {
        studentName: student.name,
        batchName: batch?.name ?? "—",
        month: MONTH_LABELS[selectedMonth] ?? selectedMonth,
        amount: log?.amount ?? settings.feeAmount,
        status: log?.status ?? "Unpaid",
        submittedAt: log?.submittedAt,
        verifiedAt: log?.verifiedAt,
      };
    }).sort((a, b) => a.batchName.localeCompare(b.batchName));
  }, [students, batches, financialLogs, selectedMonth, settings.feeAmount]);

  // ── Attendance data ────────────────────────────────────────────────────────
  const attendanceSummary = useMemo(() => {
    return batches.map((batch) => {
      const batchLogs = attendanceLogs.filter((a) => a.batchId === batch.id);
      const totalEntries = batchLogs.reduce((s, l) => s + l.entries.length, 0);
      const presentEntries = batchLogs.reduce((s, l) => s + l.entries.filter((e) => e.status === "Present").length, 0);
      const rate = totalEntries > 0 ? Math.round((presentEntries / totalEntries) * 100) : 0;
      return { batch, sessionsLogged: batchLogs.length, rate, presentEntries, totalEntries };
    });
  }, [batches, attendanceLogs]);

  const attendanceReportRows = useMemo((): AttendanceReportRow[] => {
    const rows: AttendanceReportRow[] = [];
    for (const log of attendanceLogs) {
      const batch = batches.find((b) => b.id === log.batchId);
      for (const entry of log.entries) {
        const student = students.find((s) => s.id === entry.studentId);
        if (student && batch) {
          rows.push({
            date: new Date(log.date).toLocaleDateString("en-IN"),
            batchName: batch.name,
            studentName: student.name,
            status: entry.status,
          });
        }
      }
    }
    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceLogs, batches, students]);

  // ── Performance data ───────────────────────────────────────────────────────
  const performanceSummary = useMemo(() => {
    return batches.map((batch) => {
      const batchPerf = performanceLogs.filter((p) => p.batchId === batch.id);
      const uniqueStudents = new Set(batchPerf.map((p) => p.studentId)).size;
      const avgBatting = batchPerf.filter((p) => !p.battingNA).length > 0
        ? (batchPerf.filter((p) => !p.battingNA).reduce((s, p) => s + (p.footwork + p.shotSelection + p.timing) / 3, 0) /
            batchPerf.filter((p) => !p.battingNA).length).toFixed(1)
        : "N/A";
      return { batch, entriesCount: batchPerf.length, uniqueStudents, avgBatting };
    });
  }, [batches, performanceLogs]);

  // ── Export handlers ────────────────────────────────────────────────────────
  const handleExport = async (mode: ExportMode) => {
    setExporting(mode);
    try {
      if (reportType === "financial") {
        const label = MONTH_LABELS[selectedMonth] ?? selectedMonth;
        const filename = `fee-report-${selectedMonth}.csv`;
        if (mode === "csv") {
          await exportFinancialCSV(financialReportRows, label, filename);
        } else {
          await exportFinancialPDF(financialReportRows, label, settings.academyName);
        }
      } else if (reportType === "attendance") {
        const label = "All Sessions";
        const filename = "attendance-report.csv";
        if (mode === "csv") {
          await exportAttendanceCSV(attendanceReportRows, label, filename);
        } else {
          await exportAttendancePDF(attendanceReportRows, label, settings.academyName);
        }
      }
    } catch (e) {
      // silently handle
    } finally {
      setExporting(null);
    }
  };

  const tabs: { type: ReportType; label: string; icon: any }[] = [
    { type: "financial", label: "Financial", icon: "dollar-sign" },
    { type: "attendance", label: "Attendance", icon: "check-square" },
    { type: "performance", label: "Performance", icon: "star" },
  ];

  const canExport = reportType === "financial" || reportType === "attendance";

  const statusColors: Record<string, string> = {
    Paid: "#34D399", Pending: "#FBBF24", Unpaid: "#F87171", Rejected: "#F87171",
  };
  const statusIcons: Record<string, string> = {
    Paid: "check-circle", Pending: "clock", Unpaid: "circle", Rejected: "alert-circle",
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>Reports</Text>
        <View style={[styles.tabBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.type}
              style={[styles.tab, reportType === tab.type && { backgroundColor: c.primary500 }]}
              onPress={() => setReportType(tab.type)}
            >
              <Feather name={tab.icon} size={14} color={reportType === tab.type ? "#fff" : "rgba(255,255,255,0.6)"} />
              <Text style={{ color: reportType === tab.type ? "#fff" : "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium", fontSize: 12 }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }}>

        {/* Month selector + Download bar */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {reportType === "financial" && MONTHS.map((m) => (
            <Pressable
              key={m}
              style={[styles.monthChip, { backgroundColor: selectedMonth === m ? c.primary600 : c.primary100, flex: 1 }]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text style={{ color: selectedMonth === m ? "#fff" : c.primary700, fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center" }}>
                {MONTH_LABELS[m]}
              </Text>
            </Pressable>
          ))}
          {reportType === "attendance" && (
            <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.textPrimary }}>All Sessions</Text>
          )}
          {reportType === "performance" && (
            <Text style={{ flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.textPrimary }}>Overall Summary</Text>
          )}
        </View>

        {/* Download buttons — financial & attendance only */}
        {canExport && (
          <View style={[styles.downloadBar, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="download" size={15} color={c.textSecondary} />
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.textPrimary }}>Download Report</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                style={[styles.exportBtn, { backgroundColor: c.primary100, borderColor: c.borderSubtle }]}
                onPress={() => handleExport("csv")}
                disabled={exporting !== null}
              >
                {exporting === "csv" ? (
                  <ActivityIndicator size={12} color={c.primary700} />
                ) : (
                  <Feather name="file-text" size={14} color={c.primary700} />
                )}
                <Text style={{ color: c.primary700, fontFamily: "Inter_700Bold", fontSize: 12 }}>CSV</Text>
              </Pressable>
              <Pressable
                style={[styles.exportBtn, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}
                onPress={() => handleExport("pdf")}
                disabled={exporting !== null}
              >
                {exporting === "pdf" ? (
                  <ActivityIndicator size={12} color="#92400E" />
                ) : (
                  <Feather name="file" size={14} color="#92400E" />
                )}
                <Text style={{ color: "#92400E", fontFamily: "Inter_700Bold", fontSize: 12 }}>PDF</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Financial Report */}
        {reportType === "financial" && (
          <>
            <SectionHeader title={`Fee Report — ${MONTH_LABELS[selectedMonth]}`} />
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <StatCard label="Collected" value={`₹${(financialSummary.collected / 1000).toFixed(1)}K`} subtext={`of ₹${(financialSummary.expected / 1000).toFixed(1)}K expected`} accentColor="#10B981" icon="dollar-sign" />
              <StatCard label="Paid" value={financialSummary.paid} subtext={`of ${financialSummary.total} students`} accentColor="#10B981" icon="check-circle" />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <StatCard label="Pending" value={financialSummary.pending} subtext="Awaiting verification" accentColor="#F59E0B" icon="clock" />
              <StatCard label="Unpaid" value={financialSummary.unpaid} subtext="No receipt yet" accentColor="#EF4444" icon="alert-circle" />
            </View>
            <SectionHeader title="Batch-wise Breakdown" />
            {batches.map((batch) => {
              const batchStudents = students.filter((s) => s.batchId === batch.id && s.status === "active");
              const batchLogs = financialLogs.filter((f) => f.billingMonth === selectedMonth && batchStudents.some((s) => s.id === f.studentId));
              const paid = batchLogs.filter((f) => f.status === "Paid").length;
              const rate = batchStudents.length > 0 ? Math.round((paid / batchStudents.length) * 100) : 0;
              const isExpanded = expandedBatch === batch.id;
              const rateColor = rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444";
              return (
                <View key={batch.id} style={{ marginBottom: 10 }}>
                  <Pressable
                    style={[styles.batchCard, { backgroundColor: c.surfaceWhite, borderColor: c.borderSubtle }]}
                    onPress={() => setExpandedBatch(isExpanded ? null : batch.id)}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>{batch.name} — {batch.label}</Text>
                        <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                          {paid}/{batchStudents.length} paid · tap to see individual status
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: rateColor }}>{rate}%</Text>
                        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={c.textSecondary} />
                      </View>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: c.borderSubtle }]}>
                      <View style={[styles.progressFill, { width: `${rate}%` as any, backgroundColor: rateColor }]} />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={[styles.studentList, { backgroundColor: c.primary050, borderColor: c.borderSubtle }]}>
                      {batchStudents.map((student) => {
                        const log = financialLogs.find((f) => f.studentId === student.id && f.billingMonth === selectedMonth);
                        const status = log?.status ?? "Unpaid";
                        return (
                          <View key={student.id} style={[styles.studentRow, { borderBottomColor: c.borderSubtle }]}>
                            <View style={[styles.studentAvatar, { backgroundColor: c.primary100 }]}>
                              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: c.primary700 }}>
                                {student.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                              </Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.textPrimary }}>{student.name}</Text>
                              <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                                {status === "Paid" && log?.verifiedAt ? `Verified ${new Date(log.verifiedAt).toLocaleDateString("en-IN")}` :
                                 status === "Pending" && log?.submittedAt ? `Submitted ${new Date(log.submittedAt).toLocaleDateString("en-IN")}` :
                                 status === "Rejected" ? "Receipt rejected" : "No payment yet"}
                              </Text>
                            </View>
                            <Feather name={statusIcons[status] as any} size={18} color={statusColors[status] ?? "#F87171"} />
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Attendance Report */}
        {reportType === "attendance" && (
          <>
            <SectionHeader title="Attendance Summary" />
            {attendanceSummary.map(({ batch, sessionsLogged, rate, presentEntries }) => (
              <Card key={batch.id} style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary, marginBottom: 8 }}>
                  {batch.name} — {batch.label}
                </Text>
                <View style={{ flexDirection: "row", gap: 20 }}>
                  <View>
                    <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444" }}>{rate}%</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>Avg Attendance</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.textPrimary }}>{sessionsLogged}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>Sessions Logged</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.textPrimary }}>{presentEntries}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>Student-Days Present</Text>
                  </View>
                </View>
                <View style={[styles.progressBar, { backgroundColor: c.borderSubtle, marginTop: 12 }]}>
                  <View style={[styles.progressFill, { width: `${rate}%` as any, backgroundColor: rate >= 75 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#EF4444" }]} />
                </View>
              </Card>
            ))}
            {attendanceSummary.every((s) => s.sessionsLogged === 0) && (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Feather name="calendar" size={40} color={c.textDisabled} />
                <Text style={{ color: c.textSecondary, fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 12 }}>No attendance sessions logged yet</Text>
              </View>
            )}
          </>
        )}

        {/* Performance Report */}
        {reportType === "performance" && (
          <>
            <SectionHeader title="Performance Summary" />
            {performanceSummary.map(({ batch, entriesCount, uniqueStudents, avgBatting }) => (
              <Card key={batch.id} style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary, marginBottom: 8 }}>
                  {batch.name} — {batch.label}
                </Text>
                <View style={{ flexDirection: "row", gap: 20 }}>
                  <View>
                    <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.primary500 }}>{entriesCount}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>Entries Logged</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: c.primary500 }}>{uniqueStudents}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>Students Rated</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 24, fontFamily: "Inter_700Bold", color: "#F59E0B" }}>{avgBatting}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular" }}>Avg Batting</Text>
                  </View>
                </View>
              </Card>
            ))}
            <View style={[styles.downloadBar, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A", marginTop: 8 }]}>
              <Feather name="info" size={14} color="#92400E" />
              <Text style={{ color: "#92400E", fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 }}>
                Performance report download coming soon. Use Financial or Attendance tabs to export data.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 12 },
  tabBar: { flexDirection: "row", borderRadius: 10, padding: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 36, borderRadius: 8 },
  monthChip: { height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  downloadBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 10 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  batchCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  studentList: { borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: "hidden" },
  studentRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  studentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
