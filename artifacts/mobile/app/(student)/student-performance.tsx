import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import { RadarChart } from "@/components/RadarChart";
import { Card, EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { PerformanceLog, PlayingRole } from "@/types";

const isWeb = Platform.OS === "web";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionAvg(log: PerformanceLog, role: PlayingRole | undefined): number {
  const scores: number[] = [];
  if (!log.battingNA && role !== "Bowler") {
    scores.push(log.footwork, log.shotSelection, log.timing);
  }
  if (!log.bowlingNA && role !== "Batsman") {
    scores.push(log.lineAndLength, log.action, log.paceAndVariation);
  }
  if (!log.fieldingNA) {
    scores.push(log.catching, log.groundFielding, log.throwing);
  }
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function SessionBarChart({ logs, role, color }: { logs: PerformanceLog[]; role: PlayingRole | undefined; color: string }) {
  const c = useColors();
  const chartW = isWeb ? 340 : 300;
  const chartH = 130;
  const padL = 28;
  const padR = 12;
  const padT = 10;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const maxVal = 5;

  const reversed = [...logs].reverse();
  const barCount = Math.min(reversed.length, 10);
  const barW = Math.max(14, innerW / (barCount * 1.6));
  const gap = barCount > 1 ? (innerW - barW * barCount) / (barCount - 1) : 0;

  const yScale = (v: number) => padT + innerH - (v / maxVal) * innerH;

  return (
    <Svg width={chartW} height={chartH}>
      {/* Y-axis grid lines + labels */}
      {[0, 1, 2, 3, 4, 5].map((v) => {
        const y = yScale(v);
        return (
          <React.Fragment key={v}>
            <Line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke={c.primary100} strokeWidth={1} strokeDasharray={v === 0 ? "0" : "4,3"} />
            <SvgText x={padL - 4} y={y + 3} fontSize="8" fill={c.textDisabled} textAnchor="end" fontFamily="Inter_400Regular">{v}</SvgText>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {reversed.slice(0, 10).map((log, i) => {
        const avg = sessionAvg(log, role);
        const barH = (avg / maxVal) * innerH;
        const x = padL + i * (barW + gap);
        const y = yScale(avg);
        const dateStr = new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }).replace(" ", "\n");
        return (
          <React.Fragment key={log.id}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
            <SvgText x={x + barW / 2} y={chartH - padB + 10} fontSize="7.5" fill={c.textDisabled} textAnchor="middle" fontFamily="Inter_400Regular">
              {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ─── Skill Bar ────────────────────────────────────────────────────────────────

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: "Inter_400Regular" }}>{label}</Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color }}>{value}/5</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.borderSubtle, overflow: "hidden" }}>
        <View style={{ height: "100%", borderRadius: 3, backgroundColor: color, width: `${(value / 5) * 100}%` }} />
      </View>
    </View>
  );
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

function MonthlySummaryCard({ month, logs, role, colors }: {
  month: string;
  logs: PerformanceLog[];
  role: PlayingRole | undefined;
  colors: ReturnType<typeof useColors>;
}) {
  const c = colors;

  const battingLogs = logs.filter((l) => !l.battingNA);
  const bowlingLogs = logs.filter((l) => !l.bowlingNA);
  const fieldingLogs = logs.filter((l) => !l.fieldingNA);

  const avgOf = (nums: number[]) => nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null;

  const avgBatting = avgOf(battingLogs.flatMap((l) => [l.footwork, l.shotSelection, l.timing]));
  const avgBowling = avgOf(bowlingLogs.flatMap((l) => [l.lineAndLength, l.action, l.paceAndVariation]));
  const avgFielding = avgOf(fieldingLogs.flatMap((l) => [l.catching, l.groundFielding, l.throwing]));

  const showBatting = role !== "Bowler" && avgBatting !== null;
  const showBowling = role !== "Batsman" && avgBowling !== null;

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary }}>{monthLabel(month)}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular" }}>{logs.length} session{logs.length !== 1 ? "s" : ""}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {showBatting && (
          <View style={{ flex: 1, backgroundColor: `${c.primary500}12`, borderRadius: 10, padding: 10, alignItems: "center" }}>
            <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 }}>Batting</Text>
            <Text style={{ color: c.primary600, fontSize: 22, fontFamily: "Inter_700Bold" }}>{avgBatting}</Text>
            <Text style={{ color: c.textDisabled, fontSize: 10, fontFamily: "Inter_400Regular" }}>avg / 5</Text>
          </View>
        )}
        {showBowling && (
          <View style={{ flex: 1, backgroundColor: `${c.accentViolet}12`, borderRadius: 10, padding: 10, alignItems: "center" }}>
            <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 }}>Bowling</Text>
            <Text style={{ color: c.accentViolet, fontSize: 22, fontFamily: "Inter_700Bold" }}>{avgBowling}</Text>
            <Text style={{ color: c.textDisabled, fontSize: 10, fontFamily: "Inter_400Regular" }}>avg / 5</Text>
          </View>
        )}
        {avgFielding !== null && (
          <View style={{ flex: 1, backgroundColor: `${c.accentEmerald}12`, borderRadius: 10, padding: 10, alignItems: "center" }}>
            <Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 }}>Fielding</Text>
            <Text style={{ color: c.accentEmerald, fontSize: 22, fontFamily: "Inter_700Bold" }}>{avgFielding}</Text>
            <Text style={{ color: c.textDisabled, fontSize: 10, fontFamily: "Inter_400Regular" }}>avg / 5</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = "overview" | "monthly" | "history";

