import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { Schedule } from "@/types";

const TODAY = "2026-06-23";
const isWeb = Platform.OS === "web";

const SESSION_COLORS: Record<Schedule["type"], string> = {
  Practice: "#2563EB",
  Match: "#7C3AED",
  Tournament: "#F59E0B",
};

const SESSION_ICONS: Record<Schedule["type"], keyof typeof Feather.glyphMap> = {
  Practice: "activity",
  Match: "award",
  Tournament: "star",
};

export default function ScheduleScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { students, schedules } = useData();

  const studentId = currentUser?.linkedId ?? "";
  const student = students.find((s) => s.id === studentId);

  const { upcoming, past } = useMemo(() => {
    const batchSchedules = schedules.filter((s) => student && s.batchId === student.batchId);
    const upcoming = batchSchedules
      .filter((s) => s.date >= TODAY)
      .sort((a, b) => a.date.localeCompare(b.date));
    const past = batchSchedules
      .filter((s) => s.date < TODAY)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
    return { upcoming, past };
  }, [schedules, student]);

  const sections = [
    ...(upcoming.length > 0 ? [{ title: "Upcoming Sessions", data: upcoming }] : []),
    ...(past.length > 0 ? [{ title: "Past Sessions", data: past }] : []),
  ];

  const topPad = isWeb ? 67 : insets.top;

  const SessionCard = ({ item, isPast }: { item: Schedule; isPast?: boolean }) => {
    const color = SESSION_COLORS[item.type];
    const icon = SESSION_ICONS[item.type];
    return (
      <Card accentColor={isPast ? c.borderSubtle : color} style={{ marginBottom: 10, opacity: isPast ? 0.7 : 1 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View style={[styles.sessionIcon, { backgroundColor: isPast ? c.primary100 : `${color}18` }]}>
            <Feather name={icon} size={20} color={isPast ? c.textDisabled : color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <StatusBadge status={item.type} />
              {item.isRecurring && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Feather name="repeat" size={11} color={c.textDisabled} />
                  <Text style={{ color: c.textDisabled, fontSize: 11, fontFamily: "Inter_400Regular" }}>Weekly</Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: c.textPrimary }}>
              {new Date(item.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Feather name="clock" size={13} color={c.textSecondary} />
              <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium" }}>{item.time}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Feather name="map-pin" size={13} color={c.textSecondary} />
              <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" }}>{item.venue}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.primary050 }}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: c.primary900 }]}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 }}>
          {student?.batchId ? `Group ${student.batchId.replace("batch-", "").toUpperCase()}` : "Your Batch"} Sessions
        </Text>

        {/* Legend */}
        <View style={{ flexDirection: "row", gap: 14, marginTop: 12 }}>
          {(["Practice", "Match", "Tournament"] as const).map((type) => (
            <View key={type} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: SESSION_COLORS[type] }} />
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" }}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      {sections.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No sessions scheduled"
          subtitle="Your coach will add sessions soon"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 100 : 90 }}
          renderItem={({ item, section }) => (
            <SessionCard item={item} isPast={section.title === "Past Sessions"} />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: c.textPrimary, marginBottom: 10, marginTop: 4 }}>
              {section.title}
            </Text>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 24, fontFamily: "Inter_700Bold" },
  sessionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