export default function StudentPerformanceScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { students, coaches, getStudentPerformance } = useData();

  const studentId = currentUser?.linkedId ?? "";
  const student = students.find((s) => s.id === studentId);
  const role = student?.playingRole;

  const allLogs = useMemo(() => getStudentPerformance(studentId), [studentId, getStudentPerformance]);
  const latestLog = allLogs[0];
  const topPad = isWeb ? 67 : insets.top;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // ── Role-aware radar skills (latest session) ──
  const radarSkills = useMemo(() => {
    if (!latestLog) return [];
    const batting = [
      { label: "Footwork", value: latestLog.footwork, isNA: latestLog.battingNA },
      { label: "Shot Sel", value: latestLog.shotSelection, isNA: latestLog.battingNA },
      { label: "Timing", value: latestLog.timing, isNA: latestLog.battingNA },
    ];
    const bowling = [
      { label: "Line&Len", value: latestLog.lineAndLength, isNA: latestLog.bowlingNA },
      { label: "Action", value: latestLog.action, isNA: latestLog.bowlingNA },
      { label: "Pace&Var", value: latestLog.paceAndVariation, isNA: latestLog.bowlingNA },
    ];
    const fielding = [
      { label: "Catching", value: latestLog.catching, isNA: latestLog.fieldingNA },
      { label: "Ground", value: latestLog.groundFielding, isNA: latestLog.fieldingNA },
      { label: "Throwing", value: latestLog.throwing, isNA: latestLog.fieldingNA },
    ];
    if (role === "Batsman") return [...batting, ...fielding];
    if (role === "Bowler") return [...bowling, ...fielding];
    return [...batting, ...bowling, ...fielding];
  }, [latestLog, role]);

  // ── Monthly grouping ──
  const monthlyGroups = useMemo(() => {
    const groups: Record<string, PerformanceLog[]> = {};
    allLogs.forEach((log) => {
      const m = log.date.slice(0, 7);
      if (!groups[m]) groups[m] = [];
      groups[m].push(log);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [allLogs]);

  const currentMonthKey = selectedMonth ?? monthlyGroups[0]?.[0] ?? null;
  const currentMonthLogs = currentMonthKey
    ? (monthlyGroups.find(([m]) => m === currentMonthKey)?.[1] ?? [])
    : [];

  // ── Latest averages (header badges) ──
  const avgBatting = latestLog && !latestLog.battingNA && role !== "Bowler"
    ? ((latestLog.footwork + latestLog.shotSelection + latestLog.timing) / 3).toFixed(1) : null;
  const avgBowling = latestLog && !latestLog.bowlingNA && role !== "Batsman"
    ? ((latestLog.lineAndLength + latestLog.action + latestLog.paceAndVariation) / 3).toFixed(1) : null;
  const avgFielding = latestLog && !latestLog.fieldingNA
    ? ((latestLog.catching + latestLog.groundFielding + latestLog.throwing) / 3).toFixed(1) : null;

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "monthly", label: "Monthly" },
    { key: "history", label: "History" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>My Performance</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>
          {allLogs.length} session rating{allLogs.length !== 1 ? "s" : ""}
          {role ? ` · ${role}` : ""}
        </Text>

        {/* Latest averages */}
        {latestLog && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            {avgBatting && (
              <View style={styles.avgBadge}>
                <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Inter_400Regular" }}>Batting</Text>
                <Text style={{ color: c.accentGold, fontSize: 18, fontFamily: "Inter_700Bold" }}>{avgBatting}</Text>
              </View>
            )}
            {avgBowling && (
              <View style={styles.avgBadge}>
                <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Inter_400Regular" }}>Bowling</Text>
                <Text style={{ color: "#A78BFA", fontSize: 18, fontFamily: "Inter_700Bold" }}>{avgBowling}</Text>
              </View>
            )}
            {avgFielding && (
              <View style={styles.avgBadge}>
                <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Inter_400Regular" }}>Fielding</Text>
                <Text style={{ color: "#34D399", fontSize: 18, fontFamily: "Inter_700Bold" }}>{avgFielding}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tab bar */}
        <View style={[styles.tabBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && { backgroundColor: c.primary500, borderRadius: 8 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={{ fontFamily: activeTab === tab.key ? "Inter_700Bold" : "Inter_400Regular", fontSize: 13, color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.65)" }}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }} showsVerticalScrollIndicator={false}>
        {allLogs.length === 0 ? (
          <EmptyState icon="star" title="No ratings yet" subtitle="Your coach will rate your performance after each session" />
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <>
                {/* Role-aware Radar */}
                <SectionHeader title={role === "Batsman" ? "Batting & Fielding Radar" : role === "Bowler" ? "Bowling & Fielding Radar" : "Skills Radar"} />
                <Card style={{ alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 }}>
                    Latest session · {new Date(latestLog!.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                  <RadarChart skills={radarSkills} size={isWeb ? 280 : 240} />
                </Card>

                {/* Bar chart for current month */}
                {currentMonthKey && currentMonthLogs.length > 0 && (
                  <>
                    <SectionHeader title={`${monthLabel(currentMonthKey)} — Session Scores`} />
                    <Card style={{ marginBottom: 16, alignItems: "center" }}>
                      <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", alignSelf: "flex-start", marginBottom: 8 }}>
                        Average score per session (out of 5)
                      </Text>
                      <SessionBarChart logs={currentMonthLogs} role={role} color={c.primary500} />
                    </Card>
                  </>
                )}

                {/* Latest skill breakdown */}
                {latestLog && (
                  <>
                    {!latestLog.battingNA && role !== "Bowler" && (
                      <Card accentColor={c.primary500} style={{ marginBottom: 10 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary, marginBottom: 10 }}>Batting</Text>
                        <SkillBar label="Footwork" value={latestLog.footwork} color={c.primary500} />
                        <SkillBar label="Shot Selection" value={latestLog.shotSelection} color={c.primary500} />
                        <SkillBar label="Timing" value={latestLog.timing} color={c.primary500} />
                      </Card>
                    )}
                    {!latestLog.bowlingNA && role !== "Batsman" && (
                      <Card accentColor={c.accentViolet} style={{ marginBottom: 10 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary, marginBottom: 10 }}>Bowling</Text>
                        <SkillBar label="Line & Length" value={latestLog.lineAndLength} color={c.accentViolet} />
                        <SkillBar label="Action" value={latestLog.action} color={c.accentViolet} />
                        <SkillBar label="Pace & Variation" value={latestLog.paceAndVariation} color={c.accentViolet} />
                      </Card>
                    )}
                    {!latestLog.fieldingNA && (
                      <Card accentColor={c.accentEmerald} style={{ marginBottom: 10 }}>
                        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary, marginBottom: 10 }}>Fielding</Text>
                        <SkillBar label="Catching" value={latestLog.catching} color={c.accentEmerald} />
                        <SkillBar label="Ground Fielding" value={latestLog.groundFielding} color={c.accentEmerald} />
                        <SkillBar label="Throwing" value={latestLog.throwing} color={c.accentEmerald} />
                      </Card>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── MONTHLY TAB ── */}
            {activeTab === "monthly" && (
              <>
                {/* Month selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {monthlyGroups.map(([m]) => (
                      <Pressable
                        key={m}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: currentMonthKey === m ? c.primary600 : c.surfaceWhite, borderWidth: 1, borderColor: currentMonthKey === m ? c.primary500 : c.borderSubtle }}
                        onPress={() => setSelectedMonth(m)}
                      >
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: currentMonthKey === m ? "#fff" : c.textPrimary }}>{monthLabel(m)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {currentMonthKey && (
                  <>
                    {/* Monthly aggregate card */}
                    <MonthlySummaryCard month={currentMonthKey} logs={currentMonthLogs} role={role} colors={c} />

                    {/* Bar chart for selected month */}
                    {currentMonthLogs.length > 0 && (
                      <Card style={{ marginBottom: 16, alignItems: "center" }}>
                        <Text style={{ color: c.textSecondary, fontFamily: "Inter_600SemiBold", fontSize: 14, alignSelf: "flex-start", marginBottom: 8 }}>Session Comparison</Text>
                        <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular", alignSelf: "flex-start", marginBottom: 8 }}>
                          Average score per session (out of 5)
                        </Text>
                        <SessionBarChart logs={currentMonthLogs} role={role} color={c.primary500} />
                      </Card>
                    )}

                    {/* All months summary list */}
                    <SectionHeader title="All Months" />
                    {monthlyGroups.map(([m, logs]) => (
                      <MonthlySummaryCard key={m} month={m} logs={logs} role={role} colors={c} />
                    ))}
                  </>
                )}
              </>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === "history" && (
              <>
                <SectionHeader title="All Sessions" />
                {allLogs.map((log) => {
                  const coach = coaches.find((co) => co.id === log.coachId);
                  const avg = sessionAvg(log, role);
                  return (
                    <Card key={log.id} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "Inter_600SemiBold", color: c.textPrimary, fontSize: 14 }}>
                            {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </Text>
                          <Text style={{ color: c.textSecondary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                            Rated by {coach?.name ?? "Coach"} · Avg {avg.toFixed(1)}/5
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {!log.battingNA && role !== "Bowler" && <StatusBadge status="Batting" />}
                          {!log.bowlingNA && role !== "Batsman" && <StatusBadge status="Bowling" />}
                          {!log.fieldingNA && <StatusBadge status="Fielding" />}
                        </View>
                      </View>
                      {log.remarks ? (
                        <View style={[styles.remarkBox, { backgroundColor: c.primary050, borderColor: c.borderSubtle }]}>
                          <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" }}>
                            "{log.remarks}"
                          </Text>
                        </View>
                      ) : null}
                    </Card>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  avgBadge: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 12, alignItems: "center", gap: 2 },
  remarkBox: { marginTop: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  tabBar: { flexDirection: "row", borderRadius: 10, padding: 3, marginTop: 14, marginBottom: 0 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 7 },
});
